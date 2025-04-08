package auth

import (
	"arthveda/internal/logger"
	"arthveda/internal/user"
	"arthveda/internal/utils"
	"arthveda/internal/utils/apires"
	"database/sql"
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

// TODO: Validate the request body.
// Make sure email is actually an email and password is strong.
func HandleSignup(c *gin.Context) {
	var body signupRequestBody

	err := c.ShouldBindJSON(&body)
	if err != nil {
		logger.Log.Error().Msg(err.Error())
		c.JSON(http.StatusBadRequest, apires.Invalid(nil))
		return
	}

	passwordHashBytes, err := bcrypt.GenerateFromPassword([]byte(body.Password), 10)
	if err != nil {
		logger.Log.Error().Msg(err.Error())
		c.JSON(http.StatusInternalServerError, apires.Internal())
		return
	}

	userByEmail, err := user.GetByEmail(body.Email)
	if err != nil && err != sql.ErrNoRows {
		logger.Log.Error().Msg(err.Error())
		c.JSON(http.StatusInternalServerError, apires.Internal())
	}

	if userByEmail.ID > 0 {
		c.JSON(http.StatusBadRequest, apires.Error("Account already exists", nil))
		return
	}

	data := user.CreateData{
		Email:        body.Email,
		PasswordHash: string(passwordHashBytes),
	}

	u, err := user.Create(data)
	if err != nil {
		logger.Log.Error().Msg(err.Error())
		c.JSON(http.StatusInternalServerError, apires.Internal())
		return
	}

	userRes := user.ModelToResponse(u)
	c.JSON(http.StatusCreated, apires.Success("Signup successful", userRes))
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
		c.JSON(http.StatusBadRequest, apires.Invalid(nil))
		return
	}

	u, err := user.GetByEmail(body.Email)
	if err != nil {
		logger.Log.Error().Msg("(auth.HandleSignin) user.GetByEmail: " + err.Error())

		if err == sql.ErrNoRows {
			c.JSON(http.StatusNotFound, apires.Error("Account does not exist", nil))
			return
		}

		c.JSON(http.StatusInternalServerError, apires.Internal())
		return
	}

	err = bcrypt.CompareHashAndPassword([]byte(u.PasswordHash), []byte(body.Password))
	if err != nil {
		logger.Log.Error().Msg(err.Error())
		c.JSON(http.StatusBadRequest, apires.Error("Password is incorrect", nil))
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
		c.JSON(http.StatusInternalServerError, apires.Internal())
		return
	}

	c.SetSameSite(http.SameSiteLaxMode)
	c.SetCookie("Authentication", tokenString, 3600*24*30, "", "", false, true)

	userRes := user.ModelToResponse(u)
	data := map[string]any{
		"user": userRes,
	}
	c.JSON(http.StatusOK, apires.Success("Signin successful", data))
}

func HandleSignout(c *gin.Context) {
	c.SetCookie("Authentication", "", -1, "", "", false, false)
	c.JSON(http.StatusOK, apires.Success("Signout successful", nil))
}
