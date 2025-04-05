package routes

import (
	"arthveda/internal/auth"
	"arthveda/internal/session"
	"arthveda/internal/user"
	"net/http"

	"github.com/gin-gonic/gin"
)

func SetupRoutes(ginEngine *gin.Engine) {
	api := ginEngine.Group("/api/v1")

	api.GET("/ping", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"message": "pong",
		})
	})

	authGroup := api.Group("/auth")
	{
		authGroup.POST("/signup", auth.HandleSignup)
		authGroup.POST("/signin", auth.HandleSignin)
		authGroup.POST("/signout", auth.HandleSignout)
	}

	api.Use(session.Middleware)

	userGroup := api.Group("/user")
	{
		userGroup.GET("/me", user.HandleGetMe)
	}
}
