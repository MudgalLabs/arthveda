package auth

import (
	"arthveda/internal/utils"
	"encoding/gob"
	"os"

	"github.com/gorilla/sessions"
)

var SessionStore *sessions.CookieStore

type sessionState struct {
	UserID int    `json:"user_id"`
	Email  string `json:"email"`
}

func InitSessions() {
	SessionStore = sessions.NewCookieStore([]byte(os.Getenv("SESSION_KEY")))

	SessionStore.Options.HttpOnly = true
	SessionStore.Options.Secure = utils.IsProd()

	gob.Register(&sessionState{})
}
