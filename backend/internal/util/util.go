package util

import (
	"crypto/rand"
	"fmt"
	"math/big"
	"net/mail"

	gopkgmail "gopkg.in/gomail.v2"
)

// 判断邮箱格式
func IsEmailed(s string) bool {
	_, err := mail.ParseAddress(s)
	return err == nil
}

// 生成6位数字验证码
func GenerateCode() string {
	code := ""
	for i := 0; i < 6; i++ {
		num, _ := rand.Int(rand.Reader, big.NewInt(10))
		code += fmt.Sprintf("%d", num.Int64())
	}
	return code
}

// 发送邮件验证码（gomail版）
func SendEmailCode(smtpHost, smtpPort, user, password, to, code string) error {
	var portInt int
	fmt.Sscanf(smtpPort, "%d", &portInt)
	m := gopkgmail.NewMessage()
	m.SetHeader("From", user)
	m.SetHeader("To", to)
	m.SetHeader("Subject", "验证码")
	m.SetBody("text/plain", fmt.Sprintf("您的验证码是：%s，5分钟内有效。", code))
	d := gopkgmail.NewDialer(smtpHost, portInt, user, password)
	return d.DialAndSend(m)
}

// 计算增长率
func CalculateGrowthRate(current, previous int) float64 {
	if previous == 0 {
		if current > 0 {
			return float64(current) * 100
		}
		return 0
	}
	return float64(current-previous) / float64(previous) * 100
}
