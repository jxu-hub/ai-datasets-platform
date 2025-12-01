package middleware

import (
	"backend/internal/dao"
	"github.com/gin-gonic/gin"
)

func InjectRepo(repo *dao.Repository) gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Set("repo", repo)
		c.Next()
	}
}
