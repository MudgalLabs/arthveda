package main

import (
	"arthveda/internal/auth"
	"arthveda/internal/db"
	"arthveda/internal/logger"
	"arthveda/internal/routes"
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

	ginEngine := gin.Default()

	routes.SetupRoutes(ginEngine)

	err = ginEngine.Run(os.Getenv("LISTEN_PORT"))
	if err != nil {
		panic(err)
	}
}
