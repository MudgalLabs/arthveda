// Package subscription provides functionality for managing user subscriptions.
package subscription

import (
	"encoding/json"
	"time"

	"github.com/google/uuid"
	"github.com/shopspring/decimal"
)

// SubscriptionStatus enum
type SubscriptionStatus string

const (
	StatusActive   SubscriptionStatus = "active"
	StatusCanceled SubscriptionStatus = "canceled"
	StatusExpired  SubscriptionStatus = "expired"
)

// SubscriptionEventType enum
type SubscriptionEventType string

const (
	EventSubscribed SubscriptionEventType = "subscribed"
	EventCanceled   SubscriptionEventType = "canceled"
	EventExpired    SubscriptionEventType = "expired"
)

// BillingInterval enum
type BillingInterval string

const (
	IntervalMonthly BillingInterval = "monthly"
	IntervalYearly  BillingInterval = "yearly"
)

// PaymentProvider enum
type PaymentProvider string

const (
	ProviderPaddle PaymentProvider = "paddle"
)

// PlanID enum (can grow later)
type PlanID string

const (
	PlanPro PlanID = "pro"
)

// UserSubscription represents a user's subscription to a plan.
type UserSubscription struct {
	UserID            uuid.UUID          `db:"user_id" json:"user_id"`
	PlanID            PlanID             `db:"plan_id" json:"plan_id"`
	Status            SubscriptionStatus `db:"status" json:"status"`
	ValidFrom         time.Time          `db:"valid_from" json:"valid_from"`
	ValidUntil        time.Time          `db:"valid_until" json:"valid_until"`
	BillingInterval   BillingInterval    `db:"billing_interval" json:"billing_interval"`
	Provider          PaymentProvider    `db:"provider" json:"provider"`
	ExternalRef       string             `db:"external_ref" json:"external_ref"`
	CancelAtPeriodEnd bool               `db:"cancel_at_period_end" json:"cancel_at_period_end"`
	CreatedAt         time.Time          `db:"created_at" json:"created_at"`
	UpdatedAt         *time.Time         `db:"updated_at" json:"updated_at"`
}

// UserPaymentProviderProfile represents a user's payment provider configuration.
// When a Paddle customer is created, we store the provider and customer ID (external_id).
type UserPaymentProviderProfile struct {
	ID         uuid.UUID       `db:"id"`
	UserID     uuid.UUID       `db:"user_id"`
	Provider   PaymentProvider `db:"provider"`
	ExternalID string          `db:"external_id"`
	Metadata   json.RawMessage `db:"metadata"`
	CreatedAt  time.Time       `db:"created_at"`
}

// UserSubscriptionInvoice represents an invoice for a user's subscription.
// When a Paddle subscription.created, we store the invoice details.
type UserSubscriptionInvoice struct {
	ID               uuid.UUID       `db:"id"`
	UserID           uuid.UUID       `db:"user_id"`
	Provider         PaymentProvider `db:"provider"`
	ExternalID       string          `db:"external_id"` // e.g. Paddle transaction ID
	PlanID           PlanID          `db:"plan_id"`
	BillingInterval  BillingInterval `db:"billing_interval"`
	AmountPaid       decimal.Decimal `db:"amount_paid"`
	Currency         string          `db:"currency"`
	PaidAt           time.Time       `db:"paid_at"`
	HostedInvoiceURL *string         `db:"hosted_invoice_url"`
	ReceiptURL       *string         `db:"receipt_url"`
	Metadata         json.RawMessage `db:"metadata"`
	CreatedAt        time.Time       `db:"created_at"`
}

// UserSubscriptionEvent represents an event related to a user's subscription.
// This is used to track changes in subscription status - created, canceled or expired.
type UserSubscriptionEvent struct {
	ID         uuid.UUID             `db:"id"`
	UserID     uuid.UUID             `db:"user_id"`
	EventType  SubscriptionEventType `db:"event_type"`
	Provider   PaymentProvider       `db:"provider"`
	OccurredAt time.Time             `db:"occurred_at"`
}
