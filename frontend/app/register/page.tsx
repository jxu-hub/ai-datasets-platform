"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import ProgressLink from "@/components/system/ProgressLink"
import { useAuth } from "@/contexts/AuthContext"
import { useSystemConfig } from "@/contexts/SystemConfigContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Checkbox } from "@/components/ui/checkbox"
import { Loader2, User, Mail, Lock, Database, Send, AlertTriangle } from "lucide-react"
import { RegisterForm } from "@/types"
import { toast } from "sonner"

export default function RegisterPage() {
  const router = useRouter()
  const { register, sendVerificationCode, isAuthenticated, isLoading, login } = useAuth()
  const { config, loading: configLoading, isRegistrationEnabled } = useSystemConfig()

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    verificationCode: "",
    agreeTerms: false,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSendingCode, setIsSendingCode] = useState(false)
  const [submitError, setSubmitError] = useState("")
  const [codeMessage, setCodeMessage] = useState("")
  const [codeSent, setCodeSent] = useState(false)
  const [countdown, setCountdown] = useState(0)

  // 如果已登录，重定向到首页
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      router.push("/")
    }
  }, [isAuthenticated, isLoading, router])

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  // 表单验证
  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.username.trim()) {
      newErrors.username = "请输入用户名"
    } else if (formData.username.length < 3) {
      newErrors.username = "用户名至少3位"
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      newErrors.username = "用户名只能包含字母、数字和下划线"
    }

    if (!formData.email.trim()) {
      newErrors.email = "请输入邮箱"
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "请输入有效的邮箱地址"
    }

    if (!formData.password) {
      newErrors.password = "请输入密码"
    } else if (formData.password.length < 6) {
      newErrors.password = "密码至少6位"
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "请确认密码"
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "两次输入的密码不一致"
    }

    if (!formData.verificationCode.trim()) {
      newErrors.verificationCode = "请输入验证码"
    } else if (formData.verificationCode.length !== 6) {
      newErrors.verificationCode = "验证码为6位数字"
    }

    if (!formData.agreeTerms) {
      newErrors.agreeTerms = "请阅读并同意服务条款"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // 发送验证码
  const handleSendCode = async () => {
    if (!formData.email.trim()) {
      setErrors((prev) => ({ ...prev, email: "请先输入邮箱" }))
      return
    }

    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      setErrors((prev) => ({ ...prev, email: "请输入有效的邮箱地址" }))
      return
    }

    setIsSendingCode(true)
    setCodeMessage("")

    try {
      const result = await sendVerificationCode(formData.email)
      if (result.success) {
        setCodeMessage("验证码已发送到您的邮箱")
        setCodeSent(true)
        setCountdown(60)
        toast("验证码已发送", { description: "请检查您的邮箱" })
      } else {
        setCodeMessage(result.msg || "发送验证码失败")
        toast.error("发送验证码失败", { description: result.msg || "发送验证码失败" })
      }
    } catch (error) {
      console.error("[v0] Send code error:", error)
      setCodeMessage("网络错误，请稍后重试")
      toast.error("发送验证码失败", { description: "网络错误，请稍后重试" })
    } finally {
      setIsSendingCode(false)
    }
  }

  // 处理表单提交
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitError("")
    if (!validateForm()) return
    setIsSubmitting(true)
    try {
      const registerForm: RegisterForm = {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        verificationCode: formData.verificationCode,
      }
      let result
      try {
        result = await register(registerForm)
      } catch (err: any) {
        result = { success: false, error: err?.message || "注册失败，请重试" }
      }
      if (result && result.success) {
        toast("注册成功")
        let loginResult
        try {
          loginResult = await login(formData.email, formData.password)
        } catch (err: any) {
          loginResult = { success: false, error: err?.message || "登录失败，请重试" }
        }
        if (loginResult && loginResult.success) {
          router.push("/")
        } else {
          setSubmitError(loginResult.error || "登录失败，请重试")
          toast.error("自动登录失败", { description: loginResult.error || "登录失败，请重试" })
          router.push("/login")
        }
      } else {
        setSubmitError(result?.error || "注册失败，请重试")
        toast.error("注册失败", { description: result?.error || "注册失败，请重试" })
      }
    } catch (error) {
      setSubmitError("网络错误，请稍后重试")
      toast.error("注册失败", { description: "网络错误，请稍后重试" })
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

  if (isLoading || configLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  // If registration is disabled, show message instead of form
  if (!isRegistrationEnabled) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4 py-8">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <ProgressLink href="/" className="inline-flex items-center space-x-2">
              <Database className="h-8 w-8 text-primary" />
              <span className="text-2xl font-bold">{config?.platform.name || "AI数据集平台"}</span>
            </ProgressLink>
          </div>

          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-orange-100">
                <AlertTriangle className="h-6 w-6 text-orange-600" />
              </div>
              <CardTitle className="text-xl">注册暂时关闭</CardTitle>
              <CardDescription>平台暂时关闭了新用户注册功能，请稍后再试。</CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-sm text-muted-foreground mb-4">如果您已有账户，可以直接登录使用平台服务。</p>
              <Button asChild className="w-full">
                <ProgressLink href="/login">前往登录</ProgressLink>
              </Button>
              <div className="mt-4">
                <ProgressLink href="/" className="text-sm text-primary hover:underline">
                  返回首页
                </ProgressLink>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4 py-8">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <ProgressLink href="/" className="inline-flex items-center space-x-2">
            <Database className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold">{config?.platform.name || "AI数据集平台"}</span>
          </ProgressLink>
        </div>

        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">创建账户</CardTitle>
            <CardDescription>注册成为普通用户，开始探索AI数据集</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">

              {/* 用户名 */}
              <div className="space-y-2">
                <Label htmlFor="username">用户名</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    id="username"
                    type="text"
                    placeholder="请输入用户名"
                    value={formData.username}
                    onChange={(e) => handleInputChange("username", e.target.value)}
                    className={`pl-10 ${errors.username ? "border-destructive" : ""}`}
                    disabled={isSubmitting}
                  />
                </div>
                {errors.username && <p className="text-sm text-destructive">{errors.username}</p>}
              </div>

              {/* 邮箱 */}
              <div className="space-y-2">
                <Label htmlFor="email">邮箱</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="请输入邮箱"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    className={`pl-10 ${errors.email ? "border-destructive" : ""}`}
                    disabled={isSubmitting}
                  />
                </div>
                {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
              </div>

              {/* 密码 */}
              <div className="space-y-2">
                <Label htmlFor="password">密码</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="请输入密码（至少6位）"
                    value={formData.password}
                    onChange={(e) => handleInputChange("password", e.target.value)}
                    className={`pl-10 ${errors.password ? "border-destructive" : ""}`}
                    disabled={isSubmitting}
                  />
                </div>
                {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
              </div>

              {/* 确认密码 */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">确认密码</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="请再次输入密码"
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                    className={`pl-10 ${errors.confirmPassword ? "border-destructive" : ""}`}
                    disabled={isSubmitting}
                  />
                </div>
                {errors.confirmPassword && <p className="text-sm text-destructive">{errors.confirmPassword}</p>}
              </div>

              {/* 验证码 */}
              <div className="space-y-2">
                <Label htmlFor="verificationCode">邮箱验证码</Label>
                <div className="flex gap-2">
                  <Input
                    id="verificationCode"
                    type="text"
                    placeholder="6位验证码"
                    value={formData.verificationCode}
                    onChange={(e) => handleInputChange("verificationCode", e.target.value)}
                    className={`${errors.verificationCode ? "border-destructive" : ""}`}
                    disabled={isSubmitting}
                    maxLength={6}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleSendCode}
                    disabled={isSendingCode || isSubmitting || countdown > 0}
                    className={`shrink-0 bg-transparent${(isSendingCode || isSubmitting || countdown > 0) ? ' cursor-not-allowed' : ''}`}
                  >
                    {isSendingCode ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : countdown > 0 ? (
                      <span>{countdown}秒</span>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-1" />
                        {codeSent ? "重发" : "发送"}
                      </>
                    )}
                  </Button>
                </div>
                {errors.verificationCode && <p className="text-sm text-destructive">{errors.verificationCode}</p>}
                {codeMessage && (
                  <p className={`text-sm ${codeMessage.includes("已发送") ? "text-green-600" : "text-destructive"}`}>
                    {codeMessage}
                  </p>
                )}
              </div>

              {/* 服务条款 */}
              <div className="space-y-2">
                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="agreeTerms"
                    checked={formData.agreeTerms}
                    onCheckedChange={(checked) => handleInputChange("agreeTerms", !!checked)}
                    disabled={isSubmitting}
                    className="mt-1"
                  />
                  <Label htmlFor="agreeTerms" className="text-sm leading-relaxed">
                    我已阅读并同意{" "}
                    <ProgressLink href="/terms" className="text-primary hover:underline">
                      服务条款
                    </ProgressLink>{" "}
                    和{" "}
                    <ProgressLink href="/privacy" className="text-primary hover:underline">
                      隐私政策
                    </ProgressLink>
                  </Label>
                </div>
                {errors.agreeTerms && <p className="text-sm text-destructive">{errors.agreeTerms}</p>}
              </div>

              {/* 注册按钮 */}
              <Button type="submit" className={`w-full${(isSubmitting || !formData.agreeTerms) ? ' cursor-not-allowed' : ''}`} disabled={isSubmitting || !formData.agreeTerms}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    注册中...
                  </>
                ) : (
                  "注册账户"
                )}
              </Button>

              {/* 登录链接 */}
              <div className="text-center text-sm">
                <span className="text-muted-foreground">已有账户？</span>{" "}
                <ProgressLink href="/login" className="text-primary hover:underline">
                  立即登录
                </ProgressLink>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}