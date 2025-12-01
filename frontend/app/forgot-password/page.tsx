"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import ProgressLink from "@/components/system/ProgressLink"
import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Mail, Lock, Database, Send, ArrowLeft } from "lucide-react"
import type { ResetPasswordForm } from "@/types"
import { toast } from "sonner"

export default function ForgotPasswordPage() {
  const router = useRouter()
  const { sendVerificationCode, resetPassword, isAuthenticated, isLoading } = useAuth()

  const [step, setStep] = useState<"email" | "reset">("email")
  const [formData, setFormData] = useState({
    email: "",
    verification_code: "",
    new_password: "",
    confirm_password: "",
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSendingCode, setIsSendingCode] = useState(false)
  const [submitError, setSubmitError] = useState("")
  const [successMessage, setSuccessMessage] = useState("")

  // 如果已登录，重定向到首页
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      router.push("/")
    }
  }, [isAuthenticated, isLoading, router])

  // 验证邮箱步骤
  const validateEmailStep = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.email.trim()) {
      newErrors.email = "请输入邮箱"
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "请输入有效的邮箱地址"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // 验证重置密码步骤
  const validateResetStep = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.verification_code.trim()) {
      newErrors.verification_code = "请输入验证码"
    } else if (formData.verification_code.length !== 6) {
      newErrors.verification_code = "验证码为6位数字"
    }

    if (!formData.new_password) {
      newErrors.new_password = "请输入新密码"
    } else if (formData.new_password.length < 6) {
      newErrors.new_password = "密码至少6位"
    }

    if (!formData.confirm_password) {
      newErrors.confirm_password = "请确认新密码"
    } else if (formData.new_password !== formData.confirm_password) {
      newErrors.confirm_password = "两次输入的密码不一致"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // 发送验证码
  const handleSendCode = async () => {
    if (!validateEmailStep()) return

    setIsSendingCode(true)
    setSubmitError("")

    try {
      const result = await sendVerificationCode(formData.email)

      if (result.success) {
        setSuccessMessage("验证码已发送到您的邮箱")
        toast("验证码已发送", { description: "请检查您的邮箱" })
        setStep("reset")
      } else {
        setSubmitError(result.msg || "发送验证码失败")
        toast.error("发送失败", { description: result.msg || "发送验证码失败" })
      }
    } catch (error) {
      console.error("[v0] Send code error:", error)
      setSubmitError("网络错误，请稍后重试")
      toast.error("发送失败", { description: "网络错误，请稍后重试" })
    } finally {
      setIsSendingCode(false)
    }
  }

  // 重置密码
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitError("")

    if (!validateResetStep()) return

    setIsSubmitting(true)

    const resetPasswordForm: ResetPasswordForm = {
      email: formData.email,
      verificationCode: formData.verification_code,
      newPassword: formData.new_password,
    }

    try {
      const response = await resetPassword(resetPasswordForm)
      console.log("forgot-password page.tsx response = ", response)
      if (response.success) {
      setSuccessMessage("密码重置成功，请使用新密码登录")
        toast("重置成功", { description: "请使用新密码登录" })
        router.push("/login")
      } else {
        setSubmitError(response.error || "密码重置失败")
        toast.error("重置失败", { description: response.error || "密码重置失败" })
      }
    } catch (error) {
      setSubmitError("网络错误，请稍后重试")
      toast.error("重置失败", { description: "网络错误，请稍后重试" })
    } finally {
      setIsSubmitting(false)
    }
  }

  // 处理输入变化
  const handleInputChange = (field: string, value: string) => {
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
            <CardTitle className="text-2xl">{step === "email" ? "忘记密码" : "重置密码"}</CardTitle>
            <CardDescription>
              {step === "email" ? "输入您的邮箱地址，我们将发送验证码" : "输入验证码和新密码"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {step === "email" ? (
              <div className="space-y-4">
                {/* 错误提示 */}
                {submitError && (
                  <Alert variant="destructive">
                    <AlertDescription>{submitError}</AlertDescription>
                  </Alert>
                )}

                {/* 成功提示 */}
                {successMessage && (
                  <Alert>
                    <AlertDescription>{successMessage}</AlertDescription>
                  </Alert>
                )}

                {/* 邮箱输入 */}
                <div className="space-y-2">
                  <Label htmlFor="email">邮箱地址</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="请输入注册邮箱"
                      value={formData.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                      className={`pl-10 ${errors.email ? "border-destructive" : ""}`}
                      disabled={isSendingCode}
                    />
                  </div>
                  {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                </div>

                {/* 发送验证码按钮 */}
                <Button onClick={handleSendCode} className="w-full" disabled={isSendingCode}>
                  {isSendingCode ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      发送中...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      发送验证码
                    </>
                  )}
                </Button>

                {/* 返回登录 */}
                <div className="text-center">
                  <ProgressLink href="/login" className="inline-flex items-center text-sm text-primary hover:underline">
                    <ArrowLeft className="mr-1 h-4 w-4" />
                    返回登录
                  </ProgressLink>
                </div>
              </div>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-4">
                {/* 错误提示 */}
                {submitError && (
                  <Alert variant="destructive">
                    <AlertDescription>{submitError}</AlertDescription>
                  </Alert>
                )}

                {/* 成功提示 */}
                {successMessage && (
                  <Alert>
                    <AlertDescription>{successMessage}</AlertDescription>
                  </Alert>
                )}

                {/* 验证码 */}
                <div className="space-y-2">
                  <Label htmlFor="verification_code">验证码</Label>
                  <Input
                    id="verification_code"
                    type="text"
                    placeholder="请输入6位验证码"
                    value={formData.verification_code}
                    onChange={(e) => handleInputChange("verification_code", e.target.value)}
                    className={errors.verification_code ? "border-destructive" : ""}
                    disabled={isSubmitting}
                    maxLength={6}
                  />
                  {errors.verification_code && <p className="text-sm text-destructive">{errors.verification_code}</p>}
                </div>

                {/* 新密码 */}
                <div className="space-y-2">
                  <Label htmlFor="new_password">新密码</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      id="new_password"
                      type="password"
                      placeholder="请输入新密码（至少6位）"
                      value={formData.new_password}
                      onChange={(e) => handleInputChange("new_password", e.target.value)}
                      className={`pl-10 ${errors.new_password ? "border-destructive" : ""}`}
                      disabled={isSubmitting}
                    />
                  </div>
                  {errors.new_password && <p className="text-sm text-destructive">{errors.new_password}</p>}
                </div>

                {/* 确认新密码 */}
                <div className="space-y-2">
                  <Label htmlFor="confirm_password">确认新密码</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      id="confirm_password"
                      type="password"
                      placeholder="请再次输入新密码"
                      value={formData.confirm_password}
                      onChange={(e) => handleInputChange("confirm_password", e.target.value)}
                      className={`pl-10 ${errors.confirm_password ? "border-destructive" : ""}`}
                      disabled={isSubmitting}
                    />
                  </div>
                  {errors.confirm_password && <p className="text-sm text-destructive">{errors.confirm_password}</p>}
                </div>

                {/* 重置密码按钮 */}
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      重置中...
                    </>
                  ) : (
                    "重置密码"
                  )}
                </Button>

                {/* 返回上一步 */}
                <div className="text-center">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setStep("email")}
                    disabled={isSubmitting}
                    className="text-sm"
                  >
                    <ArrowLeft className="mr-1 h-4 w-4" />
                    返回上一步
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
