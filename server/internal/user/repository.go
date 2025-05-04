package user

import (
	"context"
	"time"
)

type CreateData struct {
	Email        string
	PasswordHash string
}

func Create(data CreateData) (Model, error) {
	user := Model{
		Email:        data.Email,
		PasswordHash: data.PasswordHash,
		CreatedAt:    time.Now().UTC(),
	}

	// sqlStr := `INSERT INTO users (email, password_hash, created_at) VALUES (:email, :password_hash, :created_at)`

	// _, err := db.DB.Exec(context.Background(), sqlStr, user)
	// if err != nil {
	// 	return user, err
	// }

	// var id int64
	// rows, err := db.DB.Query(context.Background(), `SELECT id FROM users WHERE email = :email`, user)
	// if err != nil {
	// 	return user, err
	// }

	// defer rows.Close()

	// for rows.Next() {
	// 	err = rows.Scan(&id)
	// 	if err != nil {
	// 		return user, err
	// 	}
	// }

	// user.ID = id

	return user, nil
}

// REFACTOR: Create a general function to get a User row by passing WHERE clauses in a map.
func GetByID(ctx context.Context, id int64) (Model, error) {
	var user Model

	// sqlStr := `SELECT id, email, password_hash, created_at, updated_at FROM users WHERE id = $1`
	// row := db.DB.QueryRow(ctx, sqlStr, id)
	// err := row.Scan(&user.ID, &user.Email, &user.PasswordHash, &user.CreatedAt, &user.UpdatedAt)
	// if err != nil {
	// 	return user, err
	// }

	return user, nil
}

// REFACTOR: Create a general function to get a User row by passing WHERE clauses in a map.
func GetByEmail(email string) (Model, error) {
	var user Model

	// // sqlStr := `SELECT id, email, password_hash, created_at, updated_at FROM users WHERE email = $1`
	// row := db.DB.QueryRow(context.Background(), sqlStr, email)
	// err := row.Scan(&user.ID, &user.Email, &user.PasswordHash, &user.CreatedAt, &user.UpdatedAt)
	// if err != nil {
	// 	return user, err
	// }

	return user, nil
}
