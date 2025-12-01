"use client"

import React, { useState, useEffect } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { ProtectedRoute } from "@/components/guards/ProtectedRoute"
import { PageHeader } from "@/components/layout/PageHeader"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Heart, Download, Calendar, Loader2, Filter } from "lucide-react"
import ProgressLink from "@/components/system/ProgressLink"
import { getProfileByWalletAddress } from "@/lib/api/auth";

export default function FavoritesPage() {
  const { user, fetchUserFavorites } = useAuth();
  const [favorites, setFavorites] = useState<any[]>([]);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 分页：每页5条
  const PAGE_SIZE = 5;
  const [page, setPage] = useState(1);
  const filteredFavorites = favorites.filter((fav) => {
    // 筛选类型
    if (typeFilter === "free" && !(fav.price === 0 || fav.is_free)) return false;
    if (typeFilter === "paid" && (fav.price === 0 || fav.is_free)) return false;
    return true;
  });
  const totalPages = Math.ceil(filteredFavorites.length / PAGE_SIZE);
  const pagedFavorites = filteredFavorites.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // 翻页控件
  function Pagination({ page, totalPages, onChange }: { page: number, totalPages: number, onChange: (v:number)=>void }) {
    if (totalPages < 2) return null;
    return (
      <div className="flex justify-center mt-8 gap-2">
        <Button size="sm" variant="outline" disabled={page===1} onClick={()=>onChange(page-1)}>&lt;</Button>
        {Array.from({ length: totalPages }, (_, i) => (
          <Button key={i+1} size="sm" variant={page===i+1?"default":"outline"} onClick={()=>onChange(i+1)}>{i+1}</Button>
        ))}
        <Button size="sm" variant="outline" disabled={page===totalPages} onClick={()=>onChange(page+1)}>&gt;</Button>
      </div>
    );
  }

  const apiMinio = process.env.NEXT_PUBLIC_API_MINIO as string

  // 加载收藏
  const loadFavorites = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchUserFavorites();
      // 预处理tags格式
      const normalized = Array.isArray(result)
        ? result.map((fav: any) => ({
            ...fav,
            tags: typeof fav.tags === 'string' ? fav.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : Array.isArray(fav.tags) ? fav.tags : [],
          }))
        : [];
      // 批量补全author字段（如果只有authorId，用接口查询）
      const enriched = await Promise.all(
        normalized.map(async (fav) => {
          let author = fav.author;
          if (!author || !author.username || !author.avatar_url) {
            // 只有id时才请求
            const authorId = fav.authorId || fav.author?.id || fav.author_id;
            try {
              author = authorId ? await getProfileByWalletAddress(author.walletAddress) : { username: "未知作者" };
            } catch {
              author = { username: "未知作者" };
            }
          }
          return { ...fav, author };
        })
      );
      setFavorites(enriched);
    } catch (err: any) {
      setError(err?.message || "获取收藏失败");
      setFavorites([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [page]);

  useEffect(() => {
    if (user) {
      loadFavorites();
    }
  }, [user]);

  // Get unique categories
  const categories = Array.from(new Set(favorites.map((fav) => fav.category)))

  const formatFileSize = (bytes: number) => {
    const sizes = ["B", "KB", "MB", "GB"]
    if (bytes === 0) return "0 B"
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + " " + sizes[i]
  }

  return (
    <ProtectedRoute requireAuth>
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <PageHeader title="我的收藏" description="管理您收藏的数据集，随时查看和下载" />

        {error && (
          <Alert variant="destructive" className="mt-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="mt-8 space-y-6">
          <div className="flex items-center gap-2">
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部类型</SelectItem>
                <SelectItem value="free">免费</SelectItem>
                <SelectItem value="paid">付费</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Favorites List */}
          <Card>
            <CardHeader>
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="h-5 w-5 text-red-500" />
                  收藏的数据集
                </CardTitle>
                <CardDescription>
                  共 {filteredFavorites.length} 个收藏{categoryFilter !== "all" && ` • ${categoryFilter}`}
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span className="ml-2">加载中...</span>
                </div>
              ) : filteredFavorites.length === 0 ? (
                <div className="text-center py-12">
                  <Heart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-2">
                    {favorites.length === 0 ? "您还没有收藏任何数据集" : "没有符合条件的收藏"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {favorites.length === 0 ? "浏览数据集时点击收藏按钮来添加收藏" : "尝试调整筛选条件"}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pagedFavorites.map((favorite) => (
                    <div
                      key={favorite.id}
                      className="flex flex-col md:flex-row gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors items-center md:items-start justify-between"
                    >
                      {/* 左侧主要信息 */}
                      <div className="flex-1 w-full min-w-0">
                        <div className="flex justify-between items-start gap-4">
                          <h3 className="font-medium text-lg mb-2 truncate max-w-[60vw]">
                          <ProgressLink href={`/datasets/${String(favorite.id)}`} className="hover:text-primary transition-colors">
                            {favorite.title}
                          </ProgressLink>
                        </h3>
                        </div>
                        {/* 多行溢出的 description，自动 ... 截断，超出折叙 */}
                        <p className="text-muted-foreground text-sm mb-3 break-all line-clamp-2 max-w-full" style={{ display: '-webkit-box', WebkitBoxOrient: 'vertical', WebkitLineClamp: 2, overflow: 'hidden'}}>
                          {favorite.description}
                        </p>

                        <div className="flex flex-wrap gap-1 mb-3">
                          {favorite.tags.map((tag: string) => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                              <Avatar className="h-4 w-4">
                                <AvatarImage
                              src={apiMinio + favorite.author.avatarUrl || "/placeholder.svg"}
                                  alt={favorite.author.username}
                                />
                                <AvatarFallback className="text-xs">
                              {favorite.author.username?.charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <span>{favorite.author.username}</span>
                            </div>
                          </div>

                      {/* 右侧操作+信息区 */}
                      <div className="flex flex-col items-end justify-between md:ml-8 mt-4 md:mt-0 min-w-fit h-full gap-3">
                        {/* 上方 分类、价格、日期紧凑一行分组 */}
                        <div className="flex items-center gap-2 mb-2">
                          <Badge
                            variant={favorite.is_free || favorite.price === 0 ? "default" : "secondary"}
                            className={ favorite.is_free || favorite.price === 0 ? "" : "bg-black text-white hover:bg-black" }
                          >
                            {favorite.is_free || favorite.price === 0 ? "免费" : `¥${favorite.price}`}
                          </Badge>
                          <Badge variant="secondary">{favorite.category}</Badge>
                          {/* 日期，格式化updatedAt或favorited_at */}
                          <span className="text-xs text-gray-400 whitespace-nowrap">{favorite.updatedAt ? new Date(favorite.updatedAt).toLocaleDateString() : "-"}</span>
                        </div>
                        {/* 操作按钮单独靠下对齐 */}
                        <Button asChild size="sm" className="mt-auto">
                            <ProgressLink href={`/datasets/${String(favorite.id)}`}>
                              <Download className="mr-2 h-3 w-3" />
                              查看详情
                            </ProgressLink>
                          </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {/* 分页器 */}
              <Pagination page={page} totalPages={totalPages} onChange={setPage} />
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  )
}
