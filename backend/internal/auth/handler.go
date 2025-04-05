package auth

import (
	"arthveda/internal/logger"
	"arthveda/internal/user"
	"arthveda/internal/utils"
	"net/http"

	"github.com/gin-gonic/gin"
)

type signupRequestBody struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

func HandleSignup(c *gin.Context) {
	var body signupRequestBody

	err := c.ShouldBindJSON(&body)
	if err != nil {
		logger.Log.Error().Msg(err.Error())
		c.JSON(http.StatusBadRequest, "Invalid request body")
		return
	}

	passwordHash, err := utils.HashPassword(body.Password)
	if err != nil {
		logger.Log.Error().Msg(err.Error())
		c.JSON(http.StatusInternalServerError, "Something went wrong. Please try again.")
		return
	}

	data := user.CreateData{
		Email:        body.Email,
		PasswordHash: passwordHash,
	}

	u, err := user.Create(data)
	if err != nil {
		logger.Log.Error().Msg(err.Error())
		c.JSON(http.StatusInternalServerError, "Something went wrong. Please try again.")
		return
	}

	userRes := user.ModelToResponse(u)
	c.JSON(http.StatusCreated, userRes)
}

func HandleSignin(c *gin.Context) {}

func HandleSignout(c *gin.Context) {}
