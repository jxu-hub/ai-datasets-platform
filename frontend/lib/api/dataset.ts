import axios from 'axios'
import type { DatasetUploadForm } from '@/types'
const BASE_URL = process.env.NEXT_PUBLIC_API_BASE

// 上传预览数据集数据
export async function uploadPreviewData(params: { userId: number; ownerAddress: string; previewLines: string[]; objectName: string; fileSize: number }): Promise<string> {
  const { userId, ownerAddress, previewLines, objectName, fileSize } = params;
  const res = await axios.post(`${BASE_URL}/dataset/upload-preview`, {
    userId,
    ownerAddress,
    previewData: previewLines,
    objectName,
    fileSize,
  }, { withCredentials: true });
  console.log("res.url = ", res)
  return res.data.data.url;
}

// 上传数据集到minio
export async function uploadToMinioApi(file: File, url: string, setUploadProgress?: (progress: number) => void) {
  return axios.put(url, file, {
    headers: { 'Content-Type': file.type || 'application/octet-stream' },
    onUploadProgress: setUploadProgress ? (e) => {
      if (e.total) setUploadProgress(Math.round((e.loaded / e.total) * 100));
    } : undefined
  });
}

// 上传数据集
export async function createDatasetApi(form: DatasetUploadForm): Promise<any> {
  const res = await axios.post(`${BASE_URL}/dataset/upload-dataset`, form, {
    withCredentials: true,
    headers: { "Content-Type": "application/json" },
  });
  return res.data.data;
}

// 初始化分片上传
export async function initMultipartUpload(fileName: string) {
  const res = await axios.post(`${BASE_URL}/dataset/init-multipart`, { fileName }, { withCredentials: true });
  return res.data.data; // { uploadId, objectName }
}

// 获取分片 presigned url
export async function getPartUploadUrl(objectName: string, uploadId: string, partNumber: number) {
  const res = await axios.post(`${BASE_URL}/dataset/get-part-url`, { objectName, uploadId, partNumber }, { withCredentials: true });
  return res.data.data.url as string;
}

// 上传分片
export async function putPartToMinio(partUrl: string, chunk: Blob, setUploadProgress?: (progress: number) => void, signal?: AbortSignal) {
  return axios.put(partUrl, chunk, {
    headers: { "Content-Type": "application/octet-stream" },
    onUploadProgress: setUploadProgress ? (e) => {
      if (e.total) setUploadProgress(Math.round((e.loaded / e.total) * 100));
    } : undefined,
    signal,
  });
}

// 合并分片
export async function completeMultipartUpload(objectName: string, uploadId: string, parts: { ETag: string, PartNumber: number }[]) {
  const res = await axios.post(`${BASE_URL}/dataset/complete-multipart`, { objectName, uploadId, parts }, { withCredentials: true });
  return res.data.data; // { objectName, message }
}

// 取消分片上传
export async function abortMultipartUploadApi(objectName: string, uploadId: string) {
  return axios.post(`${BASE_URL}/dataset/abort-multipart`, { objectName, uploadId }, { withCredentials: true });
}

// 删除数据集和minio文件
export async function deleteDatasetAndFileApi(datasetId: number, objectName: string) {
  return axios.post(`${BASE_URL}/dataset/delete-dataset`, { datasetId, objectName }, {
    withCredentials: true,
    headers: { "Content-Type": "application/json" },
  });
}

// 获取免费数据集
export async function getFreeDatasets(params: { page?: number; limit?: number; category?: string; search?: string; fileSizeRange?: string }) {
  const res = await axios.get(`${BASE_URL}/dataset/list`, {
    params: {
      ...params,
      is_free: true,
    },
    withCredentials: true,
  });
  return res.data.data;
}

// 获取付费数据集
export async function getPaidDatasets(params: { page?: number; limit?: number; category?: string; search?: string; fileSizeRange?: string; priceRange?: string }) {
  const res = await axios.get(`${BASE_URL}/dataset/list`, {
    params: {
      ...params,
      is_free: false,
    },
    withCredentials: true,
  });
  return res.data.data;
}

// 获取指定作者的付费数据集
export async function getPaidDatasetsByAuthor(authorWalletAddress: string, page = 1, limit = 3) {
  const res = await axios.get(`${BASE_URL}/dataset/paid-by-author`, {
    params: { authorWalletAddress: authorWalletAddress, page, limit },
    withCredentials: true,
  });
  return res.data.data;
}

// 获取指定作者的所有数据集（免费+付费）
export async function getDatasetsByAuthorApi(authorWalletAddress: string, page = 1, limit = 1000) {
  const res = await axios.get(`${BASE_URL}/dataset/datasets-by-author`, {
    params: { authorWalletAddress: authorWalletAddress, page, limit },
    withCredentials: true,
  });
  return res.data.data;
}


// 获取单条数据集详情
export async function getDatasetById(id: number) {
  const res = await axios.get(`${BASE_URL}/dataset/detail`, { params: { datasetId: id }, withCredentials: true });
  return res.data.data;
}

// 获取数据集预览数据
export async function getDatasetPreviewByObjectName(objectName: string) {
  const res = await axios.get(`${BASE_URL}/dataset/preview`, {
    params: { objectName },
    withCredentials: true,
  });
  return res.data.data;
}

// 获取免费数据集下载链接
export async function downloadFreeDataset(datasetId: number): Promise<string> {
  const res = await axios.get(`${BASE_URL}/dataset/download-free`, {
    params: { datasetID: datasetId },
    withCredentials: true,
  });
  if (res.data.code === 200 && res.data.data?.url) {
    return res.data.data.url;
  } else {
    throw new Error(res.data.msg || '获取下载链接失败');
  }
}

// 发起付费下载任务，返回objectName
export async function startPaidDownloadTask(datasetId: number): Promise<{ objectName: string }> {
  const res = await axios.get(`${BASE_URL}/dataset/download-paid`, { params: { datasetID: datasetId }, withCredentials: true });
  if (res.data.code === 200) {
    return res.data.data as { objectName: string };
  }
  throw new Error(res.data.msg || '发起下载任务失败');
}

// 查询付费下载任务状态，需传递 objectName 和 datasetID
export async function getPaidDownloadTaskStatus(datasetId: number, objectName: string): Promise<{ url: string, progressPercent: number, status: 0|1 }> {
  const res = await axios.get(`${BASE_URL}/dataset/download-status`, {
    params: { datasetID: datasetId, objectName },
    withCredentials: true,
  });
  if (res.data.code === 200 && res.data.data) {
    return {
      url: res.data.data.url,
      progressPercent: res.data.data.progress, // 后端taskId即进度百分比
      status: res.data.data.status
    };
  } else {
    throw new Error(res.data.msg || '查询下载任务状态失败');
  }
}