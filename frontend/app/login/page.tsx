"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import ProgressLink from "@/components/system/ProgressLink"
import { useAuth } from "@/contexts/AuthContext"
import { useRole } from "@/hooks/useRole"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Loader2, Mail, Lock, Database } from "lucide-react"
import { toast } from "sonner"

export default function LoginPage() {
  const router = useRouter()
  const { login, isAuthenticated, isLoading } = useAuth()
  const { isAdmin } = useRole()

  const [formData, setFormData] = useState({
    emailOrUsername: "",
    password: "",
    remember: false,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      if (isAdmin()) {
        router.push("/admin")
      } else {
        router.push("/")
      }
    }
  }, [isAuthenticated, isLoading, isAdmin, router])

  // 表单验证
  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.emailOrUsername.trim()) {
      newErrors.emailOrUsername = "请输入邮箱或用户名"
    } else if (formData.emailOrUsername.includes("@") && !/\S+@\S+\.\S+/.test(formData.emailOrUsername)) {
      newErrors.emailOrUsername = "请输入有效的邮箱地址"
    }

    if (!formData.password) {
      newErrors.password = "请输入密码"
    } else if (formData.password.length < 6) {
      newErrors.password = "密码至少6位"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // 处理表单提交
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setIsSubmitting(true)

    try {
      const result = await login(formData.emailOrUsername, formData.password)

      if (result.success) {
        toast("登录成功", { description: "欢迎回来！" })
        if (result.user?.role === "admin") {
          router.push("/admin")
        } else {
          router.push("/")
        }
      } else {
        toast.error("账号或密码错误", { description: result.error || "账号或密码错误" })
      }
    } catch (error) {
      toast.error("登录失败", { description: "网络错误，请稍后重试" })
    } finally {
      setIsSubmitting(false)
    }
  }

  // 处理输入变化
  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    // 清除对应字段的错误
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }))
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <ProgressLink href="/" className="inline-flex items-center space-x-2">
            <Database className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold">AI数据集平台</span>
          </ProgressLink>
        </div>

        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">欢迎回来</CardTitle>
            <CardDescription>登录您的账户以继续使用平台服务</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* 邮箱/用户名 */}
              <div className="space-y-2">
                <Label htmlFor="emailOrUsername">邮箱或用户名</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    id="emailOrUsername"
                    type="text"
                    placeholder="请输入邮箱或用户名"
                    value={formData.emailOrUsername}
                    onChange={(e) => handleInputChange("emailOrUsername", e.target.value)}
                    className={`pl-10 ${errors.emailOrUsername ? "border-destructive" : ""}`}
                    disabled={isSubmitting}
                  />
                </div>
                {errors.emailOrUsername && <p className="text-sm text-destructive">{errors.emailOrUsername}</p>}
              </div>

              {/* 密码 */}
              <div className="space-y-2">
                <Label htmlFor="password">密码</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="请输入密码"
                    value={formData.password}
                    onChange={(e) => handleInputChange("password", e.target.value)}
                    className={`pl-10 ${errors.password ? "border-destructive" : ""}`}
                    disabled={isSubmitting}
                  />
                </div>
                {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
              </div>

              {/* 记住登录 & 忘记密码 */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="remember"
                    checked={formData.remember}
                    onCheckedChange={(checked) => handleInputChange("remember", !!checked)}
                    disabled={isSubmitting}
                  />
                  <Label htmlFor="remember" className="text-sm">
                    记住登录状态
                  </Label>
                </div>
                <Link
                  href="/forgot-password"
                  className="text-sm text-primary hover:underline"
                  tabIndex={isSubmitting ? -1 : 0}
                >
                  忘记密码？
                </Link>
              </div>

              {/* 登录按钮 */}
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    登录中...
                  </>
                ) : (
                  "登录"
                )}
              </Button>

              {/* 注册链接 */}
              <div className="text-center text-sm">
                <span className="text-muted-foreground">还没有账户？</span>{" "}
                <ProgressLink href="/register" className="text-primary hover:underline">
                  立即注册
                </ProgressLink>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
