"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { useRole } from "@/hooks/useRole"
import { PageHeader } from "@/components/layout/PageHeader"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import {
  Upload,
  FileText,
  ImageIcon,
  Tag,
  Loader2,
  X,
  Plus,
  Pause,
  Play,
} from "lucide-react"
import { toast } from "sonner"
import contract, { getWritableContract } from '@/contract/contractConnect'
import { useEffect, useRef } from 'react'
import { uploadPreviewDataOnly, cancelMultipartUpload, uploadToMinio, uploadDataset, multipartUploadWithResume } from "@/contexts/DatasetContext"
import type { UploadForm, DatasetUploadForm, DatasetUploadContextParams } from "@/types"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ShieldX } from "lucide-react"
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogFooter, AlertDialogTitle, AlertDialogDescription } from "@/components/ui/alert-dialog";
import { useDataset } from "@/contexts/DatasetContext"
import { useWallet } from "@/contexts/WalletContext"
import { ethers } from "ethers";

// 数据集类别（与首页分类同步，仅文本相关）
const DATASET_CATEGORIES = [
  "自然语言处理",
  "文本分类",
  "推荐系统",
  "金融数据",
  "问答系统",
  "情感分析",
  "对话系统",
  "信息抽取",
]

// 分类标签映射
const CATEGORY_LABELS: Record<string, string> = {
  "自然语言处理": "自然语言处理",
  "文本分类": "文本分类",
  "推荐系统": "推荐系统",
  "金融数据": "金融数据",
  "问答系统": "问答系统",
  "情感分析": "情感分析",
  "对话系统": "对话系统",
  "信息抽取": "信息抽取",
}


