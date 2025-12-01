"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Download, CheckCircle, AlertTriangle, FileText, Loader2, RefreshCw } from "lucide-react"
import type { Dataset } from "@/types"
import { toast } from "sonner"

interface DownloadProgressProps {
  dataset: Dataset | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onComplete?: () => void
}

export function DownloadProgress({ dataset, open, onOpenChange, onComplete }: DownloadProgressProps) {
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState<"preparing" | "downloading" | "completed" | "error">("preparing")
  const [error, setError] = useState<string>("")
  const [downloadUrl, setDownloadUrl] = useState<string>("")

  // Start download process
  const startDownload = async () => {
    if (!dataset) return
    toast("正在下载 " + dataset.title + "...")
    setStatus("preparing")
    setProgress(0)
    setError("")

    try {
      console.log("[v0] Starting download for dataset:", dataset.id)

      // Step 1: Prepare download (verify purchase, generate secure link)
      setStatus("preparing")
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Step 2: Start download with progress simulation
      setStatus("downloading")

      // Simulate download progress
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            clearInterval(progressInterval)
            setStatus("completed")
            toast.success(dataset.title + " 已保存到您的下载文件夹")

            // Generate mock download URL
            const mockUrl = `https://datasets.example.com/download/${dataset.id}?token=mock_secure_token`
            setDownloadUrl(mockUrl)

            // Trigger actual download
            const link = document.createElement("a")
            link.href = mockUrl
            link.download = `${dataset.title.replace(/[^a-zA-Z0-9]/g, "_")}.jsonl`
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)

            // Call completion callback
            setTimeout(() => {
              onComplete?.()
            }, 1000)

            return 100
          }
          return prev + Math.random() * 15
        })
      }, 200)
    } catch (err: any) {
      console.error("[v0] Download error:", err)
      setStatus("error")
      setError(err.message || "下载失败，请稍后重试")
      toast.error(err.message || "下载失败，请稍后重试")
    }
  }

  // Retry download
  const retryDownload = () => {
    startDownload()
  }

  // Reset state when modal opens
  useEffect(() => {
    if (open && dataset) {
      startDownload()
    }
  }, [open, dataset])

  // Reset state when modal closes
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setProgress(0)
      setStatus("preparing")
      setError("")
      setDownloadUrl("")
    }
    onOpenChange(newOpen)
  }

  if (!dataset) return null

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            下载数据集
          </DialogTitle>
          <DialogDescription>正在下载 "{dataset.title}"</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Dataset Info */}
          <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
            <FileText className="h-8 w-8 text-muted-foreground" />
            <div className="flex-1">
              <h3 className="font-medium text-sm">{dataset.title}</h3>
              <p className="text-xs text-muted-foreground">
                {dataset.file_format} • {(dataset.file_size / (1024 * 1024)).toFixed(1)} MB
              </p>
            </div>
          </div>

          {/* Download Status */}
          {status === "preparing" && (
            <div className="text-center py-4">
              <Loader2 className="h-6 w-6 animate-spin mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">准备下载中...</p>
              <p className="text-xs text-muted-foreground mt-1">正在验证权限并生成安全下载链接</p>
            </div>
          )}

          {status === "downloading" && (
            <div className="space-y-4">
              <div className="text-center">
                <Download className="h-6 w-6 mx-auto mb-2 text-blue-600" />
                <p className="text-sm font-medium">下载中...</p>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>进度</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>

              <p className="text-xs text-muted-foreground text-center">
                请保持网络连接稳定，下载完成后文件将自动保存到您的下载文件夹
              </p>
            </div>
          )}

          {status === "completed" && (
            <div className="text-center py-4">
              <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-3" />
              <h3 className="font-medium mb-2">下载完成！</h3>
              <p className="text-sm text-muted-foreground mb-4">文件已保存到您的下载文件夹</p>

              {/* Download info */}
              <div className="text-xs text-muted-foreground space-y-1">
                <p>文件名: {dataset.title.replace(/[^a-zA-Z0-9]/g, "_")}.jsonl</p>
                <p>文件大小: {(dataset.file_size / (1024 * 1024)).toFixed(1)} MB</p>
              </div>

              <Button onClick={() => onOpenChange(false)} className="mt-4">
                完成
              </Button>
            </div>
          )}

          {status === "error" && (
            <div className="space-y-4">
              <p className="text-center text-sm text-red-600">{error}</p>

              <div className="flex gap-2">
                <Button onClick={retryDownload} variant="outline" className="flex-1 bg-transparent">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  重试
                </Button>
                <Button onClick={() => onOpenChange(false)} variant="outline" className="flex-1">
                  取消
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
