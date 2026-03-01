package userprofile

import (
	"arthveda/internal/repository"
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Reader interface {
	FindUserProfileByUserID(ctx context.Context, userID uuid.UUID) (*UserProfile, error)
}

type Writer interface {
	Update(ctx context.Context, userProfile *UserProfile) error
}

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
	SELECT user_id, email, name, avatar_url, created_at, updated_at, home_currency_code
	FROM user_profile ` + repository.WhereSQL(where)

	rows, err := tx.Query(ctx, sql, args)
	if err != nil {
		return nil, fmt.Errorf("query: %w", err)
	}

	defer rows.Close()

	var userProfiles []*UserProfile
	for rows.Next() {
		var up UserProfile

		err := rows.Scan(&up.UserID, &up.Email, &up.Name, &up.AvatarURL, &up.CreatedAt, &up.UpdatedAt, &up.HomeCurrencyCode)
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

func (r *userProfileRepository) Update(ctx context.Context, userProfile *UserProfile) error {
	updatedAt := time.Now().UTC()

	sql := `
		UPDATE user_profile
		SET email = $1, name = $2, avatar_url = $3, updated_at = $4,
		home_currency_code = $5
		WHERE user_id = $6
	`

	_, err := r.db.Exec(ctx, sql, userProfile.Email, userProfile.Name, userProfile.AvatarURL, updatedAt, userProfile.HomeCurrencyCode, userProfile.UserID)
	if err != nil {
		return fmt.Errorf("update: %w", err)
	}

	return nil
}
