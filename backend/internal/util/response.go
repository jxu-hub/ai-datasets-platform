package util

import (
	"github.com/gin-gonic/gin"
	"net/http"
)

// 响应体
type Response struct {
	Code uint        `json:"code"`
	Msg  string      `json:"msg"`
	Data interface{} `json:"data,omitempty"`
}

// 成功响应
func Success(c *gin.Context, code uint, data interface{}) {
	c.JSON(http.StatusOK, Response{
		Code: code,
		Msg:  "success",
		Data: data,
	})
}

// 失败响应
func Failure(c *gin.Context, code uint, msg string) {
	c.JSON(http.StatusOK, Response{
		Code: code,
		Msg:  msg,
	})
}

// 参数错误
func BadRequest(c *gin.Context, msg string) {
	Failure(c, http.StatusBadRequest, msg)
}

// 未授权
func Unauthorized(c *gin.Context, msg string) {
	Failure(c, http.StatusUnauthorized, msg)
}

// 服务器错误
func InternalServerError(c *gin.Context, msg string) {
	Failure(c, http.StatusInternalServerError, msg)
}

// 未找到
func NotFound(c *gin.Context, msg string) {
	Failure(c, http.StatusNotFound, msg)
}

// 禁止访问
func Forbidden(c *gin.Context, msg string) {
	Failure(c, http.StatusForbidden, msg)
}