export default function UploadPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { isSeller } = useRole()
  const { verifyWalletAddress, wallet } = useWallet();
  const { rollbackDataset } = useDataset();
  // 移除 useDataset 的所有引用和调用

  const [form, setForm] = useState<UploadForm>({
    title: "",
    description: "",
    category: "",
    tags: [],
    is_free: true,
    price: 0,
    file: null,
    license: "MIT",
    file_url: "",
    file_size: 0,
    file_format: "",
  })

  const [newTag, setNewTag] = useState("")
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [feeRate, setFeeRate] = useState<number>(0)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [presignedUrl, setPresignedUrl] = useState<string | null>(null)
  const [previewLines, setPreviewLines] = useState<string[]>([])
  const [uploadedBytes, setUploadedBytes] = useState(0);
  const [resumeTip, setResumeTip] = useState("");
  const [resumeError, setResumeError] = useState(false);
  const [resumeFileKey, setResumeFileKey] = useState<string | null>(null);
  const [hasPendingUpload, setHasPendingUpload] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const pauseRef = useRef(false);
  const abortControllersRef = useRef<AbortController[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [needFileSelect, setNeedFileSelect] = useState(false);

  const ownerAddress = user?.walletAddress || "";
  const userId = user?.id || 0;

  // 页面加载时获取平台手续费
  useEffect(() => {
    async function fetchFeeRate() {
      try {
        const rate = await contract.feeRate?.()
        setFeeRate(Number(rate) || 0)
      } catch { }
    }
    fetchFeeRate()
  }, [])

  // useEffect 页面加载时自动检测并恢复未完成上传
  useEffect(() => {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('multipart-upload-')) {
        const saved = localStorage.getItem(key);
        if (saved) {
          try {
            const state = JSON.parse(saved);
            if (state && state.fileName && state.fileSize) {
              // 构造一个 File 对象的占位信息（真实 File 需用户重新选择，但可用于 UI 展示）
              setForm((prev: UploadForm) => ({
                ...prev,
                file: {
                  name: state.fileName,
                  size: state.fileSize,
                  type: state.fileType || 'application/octet-stream',
                  // @ts-ignore
                  lastModified: state.lastModified || Date.now(),
                } as File,
                file_size: state.fileSize,
                file_format: state.fileName.split('.').pop() || 'jsonl',
              }));
              // 计算已上传字节
              let uploadedBytes = 0;
              if (state.parts) {
                uploadedBytes = Object.values(state.parts).reduce((sum: number, part: any) => {
                  if (part && typeof part.size === 'number') {
                    return sum + part.size;
                  }
                  return sum;
                }, 0);
              }
              setUploadedBytes(uploadedBytes);
              setResumeFileKey(key);
              setUploading(true);
              setIsPaused(false);
              setNeedFileSelect(true); // 需要用户重新选择文件
            }
          } catch { }
        }
        break;
      }
    }
  }, []);

  // 处理表单字段变化
  const handleInputChange = (field: keyof UploadForm, value: string | number | boolean | File | null) => {
    if (field === 'is_free') {
      setForm((prev: UploadForm) => ({
        ...prev,
        is_free: value as boolean,
        price: value ? 0 : prev.price // 免费时价格为0，付费时保留原价
      }))
      if (errors['price']) {
        setErrors((prev) => ({ ...prev, price: "" }))
      }
      return;
    }
    // 保证 price 始终为 number，且最多两位小数
    if (field === 'price') {
      let num = typeof value === 'string' ? Number(value) : value
      if (typeof num === 'number' && !isNaN(num)) {
        num = Math.floor(num * 100) / 100;
      } else {
        num = 0;
      }
      setForm((prev: UploadForm) => ({ ...prev, price: num }))
    } else {
      setForm((prev: UploadForm) => ({ ...prev, [field]: value }))
    }
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }))
    }
  }

  // 标签相关逻辑
  const addTag = () => {
    if (newTag.trim() && !form.tags.includes(newTag.trim()) && form.tags.length < 10) {
      setForm((prev) => ({ ...prev, tags: [...prev.tags, newTag.trim()] }))
      setNewTag("")
    }
  }
  const removeTag = (tagToRemove: string) => {
    setForm((prev) => ({ ...prev, tags: prev.tags.filter((tag) => tag !== tagToRemove) }))
  }

  // 读取前N行工具
  function readFirstNLines(file: File, n: number, callback: (lines: string[]) => void) {
    const chunkSize = 64 * 1024; // 64KB
    let offset = 0;
    let lines: string[] = [];
    let leftover = '';
    function readChunk() {
      const slice = file.slice(offset, offset + chunkSize);
      const reader = new FileReader();
      reader.onload = function (e) {
        const text = leftover + (e.target?.result as string);
        const split = text.split('\n');
        leftover = split.pop() || '';
        lines = lines.concat(split);
        if (lines.length >= n || offset + chunkSize >= file.size) {
          if (lines.length < n && leftover) lines.push(leftover);
          callback(lines.slice(0, n));
        } else {
          offset += chunkSize;
          readChunk();
        }
      };
      reader.readAsText(slice);
    }
    readChunk();
  }

  // 处理文件上传
  // const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
  //   const file = event.target.files?.[0] || null;
  //   if (!file) return;
  //   setUploading(true);
  //   setUploadProgress(0);
  //   try {
  //     const params: DatasetUploadContextParams = {
  //       userId,
  //       ownerAddress,
  //       file,
  //       setUploadProgress,
  //     };
  //     const { presignedUrl, previewLines } = await previewAndPresign(params);
  //     setPresignedUrl(presignedUrl);
  //     setPreviewLines(previewLines);
  //     setForm((prev) => ({ ...prev, file, file_size: file.size, file_format: file.name.split('.').pop() || 'jsonl' }));
  //     console.log('前20行数据:', previewLines);
  //     console.log('presignedUrl:', presignedUrl);
  //     toast.success("预签名URL获取成功，开始上传大文件...");
  //     // 立即上传到 MinIO
  //     await uploadToMinio(file, presignedUrl, setUploadProgress);
  //     setForm((prev) => ({ ...prev, file_url: presignedUrl }));
  //     toast.success("文件已上传到MinIO！");
  //   } catch (err) {
  //     toast.error("文件处理或上传到 MinIO 失败");
  //   } finally {
  //     setUploading(false);
  //   }
  // };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    if (!file) return event.target.value = "";
    // 检查是否为断点续传
    if (resumeFileKey) {
      const saved = localStorage.getItem(resumeFileKey);
      if (saved) {
        try {
          const state = JSON.parse(saved);
          if (state && state.fileName === file.name && state.fileSize === file.size) {
            setForm((prev: UploadForm) => ({ ...prev, file }));
            setNeedFileSelect(false);
            toast.success('已恢复上传，可以继续');
            // 自动恢复上传
            setUploading(true);
            setIsPaused(false);
            pauseRef.current = false;
            abortControllersRef.current = [];
            let uploadedBytes = 0;
            if (state.parts) {
              uploadedBytes = Object.values(state.parts).reduce((sum: number, part: any) => {
                if (part && typeof part.size === 'number') {
                  return sum + part.size;
                }
                return sum;
              }, 0);
            }
            setUploadedBytes(uploadedBytes);
            multipartUploadWithResume(file, file.name, (_progress, bytes) => {
              setUploadedBytes(bytes);
            }, 6, pauseRef, abortControllersRef, uploadedBytes).then(() => {
              setForm((prev: UploadForm) => ({ ...prev, file, file_size: file.size, file_format: file.name.split('.').pop() || 'jsonl' }));
              toast.success("文件已上传到MinIO！");
              setResumeFileKey(null);
            }).catch(() => {
              setIsPaused(true);
              setNeedFileSelect(false);
            }).finally(() => {
              setUploading(false);
              pauseRef.current = false;
              abortControllersRef.current = [];
            });
            return;
          } else {
            toast.error('文件名或大小不一致，请选择正确的文件');
            return;
          }
        } catch { }
      }
    }
    setForm((prev: UploadForm) => ({ ...prev, file }));
    setUploading(true);
    setUploadedBytes(0);
    setUploadProgress(-1); // “准备中...”
    setResumeTip("");
    setResumeError(false);
    setIsPaused(false);
    pauseRef.current = false;
    abortControllersRef.current = [];
    setResumeFileKey(null);
    setNeedFileSelect(false);
    const stateKey = `multipart-upload-${file.name}`;
    const saved = localStorage.getItem(stateKey);
    let resume = false;
    if (saved) {
      if (window.confirm('检测到未完成上传，是否继续？')) {
        resume = true;
        setResumeTip('已恢复上次上传进度（断点续传中）');
        setResumeFileKey(stateKey);
      } else {
        localStorage.removeItem(stateKey);
        setResumeTip('已清除上次未完成上传，重新开始');
        setResumeFileKey(null);
      }
    }
    try {
      setUploadProgress(0);
      // 1. 先上传文件到minio
      const startTime = Date.now();
      await multipartUploadWithResume(
        file,
        file.name,
        (_progress, bytes) => {
          setUploadedBytes(bytes);
        },
        6,
        pauseRef,
        abortControllersRef,
        0,
        (objectName) => {
          setForm((prev: UploadForm) => ({ ...prev, object_name: objectName }));
          console.log("objectName = ", objectName)
          // 2. 上传成功后再读取前20行并存储预览数据
          readFirstNLines(file, 20, async (previewLines) => {
            try {
              await uploadPreviewDataOnly({
                userId,
                ownerAddress,
                previewLines,
                objectName: objectName,
                fileSize: file.size,
              });
            } catch (e) {
              console.error("error:", e);
            }
          });
        }
      );
      const endTime = Date.now();
      calculateUploadSpeed(startTime, endTime, file.size);
      setForm((prev: UploadForm) => ({ ...prev, file, file_size: file.size, file_format: file.name.split('.').pop() || 'jsonl' }));
      toast.success("文件已上传到MinIO！");
      setResumeTip("");
      setResumeFileKey(null);

    } catch (err: any) {
      // 判断是否为主动暂停
      if (err && (err.name === 'CanceledError' || err.code === 'ERR_CANCELED')) {
        setResumeTip('已暂停上传');
        return;
      }
      toast.error("文件处理或上传到 MinIO 失败");
      setResumeError(true);
      setResumeTip('上传失败，可重试');
      setResumeFileKey(stateKey);
    } finally {
      setUploading(false);
      setIsPaused(false);
      pauseRef.current = false;
      abortControllersRef.current = [];
    }
  };

  // 表单校验
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}
    if (!form.title.trim()) newErrors.title = "数据集标题不能为空"
    if (!form.description.trim()) newErrors.description = "数据集描述不能为空"
    if (!form.category) newErrors.category = "请选择数据集分类"
    // 校验和UI都直接用form.tags: string[]
    if (form.tags.length === 0) newErrors.tags = "请至少添加一个标签"
    if (!form.is_free && (!form.price || form.price <= 0)) newErrors.price = "付费数据集价格必须大于0"
    if (!form.file) newErrors.file = "请上传数据集文件"
    if (!form.license) newErrors.license = "请选择许可证"
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // 处理表单提交
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploadProgress(0);
    if (!validateForm()) {
      toast.error("表单校验失败，请检查必填项是否填写完整");
      return;
    }
    setIsUploading(true);
    let datasetId: number | null = null;
    try {
      // 组装后端需要的字段
      const datasetForm: DatasetUploadForm = {
        title: form.title,
        description: form.description,
        category: form.category,
        tags: form.tags.join(','),
        price: form.price,
        isFree: form.is_free,
        objectName: form.object_name || "",
        fileSize: form.file ? form.file.size : 0,
        authorWalletAddress: ownerAddress,
        license: form.license,
      };
      // 只提交元数据到后端，拿到 datasetId
      const dbJson = await uploadDataset(datasetForm);
      datasetId = dbJson.dataset?.id || dbJson.datasetId || dbJson.id;
      if (!datasetId) throw new Error("未获取到数据集ID");
      // 付费数据集才上链
      if (!form.is_free) {
        try {
          const writableContract = await getWritableContract()
          const tx = await writableContract.createDataset(
            datasetId.toString(),
        form.title,
        form.description,
            ethers.parseEther(form.price.toString()).toString(),
            form.file_size?.toString() || "0",
            form.file_format
          );
          await tx.wait();
          toast.success('数据集已成功上链！');
        } catch (err) {
          console.error("[upload] error:", err);
          // 合约失败，回滚数据库和minio
          if (datasetId) {
            const objectName = form.object_name || "";
            await rollbackDataset(datasetId, objectName);
          }
          toast.error('链上登记失败，数据集已在平台登记但未上链');
        }
      }
      toast.success("提交成功！");
      router.push(`/my-datasets`);
    } catch (error: any) {
      console.error("[upload] error:", error);
      toast.error("上传失败: " + (error?.reason || error?.message || '上传失败'));
      setErrors({ general: "上传失败，请稍后重试" });
    } finally {
      setIsUploading(false);
    }
  };

  // ===================== 事件处理函数 =====================

  // 取消上传按钮回调
  async function handleCancelUpload() {
    // 1. abort所有请求
    abortControllersRef.current.forEach(ctrl => ctrl.abort());
    abortControllersRef.current = [];
    // 2. 通知后端清理minio残片（直接用当前文件名查找！）
    try {
      if (form.file) {
        const stateKey = `multipart-upload-${form.file.name}`;
        const saved = localStorage.getItem(stateKey);
        if (saved) {
          const state = JSON.parse(saved);
          if (state && state.uploadId && state.objectName) {
            const res = await cancelMultipartUpload(state.objectName, state.uploadId);
            toast.success(res);
          }
        }
      }
    } catch (e) {
      toast.error('后端清理残片失败，请联系管理员');
    }
    // 3. 清理本地状态
    if (form.file) {
      localStorage.removeItem(`multipart-upload-${form.file.name}`);
    }
    setUploading(false);
    setIsPaused(false);
    setUploadedBytes(0);
    setResumeFileKey(null);
    setNeedFileSelect(false);
    pauseRef.current = false;
    setForm((prev: UploadForm) => ({ ...prev, file: null, file_size: 0, file_format: '', file_url: '' }));
  }

  // 暂停上传按钮回调
  function handlePauseUploadClick() {
    setIsPaused(true);
    pauseRef.current = true;
    setResumeTip('已暂停上传');
    abortControllersRef.current.forEach(ctrl => ctrl.abort());
    abortControllersRef.current = [];
  }

  // 继续上传按钮回调
  function handleResumeUploadClick() {
    setIsPaused(false);
    setResumeTip('正在继续上传...');
    pauseRef.current = false;
    if (form.file) {
      const stateKey = `multipart-upload-${form.file.name}`;
      const saved = localStorage.getItem(stateKey);
      let uploadedBytes = 0;
      if (saved) {
        try {
          const state = JSON.parse(saved);
          if (state && state.parts) {
            uploadedBytes = (Object.values(state.parts) as { size: number }[]).reduce((sum: number, part) => sum + (part && typeof part.size === 'number' ? part.size : 0), 0);
          }
        } catch (err){ 
          console.error(err)
        }
      }
      setUploadedBytes(uploadedBytes);
      setUploading(true);
      multipartUploadWithResume(form.file, form.file.name, (_progress, bytes) => {
        setUploadedBytes(bytes);
      }, 6, pauseRef, abortControllersRef, uploadedBytes).then(() => {
        setForm((prev: UploadForm) => ({
          ...prev,
          file: form.file,
          file_size: form.file ? form.file.size : 0,
          file_format: form.file ? (form.file.name.split('.').pop() || 'jsonl') : 'jsonl',
        }));
        toast.success("文件已上传到MinIO！");
        setResumeTip("");
        setResumeFileKey(null);
      }).catch(() => {
        setResumeError(true);
        setResumeTip('上传失败，可重试');
      }).finally(() => {
        setUploading(false);
        setIsPaused(false);
        pauseRef.current = false;
        abortControllersRef.current = [];
      });
    }
  }

  // 辅助函数：计算上传速度并toast弹窗
  function calculateUploadSpeed(startTime: number, endTime: number, fileSize: number) {
    const durationSeconds = (endTime - startTime) / 1000;
    if (durationSeconds <= 0) return;
    const speed = fileSize / durationSeconds;
    let speedStr = '';
    if (speed < 1024) {
      speedStr = speed.toFixed(2) + ' B/s';
    } else if (speed < 1024 * 1024) {
      speedStr = (speed / 1024).toFixed(2) + ' KB/s';
    } else {
      speedStr = (speed / 1024 / 1024).toFixed(2) + ' MB/s';
    }
    toast.info(`上传速度：${speedStr}`);
    console.log(`上传速度：${speedStr}`);
  }

  // ===================== UI渲染区域 =====================
  // 权限判断，未通过直接return
  if (!user || !isSeller()) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center max-w-md">
          <Alert variant="destructive">
            <ShieldX className="h-4 w-4" />
            <AlertDescription className="mt-2">您没有权限访问此功能。</AlertDescription>
          </Alert>
        </div>
      </div>
    )
  }
  // 新增：钱包未连接或与绑定钱包不一致时禁止上传
  if (!wallet.isConnected || !verifyWalletAddress) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center max-w-md">
          <Alert variant="destructive">
            <ShieldX className="h-4 w-4" />
            <AlertDescription className="mt-2">
              { !wallet.isConnected ? "请先连接您的钱包，才能上传数据集。" : "当前连接的钱包地址与您账号绑定的钱包不一致，请切换为绑定的钱包后再上传。" }
            </AlertDescription>
          </Alert>
        </div>
      </div>
    )
  }
  return (
      <div className="container mx-auto px-4 py-8 max-w-screen-2xl w-full">
        <PageHeader title="上传数据集" description="分享您的高质量数据集，帮助AI社区发展" />
        <div className="mt-8">
        <form onSubmit={handleFormSubmit} className="space-y-8">
            <Card className="w-full max-w-screen-2xl mx-auto">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  上传数据集
                </CardTitle>
                <CardDescription>填写数据集信息并上传，仅支持JSONL格式</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 md:space-y-8">
                <div className="flex flex-col md:flex-row gap-8 md:gap-12">
                  {/* 左侧：文件、标签、许可证 */}
                  <div className="flex-1 min-w-0 space-y-6">
                    {/* 文件上传 */}
                    <section className="space-y-2">
                      <Label htmlFor="files">数据集文件 *</Label>
                      <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                        <input
                          id="files"
                          type="file"
                          onChange={handleFileUpload}
                          className="hidden"
                          accept=".jsonl"
                        ref={fileInputRef}
                        />
                        <label htmlFor="files" className="cursor-pointer">
                          <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                          <p className="text-sm text-muted-foreground mb-1">点击上传或拖拽，仅支持 JSONL</p>
                        </label>
                      {/* 上传进度条显示在这里 */}
                      {uploading && form.file && (
                        <div className="mt-2 w-full flex items-center gap-3">
                          {/* 文件图标+文件名 */}
                          <FileText className="h-5 w-5 text-muted-foreground mr-2" />
                          <span className="truncate max-w-[160px] text-sm text-muted-foreground">{form.file.name}</span>
                          {/* 进度条 */}
                          <div className="flex-1 flex flex-col">
                            <div className="relative w-full h-2 rounded-full bg-gray-200 overflow-hidden">
                              <div
                                className="absolute left-0 top-0 h-2 rounded-full transition-all"
                                style={{
                                  width: `${form.file.size ? (uploadedBytes / form.file.size) * 100 : 0}%`,
                                  background: `linear-gradient(90deg, #3b82f6 0%, #22d3ee 50%, #22c55e 100%)`,
                                  transition: 'width 0.3s cubic-bezier(.4,2.3,.3,1)',
                                }}
                              />
                            </div>
                          </div>
                          {/* 百分比 */}
                          <span className={`ml-2 w-12 text-right text-sm font-medium ${uploadedBytes === form.file.size ? 'text-green-500' : 'text-muted-foreground'}`}>{form.file.size ? ((uploadedBytes / form.file.size) * 100).toFixed(0) : 0}%</span>
                          {/* 操作按钮：如果需要重新选择文件则禁用 */}
                          {!isPaused && (
                            <button type="button" className="ml-2 p-1 rounded hover:bg-gray-100" onClick={handlePauseUploadClick} title="暂停上传" disabled={needFileSelect}>
                              <Pause className={`h-5 w-5 ${needFileSelect ? 'text-gray-300' : 'text-blue-500'}`} />
                            </button>
                          )}
                          {isPaused && (
                            <button type="button" className="ml-2 p-1 rounded hover:bg-gray-100" onClick={handleResumeUploadClick} title="继续上传" disabled={needFileSelect}>
                              <Play className={`h-5 w-5 ${needFileSelect ? 'text-gray-300' : 'text-green-500'}`} />
                            </button>
                          )}
                          {/* 进度条区域 AlertDialog 优化 */}
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <button type="button" className="ml-2 p-1 rounded hover:bg-gray-100" title="取消上传" disabled={needFileSelect}>
                                <X className={`h-5 w-5 ${needFileSelect ? 'text-gray-300' : 'text-red-500'}`} />
                              </button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <div className="flex justify-between items-center mb-2">
                                <AlertDialogTitle>确认取消上传？</AlertDialogTitle>
                                <AlertDialogTrigger asChild>
                                  <button className="p-1 rounded hover:bg-gray-100" type="button"><X className="h-5 w-5 text-gray-400" /></button>
                                </AlertDialogTrigger>
                              </div>
                              <AlertDialogDescription>取消后将清除本地所有上传进度，需重新上传该文件。</AlertDialogDescription>
                              <div className="flex justify-end mt-6">
                                <Button type="button" variant="default" onClick={handleCancelUpload}>取消上传</Button>
                              </div>
                            </AlertDialogContent>
                          </AlertDialog>
                          {/* 如需重新选择文件，显示提示 */}
                          {needFileSelect && <span className="ml-2 text-xs text-orange-500">请重新选择该文件以继续上传</span>}
                        </div>
                      )}
                      {/* 上传成功后显示绿色对勾和文件名 */}
                      {!uploading && form.file && uploadedBytes === form.file.size && (
                        <div className="mt-2 w-full flex items-center gap-3 bg-green-50 border border-green-200 rounded p-3">
                          <svg className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span className="truncate max-w-[160px] text-sm text-green-700 font-medium">{form.file.name} 上传成功！</span>
                        </div>
                      )}
                      </div>
                      {errors.file && <p className="text-sm text-destructive">{errors.file}</p>}
                    {form.file_url && form.file && (
                        <div className="space-y-1">
                          <Label>已上传文件</Label>
                          <div className="space-y-1">
                          <div className="flex items-center gap-2 p-1 bg-muted rounded">
                                <ImageIcon className="h-4 w-4" />
                            <span className="text-sm flex-1">{form.file.name}</span>
                            <span className="text-xs text-muted-foreground">{(form.file.size / (1024 * 1024)).toFixed(2)} MB</span>
                              </div>
                          </div>
                        </div>
                      )}
                    </section>
                  {/* 上传区域上方增加断点续传恢复提示和按钮 */}
                  {/* 删除 hasPendingUpload、resumeTip、恢复上传按钮等相关 UI */}
                    {/* 标签 */}
                    <section className="space-y-2">
                      <Label>标签 *</Label>
                      <div className="flex gap-2">
                        <Input
                          placeholder="添加标签（按回车确认）"
                          value={newTag}
                          onChange={(e) => setNewTag(e.target.value)}
                          onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                          className="flex-1"
                        />
                        <Button type="button" onClick={addTag} variant="outline" size="sm">
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      {form.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-1">
                          {form.tags.map((tag) => (
                            <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                              <Tag className="h-3 w-3" />
                              {tag}
                              <button type="button" onClick={() => removeTag(tag)} className="ml-1 hover:text-destructive">
                                <X className="h-3 w-3" />
                              </button>
                            </Badge>
                          ))}
                        </div>
                      )}
                      {errors.tags && <p className="text-xs text-destructive">{errors.tags}</p>}
                    </section>
                    {/* 许可证 */}
                    <section className="space-y-2">
                      <Label htmlFor="license">许可证类型 *</Label>
                      <Select value={form.license} onValueChange={(value) => handleInputChange("license", value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="MIT">MIT License</SelectItem>
                          <SelectItem value="Apache-2.0">Apache License 2.0</SelectItem>
                          <SelectItem value="GPL-3.0">GNU General Public License v3.0</SelectItem>
                          <SelectItem value="CC-BY-4.0">Creative Commons Attribution 4.0</SelectItem>
                          <SelectItem value="CC-BY-SA-4.0">Creative Commons Attribution-ShareAlike 4.0</SelectItem>
                          <SelectItem value="Custom">自定义许可证</SelectItem>
                        </SelectContent>
                      </Select>
                      {errors.license && <p className="text-xs text-destructive">{errors.license}</p>}
                    </section>
                  </div>
                  {/* 右侧：标题、描述、分类、免费、价格 */}
                  <div className="flex-1 min-w-0 space-y-6">
                    <section className="space-y-2">
                      <Label htmlFor="title">数据集标题 *</Label>
                      <Input
                        id="title"
                        placeholder="如：高质量文本分类数据集"
                        value={form.title}
                        onChange={(e) => handleInputChange("title", e.target.value)}
                        className={errors.title ? "border-destructive" : ""}
                      />
                      {errors.title && <p className="text-xs text-destructive">{errors.title}</p>}
                      <Label htmlFor="description">数据集描述 *</Label>
                      <Textarea
                        id="description"
                        placeholder="详细描述内容、用途、特点等..."
                        rows={3}
                        value={form.description}
                        onChange={(e) => handleInputChange("description", e.target.value)}
                        className={errors.description ? "border-destructive" : ""}
                      />
                      {errors.description && <p className="text-xs text-destructive">{errors.description}</p>}
                    </section>
                    <section className="space-y-2">
                      <Label htmlFor="category">数据集分类 *</Label>
                      <Select value={form.category} onValueChange={(value) => handleInputChange("category", value)}>
                        <SelectTrigger className={errors.category ? "border-destructive" : ""}>
                          <SelectValue placeholder="选择分类" />
                        </SelectTrigger>
                        <SelectContent>
                          {DATASET_CATEGORIES.map((category) => (
                            <SelectItem key={category} value={category}>
                              {CATEGORY_LABELS[category]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.category && <p className="text-xs text-destructive">{errors.category}</p>}
                      <div className="flex flex-wrap items-center gap-3 mt-2">
                        <Checkbox
                          id="is_free"
                          checked={form.is_free}
                          onCheckedChange={(checked) => handleInputChange("is_free", checked as boolean)}
                        />
                        <Label htmlFor="is_free" className="mb-0 whitespace-nowrap">免费数据集</Label>
                        {!form.is_free && (
                          <>
                            <Input
                              id="price"
                              type="number"
                            step="0.01"
                            min="0.01"
                              placeholder="0.01"
                              value={form.price}
                              onChange={(e) => handleInputChange("price", Number(e.target.value))}
                              className={`w-28 ${errors.price ? "border-destructive" : ""}`}
                            disabled={form.is_free}
                            />
                            <span className="text-xs text-muted-foreground hidden md:inline-block">ETH</span>
                            <span className="text-xs text-muted-foreground ml-2">
                              平台将从每笔付费交易中收取 <b>{feeRate}%</b> 作为服务费，剩余部分归商家所有。
                            </span>
                          </>
                        )}
                      </div>
                      {errors.price && !form.is_free && <p className="text-xs text-destructive">{errors.price}</p>}
                    </section>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Submit Button */}
            <div className="flex justify-end space-x-4">
              <Button type="button" variant="outline" onClick={() => router.back()} disabled={isUploading}>
                取消
              </Button>
              <Button 
                type="submit" 
                disabled={isUploading || uploading || !form.file || (form.file && uploadedBytes < form.file.size)}
              >
                {isUploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    上传中...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    发布数据集
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
  )
}
