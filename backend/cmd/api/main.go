package main

import (
	"arthveda/internal/auth"
	"arthveda/internal/db"
	"arthveda/internal/logger"
	"net/http"
	"os"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main() {
	logger.Init()

	// Call it once here so that we can call os.Getenv anywhere.
	godotenv.Load()

	err := db.Init()
	if err != nil {
		panic(err)
	}

	defer db.Db.Close()

	auth.InitSessions()

	route := gin.Default()

	api := route.Group("/api/v1")

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

	err = route.Run(os.Getenv("LISTEN_PORT"))
	if err != nil {
		panic(err)
	}
}
