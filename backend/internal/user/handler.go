package user

import (
	"arthveda/internal/logger"
	"arthveda/internal/session"
	"net/http"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
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

	passwordHashBytes, err := bcrypt.GenerateFromPassword([]byte(body.Password), 10)
	if err != nil {
		logger.Log.Error().Msg(err.Error())
		c.JSON(http.StatusInternalServerError, "Something went wrong. Please try again.")
		return
	}

	data := CreateData{
		Email:        body.Email,
		PasswordHash: string(passwordHashBytes),
	}

	u, err := Create(data)
	if err != nil {
		logger.Log.Error().Msg(err.Error())
		c.JSON(http.StatusInternalServerError, "Something went wrong. Please try again.")
		return
	}

	userRes := ModelToResponse(u)
	c.JSON(http.StatusCreated, userRes)
}

func HandleGetMe(c *gin.Context) {
	ss, _ := session.Get(c)

	u, err := GetByEmail(ss.UserEmail)
	if err != nil {
		logger.Log.Error().Msg(err.Error())
		c.JSON(http.StatusInternalServerError, "Something went wrong. Please try again.")
		return
	}

	userRes := ModelToResponse(u)
	c.JSON(http.StatusOK, userRes)
}
