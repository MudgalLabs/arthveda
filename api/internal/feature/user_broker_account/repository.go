package user_broker_account

import (
	"arthveda/internal/dbx"
	"arthveda/internal/repository"
	"context"
	"fmt"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Reader interface {
	GetByID(ctx context.Context, id uuid.UUID) (*UserBrokerAccount, error)
	ListByUserID(ctx context.Context, userID uuid.UUID) ([]*UserBrokerAccount, error)
	ExistsByNameAndBrokerIDAndUserID(ctx context.Context, name string, brokerID, userID uuid.UUID) (bool, error)
}

type Writer interface {
	Create(ctx context.Context, account *UserBrokerAccount) (*UserBrokerAccount, error)
	Update(ctx context.Context, account *UserBrokerAccount) (*UserBrokerAccount, error)
	Delete(ctx context.Context, id uuid.UUID) error
}

type ReadWriter interface {
	Reader
	Writer
}

type userBrokerAccountRepository struct {
	db *pgxpool.Pool
}

func NewRepository(db *pgxpool.Pool) *userBrokerAccountRepository {
	return &userBrokerAccountRepository{db}
}

type filters struct {
	ID       *uuid.UUID
	UserID   *uuid.UUID
	BrokerID *uuid.UUID
	Name     *string
}

func (r *userBrokerAccountRepository) Create(ctx context.Context, account *UserBrokerAccount) (*UserBrokerAccount, error) {
	tx, err := r.db.Begin(ctx)
	if err != nil {
		return nil, fmt.Errorf("begin: %w", err)
	}
	defer tx.Rollback(ctx)

	sql := `
		INSERT INTO user_broker_account (
			id, name, broker_id, user_id, created_at
		) VALUES ($1, $2, $3, $4, $5)
	`

	_, err = tx.Exec(ctx, sql,
		account.ID,
		account.Name,
		account.BrokerID,
		account.UserID,
		account.CreatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("insert: %w", err)
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, fmt.Errorf("commit: %w", err)
	}

	return account, nil
}

func (r *userBrokerAccountRepository) Update(ctx context.Context, account *UserBrokerAccount) (*UserBrokerAccount, error) {
	tx, err := r.db.Begin(ctx)
	if err != nil {
		return nil, fmt.Errorf("begin: %w", err)
	}
	defer tx.Rollback(ctx)

	sql := `
		UPDATE user_broker_account 
		SET updated_at = $2, name = $3
		WHERE id = $1
	`

	_, err = tx.Exec(ctx, sql, account.ID, account.UpdatedAt, account.Name)
	if err != nil {
		return nil, fmt.Errorf("update: %w", err)
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, fmt.Errorf("commit: %w", err)
	}

	return account, nil
}

func (r *userBrokerAccountRepository) Delete(ctx context.Context, id uuid.UUID) error {
	tx, err := r.db.Begin(ctx)
	if err != nil {
		return fmt.Errorf("begin: %w", err)
	}
	defer tx.Rollback(ctx)

	// First unlink positions
	_, err = tx.Exec(ctx, `
		UPDATE position 
		SET user_broker_account_id = NULL 
		WHERE user_broker_account_id = $1
	`, id)
	if err != nil {
		return fmt.Errorf("unlink positions: %w", err)
	}

	// Then delete the account
	_, err = tx.Exec(ctx, `DELETE FROM user_broker_account WHERE id = $1`, id)
	if err != nil {
		return fmt.Errorf("delete account: %w", err)
	}

	if err := tx.Commit(ctx); err != nil {
		return fmt.Errorf("commit: %w", err)
	}

	return nil
}

func (r *userBrokerAccountRepository) GetByID(ctx context.Context, id uuid.UUID) (*UserBrokerAccount, error) {
	accounts, err := r.findAccounts(ctx, filters{ID: &id})
	if err != nil {
		return nil, fmt.Errorf("find accounts: %w", err)
	}

	if len(accounts) == 0 {
		return nil, repository.ErrNotFound
	}

	return accounts[0], nil
}

func (r *userBrokerAccountRepository) ListByUserID(ctx context.Context, userID uuid.UUID) ([]*UserBrokerAccount, error) {
	accounts, err := r.findAccounts(ctx, filters{UserID: &userID})
	if err != nil {
		return nil, fmt.Errorf("find accounts: %w", err)
	}

	return accounts, nil
}

func (r *userBrokerAccountRepository) ExistsByNameAndBrokerIDAndUserID(ctx context.Context, name string, brokerID, userID uuid.UUID) (bool, error) {
	accounts, err := r.findAccounts(ctx, filters{
		Name:     &name,
		BrokerID: &brokerID,
		UserID:   &userID,
	})
	if err != nil {
		return false, fmt.Errorf("find accounts: %w", err)
	}

	return len(accounts) > 0, nil
}

func (r *userBrokerAccountRepository) findAccounts(ctx context.Context, f filters) ([]*UserBrokerAccount, error) {
	baseSQL := `
		SELECT id, created_at, updated_at, name, broker_id, user_id, 
		       oauth_client_id, oauth_client_secret, enable_auto_sync,
		       last_sync_at, last_successful_sync_at, last_sync_status
		FROM user_broker_account
	`

	builder := dbx.NewSQLBuilder(baseSQL)

	if v := f.ID; v != nil {
		builder.AddCompareFilter("id", "=", v)
	}
	if v := f.UserID; v != nil {
		builder.AddCompareFilter("user_id", "=", v)
	}
	if v := f.BrokerID; v != nil {
		builder.AddCompareFilter("broker_id", "=", v)
	}
	if v := f.Name; v != nil {
		builder.AddCompareFilter("name", "=", v)
	}

	builder.AddSorting("created_at", "DESC")

	sql, args := builder.Build()

	rows, err := r.db.Query(ctx, sql, args...)
	if err != nil {
		return nil, fmt.Errorf("query: %w", err)
	}
	defer rows.Close()

	accounts := []*UserBrokerAccount{}
	for rows.Next() {
		var account UserBrokerAccount
		err := rows.Scan(
			&account.ID,
			&account.CreatedAt,
			&account.UpdatedAt,
			&account.Name,
			&account.BrokerID,
			&account.UserID,
			&account.OAuthClientID,
			&account.OAuthClientSecret,
			&account.EnableAutoSync,
			&account.LastSyncAt,
			&account.LastSuccessfulSyncAt,
			&account.LastSyncStatus,
		)
		if err != nil {
			return nil, fmt.Errorf("scan: %w", err)
		}
		accounts = append(accounts, &account)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("rows error: %w", err)
	}

	return accounts, nil
}
