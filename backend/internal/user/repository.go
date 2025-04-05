package user

import (
	"arthveda/internal/db"
	"arthveda/internal/utils"
)

type CreateData struct {
	Email        string
	PasswordHash string
}

func Create(data CreateData) (Model, error) {
	user := Model{
		Email:        data.Email,
		PasswordHash: data.PasswordHash,
		CreatedAt:    utils.Now(),
	}

	sqlStr := `INSERT INTO users (email, password_hash, created_at) VALUES (:email, :password_hash, :created_at)`

	_, err := db.Db.NamedExec(sqlStr, user)
	if err != nil {
		return user, err
	}

	var id int64
	rows, err := db.Db.NamedQuery(`SELECT id FROM users WHERE email = :email`, user)
	if err != nil {
		return user, err
	}

	defer rows.Close()

	for rows.Next() {
		err = rows.Scan(&id)
		if err != nil {
			return user, err
		}
	}

	user.ID = id

	return user, nil
}

// REFACTOR: Create a general function to get a User row by passing WHERE clauses in a map.
func GetByEmail(email string) (Model, error) {
	var user Model

	sqlStr := `SELECT id, email, password_hash, created_at, updated_at FROM users WHERE email = $1`
	row := db.Db.QueryRowx(sqlStr, email)
	err := row.StructScan(&user)
	if err != nil {
		return user, err
	}

	return user, nil
}
