package user

import (
	"arthveda/internal/lib/apires"
	"arthveda/internal/logger"
	"net/http"

	"github.com/gin-gonic/gin"
)

func HandleGetMe(c *gin.Context) {
	email := c.MustGet("user_email").(string)

	u, err := GetByEmail(email)
	if err != nil {
		logger.Log.Error().Msg("(user.HandleGetMe) user.GetByEmail: " + err.Error())
		c.JSON(http.StatusInternalServerError, apires.Internal())
		return
	}

	userRes := ModelToResponse(u)
	c.JSON(http.StatusOK, apires.Success("", userRes))
}
