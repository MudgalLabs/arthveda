package user_profile

import (
	"arthveda/internal/repository"
	"context"
	"fmt"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Reader interface {
	FindUserProfileByUserID(ctx context.Context, userID uuid.UUID) (*UserProfile, error)
}

type Writer interface{}

type ReadWriter interface {
	Reader
	Writer
}

//
// PostgreSQL implementation
//

type filter struct {
	UserID *uuid.UUID
	Email  *string
}

type userProfileRepository struct {
	db *pgxpool.Pool
}

func NewRepository(db *pgxpool.Pool) *userProfileRepository {
	return &userProfileRepository{db}
}

func (r *userProfileRepository) FindUserProfileByUserID(ctx context.Context, userID uuid.UUID) (*UserProfile, error) {
	tx, err := r.db.Begin(ctx)
	if err != nil {
		return nil, fmt.Errorf("begin: %w", err)
	}

	defer tx.Rollback(ctx)

	userProfiles, err := r.findUserProfiles(ctx, tx, &filter{UserID: &userID})
	if err != nil {
		return nil, fmt.Errorf("find user profiles: %w", err)
	}

	if len(userProfiles) == 0 {
		return nil, repository.ErrNotFound
	}

	userProfile := userProfiles[0]
	return userProfile, nil
}

func (r *userProfileRepository) findUserProfiles(ctx context.Context, tx pgx.Tx, f *filter) ([]*UserProfile, error) {
	var where []string
	args := make(pgx.NamedArgs)

	if v := f.UserID; v != nil {
		where = append(where, "user_id = @user_id")
		args["user_id"] = v
	}

	if v := f.Email; v != nil {
		where = append(where, "email = @email")
		args["email"] = v
	}

	sql := `
	SELECT user_id, email, display_name, display_image, created_at, updated_at
	FROM user_profile ` + repository.WhereSQL(where)

	rows, err := tx.Query(ctx, sql, args)
	if err != nil {
		return nil, fmt.Errorf("query: %w", err)
	}

	defer rows.Close()

	var userProfiles []*UserProfile
	for rows.Next() {
		var up UserProfile

		err := rows.Scan(&up.UserID, &up.Email, &up.DisplayName, &up.DisplayImage, &up.CreatedAt, &up.UpdatedAt)
		if err != nil {
			return nil, fmt.Errorf("scan: %w", err)
		}

		userProfiles = append(userProfiles, &up)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("rows: %w", err)
	}

	return userProfiles, nil
}
