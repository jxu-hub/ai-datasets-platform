package util

// 重置密码请求体
type ResetPasswordRequest struct {
	Email            string `json:"email" binding:"required,email"`
	NewPassword      string `json:"newPassword" binding:"required,min=6,max=16"`
	VerificationCode string `json:"verificationCode" binding:"required,len=6"`
}
