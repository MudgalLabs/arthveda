package main

import (
	"arthveda/internal/db"
	"arthveda/internal/lib/env"
	"arthveda/internal/logger"
	"arthveda/internal/routes"

	"github.com/gin-gonic/gin"
)

func main() {
	// Load all the environment variables.
	env.Init()

	logger.Init()

	err := db.Init()
	if err != nil {
		panic(err)
	}

	defer db.DB.Close()

	ginEngine := gin.Default()

	routes.SetupRoutes(ginEngine)

	err = ginEngine.Run(":1337")
	if err != nil {
		panic(err)
	}
}
