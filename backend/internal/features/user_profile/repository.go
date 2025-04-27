package user_profile

import (
	"arthveda/internal/repository"
	"context"
	"fmt"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Reader interface {
	FindUserProfileByUserID(ctx context.Context, userID int64) (*UserProfile, error)
}

type Writer interface{}

type ReadWriter interface {
	Reader
	Writer
}

type filter struct {
	UserID *int64
}

type userProfileRepository struct {
	db *pgxpool.Pool
}

func NewRepository(db *pgxpool.Pool) *userProfileRepository {
	return &userProfileRepository{db}
}

func (r *userProfileRepository) FindUserProfileByUserID(ctx context.Context, userID int64) (*UserProfile, error) {
	userProfiles, err := r.findUserProfiles(ctx, &filter{UserID: &userID})
	if err != nil {
		return nil, fmt.Errorf("find user profiles: %w", err)
	}

	if len(userProfiles) == 0 {
		return nil, repository.ErrNotFound
	}

	userProfile := userProfiles[0]
	return userProfile, nil
}

func (r *userProfileRepository) findUserProfiles(ctx context.Context, f *filter) ([]*UserProfile, error) {
	var where []string
	args := make(pgx.NamedArgs)

	if v := f.UserID; v != nil {
		where = append(where, "user_id = @user_id")
		args["user_id"] = v
	}

	sql := `
	SELECT user_id, display_name, display_image, created_at, updated_at
	FROM user_identity ` + repository.WhereSQL(where)

	rows, err := r.db.Query(ctx, sql, args)
	if err != nil {
		return nil, fmt.Errorf("query: %w", err)
	}
	defer rows.Close()

	var userProfiles []*UserProfile
	for rows.Next() {
		var up UserProfile

		err := rows.Scan(&up.UserID, &up.DisplayName, &up.DisplayImage, &up.CreatedAt, &up.UpdatedAt)
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
