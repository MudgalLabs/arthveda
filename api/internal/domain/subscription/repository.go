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
	FindUserSubscriptionByExternalRef(ctx context.Context, provider PaymentProvider, externalRef string) (*UserSubscription, error)
}

type Writer interface {
	UpsertUserSubscription(ctx context.Context, us *UserSubscription) error
	UpsertPaymentProviderProfile(ctx context.Context, email string, profile *UserPaymentProviderProfile) error
	UpsertUserSubscriptionInvoice(ctx context.Context, invoice *UserSubscriptionInvoice) error
	CreateUserSubscriptionEvent(ctx context.Context, event *UserSubscriptionEvent) error
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
	UserID      *uuid.UUID
	Provider    *PaymentProvider
	ExternalRef *string
}

func (r *subscriptionRepository) FindUserSubscriptionByUserID(ctx context.Context, userID uuid.UUID) (*UserSubscription, error) {
	return r.findUserSubscription(ctx, &subscriptionFilter{UserID: &userID})
}

func (r *subscriptionRepository) FindUserSubscriptionByExternalRef(ctx context.Context, provider PaymentProvider, externalRef string) (*UserSubscription, error) {
	return r.findUserSubscription(ctx, &subscriptionFilter{Provider: &provider, ExternalRef: &externalRef})
}

func (r *subscriptionRepository) findUserSubscription(ctx context.Context, filter *subscriptionFilter) (*UserSubscription, error) {
	baseSQL := `
		SELECT user_id, plan_id, status, valid_from, valid_until, billing_interval, provider, external_ref, cancel_at_period_end, created_at, updated_at
		FROM user_subscription
	`
	sqlb := dbx.NewSQLBuilder(baseSQL)
	if filter != nil {
		if filter.UserID != nil {
			sqlb.AddCompareFilter("user_id", dbx.OperatorEQ, *filter.UserID)
		}
		if filter.Provider != nil {
			sqlb.AddCompareFilter("provider", dbx.OperatorEQ, *filter.Provider)
		}
		if filter.ExternalRef != nil {
			sqlb.AddCompareFilter("external_ref", dbx.OperatorEQ, *filter.ExternalRef)
		}
	}
	sqlb.AddSorting("created_at", "DESC")
	sql, args := sqlb.Build()

	rows, err := r.db.Query(ctx, sql, args...)
	if err != nil {
		return nil, fmt.Errorf("find user subscription query: %w", err)
	}
	defer rows.Close()

	if rows.Next() {
		us := &UserSubscription{}
		err := rows.Scan(
			&us.UserID,
			&us.PlanID,
			&us.Status,
			&us.ValidFrom,
			&us.ValidUntil,
			&us.BillingInterval,
			&us.Provider,
			&us.ExternalRef,
			&us.CancelAtPeriodEnd,
			&us.CreatedAt,
			&us.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("find user subscription scan: %w", err)
		}
		return us, nil
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("rows: %w", err)
	}

	return nil, repository.ErrNotFound
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

func (r *subscriptionRepository) UpsertPaymentProviderProfile(ctx context.Context, email string, profile *UserPaymentProviderProfile) error {
	userID := profile.UserID

	if userID == uuid.Nil {
		err := r.db.QueryRow(ctx, `SELECT user_id FROM user_profile WHERE email = $1`, email).Scan(&userID)
		if err != nil {
			return fmt.Errorf("failed to find user by email: %w", err)
		}
	}

	_, err := r.db.Exec(ctx, `
		INSERT INTO user_payment_provider_profile (
			user_id,
			provider,
			external_id,
			metadata,
			created_at
		)
		VALUES (
			$1, $2, $3, $4, $5
		)
		ON CONFLICT (user_id, provider) DO UPDATE SET
			external_id = EXCLUDED.external_id,
			metadata = EXCLUDED.metadata,
			created_at = EXCLUDED.created_at
	`, userID, profile.Provider, profile.ExternalID, profile.Metadata, profile.CreatedAt)

	return err
}

func (r *subscriptionRepository) UpsertUserSubscriptionInvoice(ctx context.Context, invoice *UserSubscriptionInvoice) error {
	_, err := r.db.Exec(ctx, `
		INSERT INTO user_subscription_invoice (
			id,
			user_id,
			provider,
			external_id,
			plan_id,
			billing_interval,
			amount_paid,
			currency,
			paid_at,
			hosted_invoice_url,
			receipt_url,
			metadata,
			created_at
		)
		VALUES (
			$1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13
		)
		ON CONFLICT (user_id, provider, external_id) DO UPDATE SET
			plan_id = EXCLUDED.plan_id,
			billing_interval = EXCLUDED.billing_interval,
			amount_paid = EXCLUDED.amount_paid,
			currency = EXCLUDED.currency,
			paid_at = EXCLUDED.paid_at,
			hosted_invoice_url = EXCLUDED.hosted_invoice_url,
			receipt_url = EXCLUDED.receipt_url,
			metadata = EXCLUDED.metadata,
			created_at = EXCLUDED.created_at
	`, invoice.ID, invoice.UserID, invoice.Provider, invoice.ExternalID, invoice.PlanID, invoice.BillingInterval, invoice.AmountPaid, invoice.Currency, invoice.PaidAt, invoice.HostedInvoiceURL, invoice.ReceiptURL, invoice.Metadata, invoice.CreatedAt)
	return err
}

func (r *subscriptionRepository) CreateUserSubscriptionEvent(ctx context.Context, event *UserSubscriptionEvent) error {
	_, err := r.db.Exec(ctx, `
		INSERT INTO user_subscription_event (
			id,
			user_id,
			event_type,
			provider,
			occurred_at
		)
		VALUES (
			$1, $2, $3, $4, $5
		)
	`, event.ID, event.UserID, event.EventType, event.Provider, event.OccurredAt)
	return err
}
