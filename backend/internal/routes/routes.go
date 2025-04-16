package routes

import (
	"arthveda/internal/auth"
	apires "arthveda/internal/lib/apires"
	"arthveda/internal/user"
	"net/http"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func SetupRoutes(ginEngine *gin.Engine) {
	// NOTE: Cors middleware needs to be here. Anywhere else just breaks it somehow.
	ginEngine.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost"},
		AllowMethods:     []string{"*"},
		AllowHeaders:     []string{"content-type"},
		ExposeHeaders:    []string{"*"},
		AllowCredentials: true,
		AllowOriginFunc: func(origin string) bool {
			return true
		},
		MaxAge: 12 * time.Hour,
	}))

	api := ginEngine.Group("/api/v1")

	api.GET("/", func(c *gin.Context) {
		c.JSON(http.StatusOK, apires.Success("Hi! Welcome to Arthveda API. Don't be naughty.", nil))
	})

	api.GET("/ping", func(c *gin.Context) {
		c.JSON(http.StatusOK, apires.Success("Pong", nil))
	})

	authGroup := api.Group("/auth")
	{
		authGroup.POST("/signup", auth.HandleSignup)
		authGroup.POST("/signin", auth.HandleSignin)
		authGroup.POST("/signout", auth.HandleSignout)
	}

	api.Use(auth.Middleware)

	userGroup := api.Group("/user")
	{
		userGroup.GET("/me", user.HandleGetMe)
	}
}
