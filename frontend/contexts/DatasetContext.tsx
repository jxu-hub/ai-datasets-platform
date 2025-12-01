import { uploadPreviewData, uploadToMinioApi, createDatasetApi } from "@/lib/api/dataset"
import type { DatasetUploadContextParams, DatasetUploadForm } from "@/types"
import {
  initMultipartUpload,
  getPartUploadUrl,
  putPartToMinio,
  completeMultipartUpload,
  abortMultipartUploadApi,
} from "@/lib/api/dataset";
import { deleteDatasetAndFileApi } from "@/lib/api/dataset"
import { getFreeDatasets, getPaidDatasets, getDatasetById, getPaidDatasetsByAuthor, getDatasetPreviewByObjectName } from "@/lib/api/dataset";
import { startPaidDownloadTask as apiStartPaidDownloadTask, getPaidDownloadTaskStatus as apiGetPaidDownloadTaskStatus } from "@/lib/api/dataset";
import { useState, useRef, useCallback } from "react";

type PartInfo = { etag: string, size: number };

// 上传预览数据
export async function uploadPreviewDataOnly(params: { userId: number; ownerAddress: string; previewLines: string[]; objectName: string; fileSize: number }): Promise<string> {
  return await uploadPreviewData(params);
}

// 数据集上传到minio
export async function uploadToMinio(file: File, url: string, setUploadProgress?: (progress: number) => void) {
  return uploadToMinioApi(file, url, setUploadProgress);
}

// 
export async function uploadDataset(form: DatasetUploadForm): Promise<any> {
  // 只提交元数据，不上传文件
  return await createDatasetApi(form);
}

export async function multipartUploadWithResume(
  file: File,
  objectName: string,
  setProgress?: (progress: number, bytes: number) => void,
  concurrency: number = 4,
  pauseRef?: React.MutableRefObject<boolean>,
  abortControllersRef?: React.MutableRefObject<AbortController[]>,
  initialUploadedBytes: number = 0,
  setObjectName?: (objectName: string) => void 
) {
  const stateKey = `multipart-upload-${objectName}`;
  let state: { uploadId: string, objectName: string, parts: Record<number, PartInfo>, fileSize: number, fileName: string } | null = null;
  const saved = localStorage.getItem(stateKey);
  if (saved) {
    state = JSON.parse(saved);
    if (state && (state.fileSize !== file.size || state.fileName !== file.name)) {
      state = null;
    }
  }

  let uploadId = state?.uploadId;
  if (!uploadId) {
    const { uploadId: newUploadId } = await initMultipartUpload(objectName);
    uploadId = newUploadId;
    state = {
      uploadId: uploadId!,
      objectName,
      parts: {},
      fileSize: file.size,
      fileName: file.name,
    };
    localStorage.setItem(stateKey, JSON.stringify(state));
  }
  if (!state) return;

  const chunkSize = 5 * 1024 * 1024;
  const chunks = Math.ceil(file.size / chunkSize);
  const parts: { ETag: string; PartNumber: number }[] = [];
  let uploadedBytesRef = 0;
  if (state && state.parts) {
    for (const [partNumber, etag] of Object.entries(state.parts)) {
      parts.push({ ETag: etag.etag, PartNumber: Number(partNumber) });
      uploadedBytesRef += etag.size;
    }
  }

  let error: any = null;
  let current = 0;
  let uploading = 0;
  let isPaused = false;
  let resolveOuter: (() => void) | null = null;
  let rejectOuter: ((err: any) => void) | null = null;
  const partProgress = new Array(chunks).fill(0);

  async function uploadPart(i: number) {
    if (!state) return;
    const partNumber = i + 1;
    if (state.parts[partNumber]) return;
    const start = i * chunkSize;
    const end = Math.min(file.size, start + chunkSize);
    const chunk = file.slice(start, end);

    const partUrl = await getPartUploadUrl(objectName, uploadId!, partNumber);
    console.log("partNumber", partNumber);
    // 新增：为每个分片创建 AbortController
    const abortController = new AbortController();
    if (abortControllersRef) {
      abortControllersRef.current.push(abortController);
    }
    // axios 支持 signal 参数
    const res = await putPartToMinio(partUrl, chunk, (loaded) => {
      partProgress[i] = loaded;
      if (setProgress) setProgress(0, initialUploadedBytes + partProgress.reduce((a, b) => a + b, 0));
    }, abortController.signal);
    const headers = res.headers as any;
    const etag: string = String(headers.etag ?? '');
    parts.push({ ETag: etag, PartNumber: partNumber });
    state.parts[partNumber] = { etag, size: chunk.size };
    partProgress[i] = chunk.size;
    localStorage.setItem(stateKey, JSON.stringify(state));
    if (setProgress) setProgress(0, initialUploadedBytes + partProgress.reduce((a, b) => a + b, 0));
  }

  function next() {
    if (error) return;
    if (pauseRef && pauseRef.current) {
      isPaused = true;
      return; // 立即暂停，不再递归 next
    }
    isPaused = false;
    if (current >= chunks && uploading === 0) {
      completeMultipartUpload(objectName, uploadId!, parts.sort((a, b) => a.PartNumber - b.PartNumber))
        .then((data) => {
          localStorage.removeItem(stateKey);
          if (setObjectName && data && data.objectName) setObjectName(data.objectName);
          if (resolveOuter) resolveOuter();
        })
        .catch((err) => {
          // 只在非主动取消时才报错
          if (err && (err.name === 'CanceledError' || err.code === 'ERR_CANCELED')) {
            // 主动暂停，静默
            return;
          }
          if (rejectOuter) rejectOuter(err);
        });
      return;
    }
    while (uploading < concurrency && current < chunks) {
      if (pauseRef && pauseRef.current) {
        isPaused = true;
        return;
      }
      const i = current++;
      uploading++;
      uploadPart(i).then(() => {
        uploading--;
        next();
      }).catch((err) => {
        // 只在非主动取消时才报错
        if (err && (err.name === 'CanceledError' || err.code === 'ERR_CANCELED')) {
          uploading--;
          return;
        }
        error = err;
        if (rejectOuter) rejectOuter(err);
      });
    }
  }

  // 返回 resume/pause 控制对象
  return new Promise<void>((resolve, reject) => {
    resolveOuter = resolve;
    rejectOuter = reject;
    next();
    // 挂载 resume 方法
    if (pauseRef) {
      (pauseRef as any).resume = () => {
        if (!isPaused) return;
        pauseRef.current = false;
        next();
      };
    }
  });
}

