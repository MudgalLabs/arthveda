package user

import (
	"arthveda/internal/logger"
	"net/http"

	"github.com/gin-gonic/gin"
)

func HandleGetMe(c *gin.Context) {
	email := c.MustGet("user_email").(string)

	u, err := GetByEmail(email)
	if err != nil {
		logger.Log.Error().Msg("(user.HandleGetMe) user.GetByEmail: " + err.Error())
		c.JSON(http.StatusInternalServerError, "Something went wrong. Please try again.")
		return
	}

	userRes := ModelToResponse(u)
	c.JSON(http.StatusOK, userRes)
}
