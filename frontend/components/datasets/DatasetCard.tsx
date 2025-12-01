"use client"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import type { Dataset } from "@/types"
import { Download } from "lucide-react"
import { useEffect, useState } from "react"
import { getProfileByWalletAddress } from "@/lib/api/auth"

interface DatasetCardProps {
  dataset: Dataset
}

export function DatasetCard({ dataset }: DatasetCardProps) {
  const formatFileSize = (bytes: number) => {
    const sizes = ["B", "KB", "MB", "GB"]
    if (bytes === 0) return "0 B"
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + " " + sizes[i]
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = (now.getTime() - date.getTime()) / 1000 // 秒
    if (diff < 60) return `${Math.floor(diff)}秒前`
    if (diff < 3600) return `${Math.floor(diff / 60)}分钟前`
    if (diff < 86400) return `${Math.floor(diff / 3600)}小时前`
    if (diff < 604800) return `${Math.floor(diff / 86400)}天前`
    if (diff < 2592000) return `${Math.floor(diff / 604800)}周前`
    if (diff < 31536000) return `${Math.floor(diff / 2592000)}月前`
    return `${Math.floor(diff / 31536000)}年前`
  }

  // 卖家信息
  const [author, setAuthor] = useState<{ username: string; avatarUrl?: string } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    setLoading(true)
    getProfileByWalletAddress(dataset.authorWalletAddress)
      .then((user) => {
        if (mounted) setAuthor({ username: user.username, avatarUrl: user.avatarUrl })
      })
      .finally(() => { if (mounted) setLoading(false) })
    return () => { mounted = false }
  }, [dataset.authorWalletAddress])
  const NEXT_PUBLIC_API_MINIO = process.env.NEXT_PUBLIC_API_MINIO as string

  const username = author?.username || "加载中..."
  const avatarUrl = author?.avatarUrl || "/placeholder.svg"

  return (
    <div className="flex items-center justify-between py-3 px-3 hover:bg-gray-50 border-b border-gray-100 group">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <Avatar className="h-5 w-5 flex-shrink-0">
          <AvatarImage src={NEXT_PUBLIC_API_MINIO + avatarUrl} alt={username} />
          <AvatarFallback className="text-xs">{username.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between mb-1">
            <Link
              href={`/datasets/${dataset.id}`}
              className="text-blue-600 hover:text-blue-800 font-medium text-sm truncate flex-1 mr-2"
            >
              {username}/{dataset.title}
            </Link>
            {!dataset.isFree && (
              <Badge className="bg-black text-white hover:bg-gray-800 border-black text-xs px-2 py-0.5 flex-shrink-0">
                {dataset.price} ETH
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span>更新于 {formatDate(dataset.updatedAt)}</span>
            <span>{formatFileSize(dataset.fileSize)}</span>
            <div className="flex items-center gap-1">
              <Download className="h-3 w-3" />
              <span>{dataset.downloadCount?.toLocaleString?.() ?? 0}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
