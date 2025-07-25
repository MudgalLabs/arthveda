package main

import (
	"arthveda/internal/domain/subscription"
	"arthveda/internal/env"
	"arthveda/internal/logger"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net/http"
	"time"

	paddle "github.com/PaddleHQ/paddle-go-sdk"
	"github.com/PaddleHQ/paddle-go-sdk/pkg/paddlenotification"
	"github.com/google/uuid"
)

func paddleWebhookHandler(s *subscription.Service) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		ctx := r.Context()
		l := logger.FromCtx(ctx)

		secret := env.PADDLE_WEBHOOK_SECRET
		verifier := paddle.NewWebhookVerifier(secret)

		ok, err := verifier.Verify(r)
		if err != nil || !ok {
			l.Error("failed to verify paddle webhook signature", "error", err)
			unauthorizedErrorResponse(w, r, "invalid paddle webhook signature", nil)
			return
		}

		// The webhook is verified at this point, we can safely process it
		defer r.Body.Close()

		rawBody, err := ioutil.ReadAll(r.Body)
		if err != nil {
			http.Error(w, "Unable to read body", http.StatusBadRequest)
			return
		}

		// Initially read only the event id and event type from the request
		type Webhook struct {
			EventID   string                           `json:"event_id"`
			EventType paddlenotification.EventTypeName `json:"event_type"`
		}

		var webhook Webhook

		if err := json.Unmarshal(rawBody, &webhook); err != nil {
			http.Error(w, "Unable to read body", http.StatusBadRequest)
			return
		}

		// Optionally check you've not processed this event_id before in your system

		l.Infow("received paddle webhook", "event_id", webhook.EventID, "event_type", webhook.EventType)

		// Handle each notification based on the webhook.EventType
		switch webhook.EventType {
		case paddlenotification.EventTypeNameSubscriptionCreated:
			paddleSubscription := &paddlenotification.SubscriptionCreated{}
			if err := json.Unmarshal(rawBody, paddleSubscription); err != nil {
				http.Error(w, err.Error(), http.StatusBadRequest)
				return
			}

			l.Infow("paddle webhook subscription created", "subscription", paddleSubscription)

			userID, err := getUserIDFromCustomData(paddleSubscription.Data.CustomData)
			if err != nil {
				l.Errorw("failed to get user ID from custom data", "error", err)
				break
			}

			nextBilledAt, err := time.Parse(time.RFC3339Nano, *paddleSubscription.Data.NextBilledAt)
			if err != nil {
				l.Errorw("invalid next billed at format", "error", err)
				break
			}

			var billingInterval subscription.BillingInterval
			paddleInterval := paddleSubscription.Data.BillingCycle.Interval
			switch paddleInterval {
			case "month":
				billingInterval = subscription.IntervalMonthly
			case "year":
				billingInterval = subscription.IntervalYearly
			default:
				l.Error("unknown billing interval", "interval", paddleInterval)
			}

			payload := subscription.CreatePayload{
				UserID:          userID,
				ValidUntil:      nextBilledAt,
				BillingInterval: billingInterval,
				Provider:        subscription.ProviderPaddle,
				ExternalRef:     paddleSubscription.Data.ID,
			}

			err = s.Create(ctx, payload)
			if err != nil {
				l.Errorw("failed to create user subscription", "error", err)
				http.Error(w, "Failed to create user subscription", http.StatusInternalServerError)
				return
			}

		case paddlenotification.EventTypeNameSubscriptionCanceled:
			paddleSubscription := &paddlenotification.SubscriptionCanceled{}
			if err := json.Unmarshal(rawBody, paddleSubscription); err != nil {
				http.Error(w, err.Error(), http.StatusBadRequest)
				return
			}

			l.Infow("paddle webhook subscription canceled", "subscription", paddleSubscription)

			userID, err := getUserIDFromCustomData(paddleSubscription.Data.CustomData)
			if err != nil {
				l.Errorw("failed to get user ID from custom data", "error", err)
				break
			}

			err = s.Cancelled(ctx, userID)
			if err != nil {
				l.Errorw("failed to cancel user subscription", "error", err)
				http.Error(w, "Failed to cancel user subscription", http.StatusInternalServerError)
				return
			}

		default:
			generic := &paddlenotification.GenericNotificationEvent{}
			if err := json.Unmarshal(rawBody, generic); err != nil {
				http.Error(w, err.Error(), http.StatusBadRequest)
				return
			}
		}

		successResponse(w, r, http.StatusOK, "Paddle webhook processed", nil)
	}
}

func getUserIDFromCustomData(customData map[string]interface{}) (uuid.UUID, error) {
	userIDRaw := customData["user_id"]

	userIDStr, ok := userIDRaw.(string)
	if !ok {
		return uuid.Nil, fmt.Errorf("user_id is not a string: %v", userIDRaw)
	}

	userID, err := uuid.Parse(userIDStr)
	return userID, err
}
