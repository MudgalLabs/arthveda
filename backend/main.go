package main 

import (
	"github.com/gin-gonic/gin"
	"net/http"
)
 
func main() {
	// gin.SetMode(gin.ReleaseMode) //optional to not get warning
	// route.SetTrustedProxies([]string{"192.168.1.2"}) //to trust only a specific value
	route := gin.Default()
	route.GET("/ping", func(context *gin.Context) {
	   context.JSON(http.StatusOK, gin.H{
		  "message": "pong",
	   })
	})
 
	err := route.Run(":6969")
	if err != nil {
	   panic(err)
	}
}
