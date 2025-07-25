package user_identity

import (
	"arthveda/internal/feature/userprofile"
	"arthveda/internal/repository"
	"context"
	"fmt"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Reader interface {
	FindUserIdentityByID(ctx context.Context, id uuid.UUID) (*UserIdentity, error)
	FindUserIdentityByEmail(ctx context.Context, email string) (*UserIdentity, error)
}

type Writer interface {
	SignUp(ctx context.Context, name string, userIdentity *UserIdentity) (*userprofile.UserProfile, error)
	Update(ctx context.Context, userIdentity *UserIdentity) error
}

type ReadWriter interface {
	Reader
	Writer
}

//
// PostgreSQL implementation
//

type filter struct {
	ID    *uuid.UUID
	Email *string
}

type userIdentityRepository struct {
	db *pgxpool.Pool
}

func NewRepository(db *pgxpool.Pool) *userIdentityRepository {
	return &userIdentityRepository{db}
}

func (r *userIdentityRepository) FindUserIdentityByID(ctx context.Context, id uuid.UUID) (*UserIdentity, error) {
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
	SELECT id, email, password_hash, verified, last_login_at, created_at, updated_at 
	FROM user_identity ` + repository.WhereSQL(where)

	rows, err := tx.Query(ctx, sql, args)
	if err != nil {
		return nil, fmt.Errorf("query: %w", err)
	}
	defer rows.Close()

	var userIdentities []*UserIdentity
	for rows.Next() {
		var ui UserIdentity

		err := rows.Scan(&ui.ID, &ui.Email, &ui.PasswordHash, &ui.Verified, &ui.LastLoginAt, &ui.CreatedAt, &ui.UpdatedAt)
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

func (r *userIdentityRepository) SignUp(ctx context.Context, name string, userIdentity *UserIdentity) (*userprofile.UserProfile, error) {
	tx, err := r.db.Begin(ctx)
	if err != nil {
		return nil, fmt.Errorf("begin: %w", err)
	}
	defer tx.Rollback(ctx)

	identitySQL := `
	INSERT INTO user_identity (id, email, password_hash, verified, oauth_provider, last_login_at, created_at, updated_at)
	VALUES (@id, @email, @password_hash, @verified, @oauth_provider, @last_login_at,  @created_at, @updated_at)
	`
	identitySQLArgs := pgx.NamedArgs{
		"id":             userIdentity.ID,
		"email":          userIdentity.Email,
		"password_hash":  userIdentity.PasswordHash,
		"verified":       userIdentity.Verified,
		"oauth_provider": userIdentity.OAuthProvider,
		"last_login_at":  userIdentity.LastLoginAt,
		"created_at":     userIdentity.CreatedAt,
		"updated_at":     userIdentity.UpdatedAt,
	}
	_, err = tx.Exec(ctx, identitySQL, identitySQLArgs)
	if err != nil {
		return nil, fmt.Errorf("user identity sql exec: %w", err)
	}

	userProfile := userprofile.NewUserProfile(userIdentity.ID, userIdentity.Email, name)

	profileSQL := `
	INSERT INTO user_profile (user_id, email, name, avatar_url, created_at, updated_at)
	VALUES (@user_id, @email, @name, @avatar_url, @created_at, @updated_at)
	`
	profileSQLArgs := pgx.NamedArgs{
		"user_id":    userProfile.UserID,
		"email":      userProfile.Email,
		"name":       userProfile.Name,
		"avatar_url": userProfile.AvatarURL,
		"created_at": userProfile.CreatedAt,
		"updated_at": userProfile.UpdatedAt,
	}
	_, err = tx.Exec(ctx, profileSQL, profileSQLArgs)
	if err != nil {
		return nil, fmt.Errorf("user profile sql exec: %w", err)
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, fmt.Errorf("commit: %w", err)
	}

	return userProfile, nil
}

func (r *userIdentityRepository) Update(ctx context.Context, userIdentity *UserIdentity) error {
	updateSQL := `
	UPDATE user_identity
	SET email = @email, verified = @verified, last_login_at = @last_login_at, updated_at = @updated_at
	WHERE id = @id
	`
	updateSQLArgs := pgx.NamedArgs{
		"id":            userIdentity.ID,
		"email":         userIdentity.Email,
		"verified":      userIdentity.Verified,
		"last_login_at": userIdentity.LastLoginAt,
		"updated_at":    userIdentity.UpdatedAt,
	}

	_, err := r.db.Exec(ctx, updateSQL, updateSQLArgs)
	if err != nil {
		return fmt.Errorf("update sql exec: %w", err)
	}

	return nil
}
