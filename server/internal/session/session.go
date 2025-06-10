package session

import (
	"net/http"
	"time"

	"github.com/alexedwards/scs/v2"
)

const SessionKey = "session_id"

var Manager *scs.SessionManager

func Init() {
	Manager = scs.New()
	Manager.Lifetime = time.Hour * 24 * 7 // 7 days
	Manager.Cookie.Path = "/"
	Manager.Cookie.Domain = ""
	Manager.Cookie.Secure = true
	Manager.Cookie.HttpOnly = true
	Manager.Cookie.SameSite = http.SameSiteNoneMode
}
