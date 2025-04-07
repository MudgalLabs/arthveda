package auth

import (
	"arthveda/internal/logger"
	"arthveda/internal/user"
	"arthveda/internal/utils"
	"net/http"
	"os"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
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
		logger.Log.Error().Msg("(auth.HandleSignin) user.GetByEmail: " + err.Error())
		c.JSON(http.StatusInternalServerError, "Something went wrong. Please try again.")
		return
	}

	err = bcrypt.CompareHashAndPassword([]byte(u.PasswordHash), []byte(body.Password))
	if err != nil {
		logger.Log.Error().Msg(err.Error())
		c.JSON(http.StatusBadRequest, "Signin failed. Check email and password.")
		return
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"user_id":    u.ID,
		"user_email": u.Email,
		"exp":        utils.Now().Add(time.Hour * 24 * 30).Unix(),
	})

	tokenString, err := token.SignedString([]byte(os.Getenv("JWT_SECRET")))
	if err != nil {
		logger.Log.Error().Msg("(auth.createToken) failed to create authentication token :" + err.Error())
		c.JSON(http.StatusInternalServerError, "Something went wrong. Please try again.")
		return
	}

	c.SetSameSite(http.SameSiteLaxMode)
	c.SetCookie("Authentication", tokenString, 3600*24*30, "", "", false, true)

	c.JSON(http.StatusOK, "Signed in successfully")
}

func HandleSignout(c *gin.Context) {
	c.SetCookie("Authentication", "", -1, "", "", false, false)
	c.JSON(http.StatusOK, "Signed out")
}
