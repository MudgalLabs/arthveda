package utils

import (
	"time"
)

func Now() time.Time {
	loc, _ := time.LoadLocation("Asia/Kolkata")
	return time.Now().In(loc)
}
