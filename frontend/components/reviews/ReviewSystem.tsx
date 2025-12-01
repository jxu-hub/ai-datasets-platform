"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { Star, ThumbsUp, ThumbsDown, MessageSquare, Send, Loader2 } from "lucide-react"

interface Review {
  id: string
  user: {
    id: number
    username: string
    avatar_url?: string
  }
  rating: number
  comment: string
  helpful_votes: number
  total_votes: number
  created_at: string
  updated_at: string
}

interface ReviewSystemProps {
  datasetId: number
  averageRating: number
  totalReviews: number
}

export function ReviewSystem({ datasetId, averageRating, totalReviews }: ReviewSystemProps) {
  const { user, isAuthenticated } = useAuth()
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [newRating, setNewRating] = useState(0)
  const [newComment, setNewComment] = useState("")
  const [error, setError] = useState("")

  // Mock reviews data
  const mockReviews: Review[] = [
    {
      id: "review_1",
      user: {
        id: 2,
        username: "data_scientist",
        avatar_url: "/seller-avatar.png",
      },
      rating: 5,
      comment: "非常优质的数据集！数据质量很高，标注准确，对我的项目帮助很大。推荐给需要高质量训练数据的朋友们。",
      helpful_votes: 15,
      total_votes: 18,
      created_at: "2024-03-10T14:30:00Z",
      updated_at: "2024-03-10T14:30:00Z",
    },
    {
      id: "review_2",
      user: {
        id: 3,
        username: "ml_engineer",
        avatar_url: "/diverse-user-avatars.png",
      },
      rating: 4,
      comment: "数据集整体不错，格式规范，文档清晰。唯一的小问题是部分数据可能存在轻微的标注不一致，但不影响整体使用。",
      helpful_votes: 8,
      total_votes: 12,
      created_at: "2024-03-08T09:15:00Z",
      updated_at: "2024-03-08T09:15:00Z",
    },
    {
      id: "review_3",
      user: {
        id: 4,
        username: "ai_researcher",
        avatar_url: "/admin-avatar.png",
      },
      rating: 5,
      comment: "作为研究用途，这个数据集完全满足需求。数据覆盖面广，样本分布均匀，是做学术研究的好选择。",
      helpful_votes: 12,
      total_votes: 14,
      created_at: "2024-03-05T16:45:00Z",
      updated_at: "2024-03-05T16:45:00Z",
    },
  ]

  // Load reviews
  const loadReviews = async () => {
    setLoading(true)
    try {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 800))
      setReviews(mockReviews)
    } catch (err) {
      console.error("[v0] Load reviews error:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadReviews()
  }, [datasetId])

  // Submit review
  const handleSubmitReview = async () => {
    if (!isAuthenticated || !user) {
      setError("请先登录后再评价")
      return
    }

    if (newRating === 0) {
      setError("请选择评分")
      return
    }

    if (!newComment.trim()) {
      setError("请输入评价内容")
      return
    }

    setSubmitting(true)
    setError("")

    try {
      console.log("[v0] Submitting review:", { datasetId, rating: newRating, comment: newComment })

      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Add new review to list
      const newReview: Review = {
        id: `review_${Date.now()}`,
        user: {
          id: user.id,
          username: user.username,
          avatar_url: user.avatar_url,
        },
        rating: newRating,
        comment: newComment,
        helpful_votes: 0,
        total_votes: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      setReviews((prev) => [newReview, ...prev])
      setNewRating(0)
      setNewComment("")
    } catch (err: any) {
      setError(err.message || "提交评价失败")
    } finally {
      setSubmitting(false)
    }
  }

  // Render star rating
  const renderStars = (rating: number, interactive = false, onRatingChange?: (rating: number) => void) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"
            } ${interactive ? "cursor-pointer hover:text-yellow-400" : ""}`}
            onClick={() => interactive && onRatingChange?.(star)}
          />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Rating Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            用户评价
          </CardTitle>
          <CardDescription>
            平均评分 {averageRating.toFixed(1)} 分，共 {totalReviews} 条评价
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold">{averageRating.toFixed(1)}</div>
              {renderStars(Math.round(averageRating))}
              <div className="text-sm text-muted-foreground mt-1">{totalReviews} 条评价</div>
            </div>
            <div className="flex-1">
              {[5, 4, 3, 2, 1].map((star) => {
                const count = Math.floor(Math.random() * 20) + 1
                const percentage = (count / totalReviews) * 100
                return (
                  <div key={star} className="flex items-center gap-2 text-sm">
                    <span className="w-8">{star}星</span>
                    <div className="flex-1 bg-muted rounded-full h-2">
                      <div className="bg-yellow-400 h-2 rounded-full" style={{ width: `${percentage}%` }} />
                    </div>
                    <span className="w-8 text-muted-foreground">{count}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Write Review */}
      {isAuthenticated ? (
        <Card>
          <CardHeader>
            <CardTitle>写评价</CardTitle>
            <CardDescription>分享您对这个数据集的使用体验</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">评分</label>
              {renderStars(newRating, true, setNewRating)}
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">评价内容</label>
              <Textarea
                placeholder="请详细描述您对这个数据集的评价..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                rows={4}
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button onClick={handleSubmitReview} disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  提交中...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  提交评价
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-4">
              <MessageSquare className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-muted-foreground">请登录后发表评价</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Reviews List */}
      <Card>
        <CardHeader>
          <CardTitle>全部评价 ({reviews.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="ml-2">加载中...</span>
            </div>
          ) : reviews.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">暂无评价</p>
            </div>
          ) : (
            <div className="space-y-6">
              {reviews.map((review, index) => (
                <div key={review.id}>
                  <div className="flex items-start gap-4">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={review.user.avatar_url || "/placeholder.svg"} alt={review.user.username} />
                      <AvatarFallback>{review.user.username.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>

                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium">{review.user.username}</span>
                        {renderStars(review.rating)}
                        <span className="text-sm text-muted-foreground">
                          {new Date(review.created_at).toLocaleDateString()}
                        </span>
                      </div>

                      <p className="text-muted-foreground mb-3">{review.comment}</p>

                      <div className="flex items-center gap-4 text-sm">
                        <Button variant="ghost" size="sm" className="h-auto p-1">
                          <ThumbsUp className="h-3 w-3 mr-1" />
                          有用 ({review.helpful_votes})
                        </Button>
                        <Button variant="ghost" size="sm" className="h-auto p-1">
                          <ThumbsDown className="h-3 w-3 mr-1" />
                          无用 ({review.total_votes - review.helpful_votes})
                        </Button>
                      </div>
                    </div>
                  </div>

                  {index < reviews.length - 1 && <Separator className="mt-6" />}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
