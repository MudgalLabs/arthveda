package auth

import (
	"arthveda/internal/logger"
	"arthveda/internal/user"
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

	data := user.CreateData{
		Email:        body.Email,
		PasswordHash: string(passwordHashBytes),
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

type signinRequestBody struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

func HandleSignin(c *gin.Context) {
	var body signinRequestBody

	err := c.ShouldBindJSON(&body)
	if err != nil {
		logger.Log.Error().Msg(err.Error())
		c.JSON(http.StatusBadRequest, "Invalid request body")
		return
	}

	u, err := user.GetByEmail(body.Email)
	if err != nil {
		logger.Log.Error().Msg(err.Error())
		c.JSON(http.StatusInternalServerError, "Something went wrong. Please try again.")
		return
	}

	err = bcrypt.CompareHashAndPassword([]byte(u.PasswordHash), []byte(body.Password))
	if err != nil {
		logger.Log.Error().Msg(err.Error())
		c.JSON(http.StatusBadRequest, "Signin failed. Check email & password.")
		return
	}

	session, _ := SessionStore.Get(c.Request, "session")
	state := sessionState{
		UserID: u.ID,
		Email:  u.Email,
	}
	session.Values["state"] = state
	session.Save(c.Request, c.Writer)
}

func HandleSignout(c *gin.Context) {
	session, err := SessionStore.Get(c.Request, "session")
	if err != nil {
		logger.Log.Error().Msg(err.Error())
		// I'm assuming that the session is already invalid if we failed to decode it.
		// So why bother sending a error response?
		c.JSON(http.StatusOK, "Signed out")
		return
	}

	session.Options.MaxAge = -1
	session.Save(c.Request, c.Writer)
	c.JSON(http.StatusOK, "Signed out")
}
