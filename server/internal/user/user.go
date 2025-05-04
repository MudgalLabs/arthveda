package user

import (
	"time"

	"github.com/guregu/null/v6/zero"
)

type Model struct {
	ID           int64     `json:"id" db:"id"`
	Email        string    `json:"email" db:"email"`
	PasswordHash string    `json:"-" db:"password_hash"`
	CreatedAt    time.Time `json:"created_at" db:"created_at"`
	UpdatedAt    zero.Time `json:"updated" db:"updated_at"`
}
