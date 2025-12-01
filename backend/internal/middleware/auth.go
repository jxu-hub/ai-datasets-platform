package middleware

import (
	"backend/internal/util"
	"github.com/gin-gonic/gin"
)

// JWT 认证中间件
func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// 获取 token
		tokenStr, err := c.Cookie("auth_token")
		if tokenStr == "" || err != nil {
			util.Unauthorized(c, "请登陆后再访问")
			c.Abort()
			return
		}

		// 解析 token
		claims, err := util.ParseToken(tokenStr)
		if err != nil {
			util.Unauthorized(c, "无效或过期的认证令牌")
			c.Abort()
			return
		}

		// 将用户信息存储在上下文
		c.Set("userID", claims.Id)
		c.Set("username", claims.Username)

		c.Next()
	}
}
