package routes

import (
	"arthveda/internal/auth"
	"arthveda/internal/session"
	"arthveda/internal/user"
	"net/http"
	"os"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func SetupRoutes(ginEngine *gin.Engine) {
	// NOTE: Cors middleware needs to be here. Anywhere else just breaks it somehow.
	ginEngine.Use(cors.New(cors.Config{
		AllowOrigins:     []string{os.Getenv("FRONTEND_URL")},
		AllowMethods:     []string{"*"},
		AllowHeaders:     []string{"content-type"},
		ExposeHeaders:    []string{"*"},
		AllowCredentials: true,
		AllowOriginFunc: func(origin string) bool {
			return origin == os.Getenv("FRONTEND_URL")
		},
		MaxAge: 12 * time.Hour,
	}))

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
