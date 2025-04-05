package user

import (
	"database/sql"
	"time"
)

type Model struct {
	ID           int64        `db:"id"`
	Email        string       `db:"email"`
	PasswordHash string       `db:"password_hash"`
	CreatedAt    time.Time    `db:"created_at"`
	UpdatedAt    sql.NullTime `db:"updated_at"`
}

type Response struct {
	ID        int64     `json:"id"`
	Email     string    `json:"email"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

func ModelToResponse(m Model) Response {
	return Response{
		ID:        m.ID,
		Email:     m.Email,
		CreatedAt: m.CreatedAt,
		UpdatedAt: m.UpdatedAt.Time,
	}
}
