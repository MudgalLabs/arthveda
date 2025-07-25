package subscription

import (
	"context"
	"fmt"

	"arthveda/internal/dbx"
	"arthveda/internal/repository"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Reader interface {
	FindUserSubscriptionByUserID(ctx context.Context, userID uuid.UUID) (*UserSubscription, error)
}

type Writer interface {
	UpsertUserSubscription(ctx context.Context, us *UserSubscription) error
}

type ReadWriter interface {
	Reader
	Writer
}

type subscriptionRepository struct {
	db *pgxpool.Pool
}

func NewRepository(db *pgxpool.Pool) *subscriptionRepository {
	return &subscriptionRepository{db}
}

type subscriptionFilter struct {
	UserID *uuid.UUID
}

func (r *subscriptionRepository) FindUserSubscriptionByUserID(ctx context.Context, userID uuid.UUID) (*UserSubscription, error) {
	subs, err := r.findSubscriptions(ctx, &subscriptionFilter{UserID: &userID})
	if err != nil {
		return nil, err
	}
	if len(subs) == 0 {
		return nil, repository.ErrNotFound
	}
	return subs[0], nil
}

func (r *subscriptionRepository) findSubscriptions(ctx context.Context, filter *subscriptionFilter) ([]*UserSubscription, error) {
	baseSQL := `
		SELECT user_id, plan_id, status, valid_from, valid_until, billing_interval, provider, external_ref, created_at, updated_at
		FROM user_subscription
	`
	sqlb := dbx.NewSQLBuilder(baseSQL)
	if filter != nil && filter.UserID != nil {
		sqlb.AddCompareFilter("user_id", dbx.OperatorEQ, *filter.UserID)
	}
	sqlb.AddSorting("created_at", "DESC")

	sql, args := sqlb.Build()

	rows, err := r.db.Query(ctx, sql, args...)
	if err != nil {
		return nil, fmt.Errorf("find subscriptions query: %w", err)
	}
	defer rows.Close()

	var results []*UserSubscription
	for rows.Next() {
		us := UserSubscription{}
		err := rows.Scan(
			&us.UserID,
			&us.PlanID,
			&us.Status,
			&us.ValidFrom,
			&us.ValidUntil,
			&us.BillingInterval,
			&us.Provider,
			&us.ExternalRef,
			&us.CreatedAt,
			&us.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("find subscriptions scan: %w", err)
		}

		results = append(results, &us)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("rows: %w", err)
	}

	return results, nil
}

func (r *subscriptionRepository) UpsertUserSubscription(ctx context.Context, us *UserSubscription) error {
	_, err := r.db.Exec(ctx, `
		INSERT INTO user_subscription (
			user_id,
			plan_id,
			status,
			valid_from,
			valid_until,
			billing_interval,
			provider,
			external_ref,
			cancel_at_period_end,
			created_at,
			updated_at
		)
		VALUES (
			$1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11
		)
		ON CONFLICT (user_id) DO UPDATE SET
			plan_id = EXCLUDED.plan_id,
			status = EXCLUDED.status,
			valid_from = EXCLUDED.valid_from,
			valid_until = EXCLUDED.valid_until,
			billing_interval = EXCLUDED.billing_interval,
			provider = EXCLUDED.provider,
			external_ref = EXCLUDED.external_ref,
			cancel_at_period_end = EXCLUDED.cancel_at_period_end,
			created_at = EXCLUDED.created_at,
			updated_at = EXCLUDED.updated_at
	`, us.UserID, us.PlanID, us.Status, us.ValidFrom, us.ValidUntil, us.BillingInterval, us.Provider, us.ExternalRef, us.CancelAtPeriodEnd, us.CreatedAt, us.UpdatedAt)

	return err
}
