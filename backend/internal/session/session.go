package session

import (
	"arthveda/internal/utils"
	"errors"
	"net/http"
	"os"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/sessions"
)

var Store *sessions.CookieStore

type State struct {
	UserID    int64
	UserEmail string
}

func Init() {
	Store = sessions.NewCookieStore([]byte(os.Getenv("SESSION_KEY")))

	Store.Options.HttpOnly = true
	Store.Options.Secure = utils.IsProd()
	Store.Options.MaxAge = 86400 * 1 // 1 day
}

func Middleware(c *gin.Context) {
	var err error
	var ok bool

	shouldAbort := false

	session, err := Store.Get(c.Request, "session")
	if err != nil {
		shouldAbort = true
	}

	if session.IsNew {
		shouldAbort = true
	}

	var userID int64
	var userEmail string

	userID, ok = session.Values["user_id"].(int64)
	if !ok {
		shouldAbort = true
	}

	userEmail, ok = session.Values["user_email"].(string)
	if !ok {
		shouldAbort = true
	}

	if shouldAbort {
		c.JSON(http.StatusForbidden, "Only logged in user allowed")
		c.Abort()
	}

	c.Set("user_id", userID)
	c.Set("user_email", userEmail)

	c.Next()
}

func Get(c *gin.Context) (State, error) {
	state := State{}

	session, err := Store.Get(c.Request, "session")
	if err != nil {
		return state, err
	}

	var ok bool
	var userID int64
	var userEmail string

	userID, ok = session.Values["user_id"].(int64)
	if !ok {
		return state, errors.New("user_id not found in session")
	}

	userEmail, ok = session.Values["user_email"].(string)
	if !ok {
		return state, errors.New("user_email not found in session")
	}

	state.UserID = userID
	state.UserEmail = userEmail

	return state, nil
}