// 取消分片上传业务方法
export async function cancelMultipartUpload(objectName: string, uploadId: string) {
  const res = await abortMultipartUploadApi(objectName, uploadId);
  return res.data.data.message;
}

// 补偿机制：数据库和minio回滚
export async function rollbackDataset(datasetId: number, objectName: string) {
  return deleteDatasetAndFileApi(datasetId, objectName);
}

// 获取免费数据集（业务层）
export async function fetchFreeDatasets(params: { page?: number; limit?: number; category?: string; search?: string; fileSizeRange?: string }) {
  const res = await getFreeDatasets(params);
  return res;
}

// 获取付费数据集（业务层）
export async function fetchPaidDatasets(params: { page?: number; limit?: number; category?: string; search?: string; fileSizeRange?: string; priceRange?: string }) {
  const res = await getPaidDatasets(params);
  return res;
}

// 获取指定作者的付费数据集
export async function fetchPaidDatasetsByAuthor(authorWalletAddress: string, page = 1, limit = 3) {
  return await getPaidDatasetsByAuthor(authorWalletAddress, page, limit);
}

// 获取单条数据集详情
export async function fetchDatasetById(id: number) {
  return await getDatasetById(id);
}

// 获取数据集预览数据（业务层）
export async function fetchDatasetPreviewByObjectName(objectName: string) {
  return await getDatasetPreviewByObjectName(objectName);
}

// 获取免费数据集下载链接（业务层）
export async function downloadFreeDataset(datasetId: number) {
  return await import('@/lib/api/dataset').then(m => m.downloadFreeDataset(datasetId));
}

// 购买数据集（完整链路）

// 发起付费下载任务
export async function startPaidDownloadTask(datasetId: number) {
  return apiStartPaidDownloadTask(datasetId);
}
// 查询付费下载任务状态
export async function getPaidDownloadTaskStatus(datasetId: number, objectName: string) {
  return apiGetPaidDownloadTaskStatus(datasetId, objectName);
}

// 付费下载伪进度条业务逻辑，返回 {progress, status, modalOpen, startDownload}
export function usePaidDownloadWithProgress(dataset: { id: number; fileSize: number; objectName?: string } | null) {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const pollingRef = useRef(false);

  // 启动下载
  const startDownload = useCallback(async () => {
    if (!dataset || !dataset.objectName) return;
    setProgress(0);
    setStatus('正在准备下载...');
    setModalOpen(true);
    pollingRef.current = true;
    await startPaidDownloadTask(dataset.id); // 只发起任务
    let polling = true;
    while (polling && pollingRef.current) {
      // 轮询获取进度和任务信息
      const statusRes = await getPaidDownloadTaskStatus(dataset.id, dataset.objectName);
      // statusRes: { url, progressPercent, status }
      const progressPercent = statusRes.progressPercent ?? 0;
      setProgress(progressPercent);
      if ((progressPercent >= 100 || statusRes.status === 1) && statusRes.url) {
        setProgress(100);
        setStatus('下载链接已生成，正在下载...');
        console.log("url = ", statusRes.url);
        // 自动下载
        const a = document.createElement('a');
        a.href = statusRes.url;
        a.download = '';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        polling = false;
        setModalOpen(false); // 立即关闭模态框
        break;
      }
      await new Promise(res => setTimeout(res, 1800));
    }
  }, [dataset]);

  // 关闭弹窗时停止轮询
  const closeModal = useCallback(() => {
    pollingRef.current = false;
    setModalOpen(false);
  }, []);

  return { progress, status, modalOpen, startDownload, closeModal };
}

export function useDataset() {
  return { uploadDataset, rollbackDataset, fetchFreeDatasets, fetchPaidDatasets, fetchDatasetById, fetchPaidDatasetsByAuthor, fetchDatasetPreviewByObjectName, downloadFreeDataset, startPaidDownloadTask, getPaidDownloadTaskStatus }
}

