package auth

import (
	"arthveda/internal/logger"
	"net/http"
	"os"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

func Middleware(c *gin.Context) {
	errorMsg := "This route requires authentication, please signin."

	tokenString, err := c.Cookie("Authentication")
	if err != nil {
		logger.Log.Debug().Msg("(auth.Middleware) while reading the cookie: " + err.Error())
		c.AbortWithStatusJSON(http.StatusUnauthorized, errorMsg)
		return
	}

	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (any, error) {
		return []byte(os.Getenv("JWT_SECRET")), nil
	}, jwt.WithValidMethods([]string{jwt.SigningMethodHS256.Alg()}))

	if err != nil {
		logger.Log.Debug().Msg("(auth.Middleware) while parsing the token: " + err.Error())
		c.AbortWithStatusJSON(http.StatusUnauthorized, errorMsg)
		return
	}

	if claims, ok := token.Claims.(jwt.MapClaims); ok {
		userID := claims["user_id"].(float64)
		userEmail := claims["user_email"].(string)

		c.Set("user_id", userID)
		c.Set("user_email", userEmail)
	} else {
		logger.Log.Debug().Msg("(auth.Middleware) while checking claims in the token")
		c.AbortWithStatusJSON(http.StatusUnauthorized, errorMsg)
		return
	}

	c.Next()
}
