package user_identity

import (
	"arthveda/internal/features/user_profile"
	"arthveda/internal/repository"
	"context"
	"fmt"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Reader interface {
	FindUserIdentityByID(ctx context.Context, id int64) (*UserIdentity, error)
	FindUserIdentityByEmail(ctx context.Context, email string) (*UserIdentity, error)
}

type Writer interface {
	SignUp(ctx context.Context, userIdentity *UserIdentity) (*user_profile.UserProfile, error)
}

type ReadWriter interface {
	Reader
	Writer
}

//
// PostgreSQL implementation
//

type filter struct {
	ID    *int64
	Email *string
}

type userIdentityRepository struct {
	db *pgxpool.Pool
}

func NewRepository(db *pgxpool.Pool) *userIdentityRepository {
	return &userIdentityRepository{db}
}

func (r *userIdentityRepository) FindUserIdentityByID(ctx context.Context, id int64) (*UserIdentity, error) {
	tx, err := r.db.Begin(ctx)
	if err != nil {
		return nil, fmt.Errorf("begin: %w", err)
	}
	defer tx.Rollback(ctx)

	userIdentities, err := r.findUserIdentities(ctx, tx, &filter{ID: &id})
	if err != nil {
		return nil, fmt.Errorf("find user identities: %w", err)
	}

	if len(userIdentities) == 0 {
		return nil, repository.ErrNotFound
	}

	userIdentity := userIdentities[0]
	return userIdentity, nil
}

func (r *userIdentityRepository) FindUserIdentityByEmail(ctx context.Context, email string) (*UserIdentity, error) {
	tx, err := r.db.Begin(ctx)
	if err != nil {
		return nil, fmt.Errorf("begin: %w", err)
	}
	defer tx.Rollback(ctx)

	userIdentities, err := r.findUserIdentities(ctx, tx, &filter{Email: &email})
	if err != nil {
		return nil, fmt.Errorf("find user identities: %w", err)
	}

	if len(userIdentities) == 0 {
		return nil, repository.ErrNotFound
	}

	userIdentity := userIdentities[0]
	return userIdentity, nil
}

func (r *userIdentityRepository) findUserIdentities(ctx context.Context, tx pgx.Tx, f *filter) ([]*UserIdentity, error) {
	var where []string
	args := make(pgx.NamedArgs)

	if v := f.ID; v != nil {
		where = append(where, "id = @id")
		args["id"] = v
	}

	if v := f.Email; v != nil {
		where = append(where, "email = @email")
		args["email"] = v
	}

	sql := `
	SELECT id, email, password_hash, verified, failed_login_attempts, last_login_at, created_at, updated_at 
	FROM user_identity ` + repository.WhereSQL(where)

	rows, err := tx.Query(ctx, sql, args)
	if err != nil {
		return nil, fmt.Errorf("query: %w", err)
	}
	defer rows.Close()

	var userIdentities []*UserIdentity
	for rows.Next() {
		var ui UserIdentity

		err := rows.Scan(&ui.ID, &ui.Email, &ui.PasswordHash, &ui.Verified, &ui.FailedLoginAttempts, &ui.LastLoginAt, &ui.CreatedAt, &ui.UpdatedAt)
		if err != nil {
			return nil, fmt.Errorf("scan: %w", err)
		}

		userIdentities = append(userIdentities, &ui)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("rows: %w", err)
	}

	return userIdentities, nil
}

func (r *userIdentityRepository) SignUp(ctx context.Context, userIdentity *UserIdentity) (*user_profile.UserProfile, error) {
	tx, err := r.db.Begin(ctx)
	if err != nil {
		return nil, fmt.Errorf("begin: %w", err)
	}
	defer tx.Rollback(ctx)

	identitySQL := `
	INSERT INTO user_identity (email, password_hash, verified, failed_login_attempts, last_login_at, created_at, updated_at)
	VALUES (@email, @password_hash, @verified, @failed_login_attempts, @last_login_at, @created_at, @updated_at)
	RETURNING id
	`
	identitySQLArgs := pgx.NamedArgs{
		"email":                  userIdentity.Email,
		"password_hash":          userIdentity.PasswordHash,
		"verified":               userIdentity.Verified,
		"failed_login_attempts ": userIdentity.FailedLoginAttempts,
		"last_login_at ":         userIdentity.LastLoginAt,
		"created_at":             userIdentity.CreatedAt,
		"updated_at":             userIdentity.UpdatedAt,
	}
	var userID int64
	err = tx.QueryRow(ctx, identitySQL, identitySQLArgs).Scan(&userID)
	if err != nil {
		return nil, fmt.Errorf("user identity sql scan: %w", err)
	}

	userProfile := user_profile.NewUserProfile(userID, userIdentity.Email)

	profileSQL := `
	INSERT INTO user_profile (user_id, email, display_name, display_image, created_at, updated_at)
	VALUES (@user_id, @email, @display_name, @display_image, @created_at, @updated_at)
	RETURNING user_id, email, display_name, display_image, created_at, updated_at
	`
	profileSQLArgs := pgx.NamedArgs{
		"user_id":       userProfile.UserID,
		"email":         userProfile.Email,
		"display_name":  userProfile.DisplayName,
		"display_image": userProfile.DisplayImage,
		"created_at":    userProfile.CreatedAt,
		"updated_at":    userProfile.UpdatedAt,
	}
	err = tx.QueryRow(ctx, profileSQL, profileSQLArgs).Scan(&userProfile.UserID, &userProfile.Email, &userProfile.DisplayName, &userProfile.DisplayImage, &userProfile.CreatedAt, &userProfile.UpdatedAt)
	if err != nil {
		return nil, fmt.Errorf("user profile sql exec: %w", err)
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, fmt.Errorf("commit: %w", err)
	}

	return userProfile, nil
}
