package session

import (
	"net/http"
	"time"

	"github.com/alexedwards/scs/v2"
)

const Lifetime = time.Hour * 24 * 7 // 7 days

var Manager *scs.SessionManager

func Init() {
	Manager = scs.New()
	Manager.Lifetime = Lifetime
	Manager.Cookie.Path = "/"
	Manager.Cookie.Domain = ""
	Manager.Cookie.Secure = true
	Manager.Cookie.HttpOnly = true
	Manager.Cookie.SameSite = http.SameSiteNoneMode
}
