// Package notification interacts with the Bodhveda notification service.
package notification

import (
	"arthveda/internal/env"
	"context"
	"encoding/json"
	"fmt"

	bodhveda "github.com/MudgalLabs/bodhveda/sdk/go"
)

var client *bodhveda.Client

func Init() {
	apiURL := ""
	if !env.IsProd() {
		apiURL = "http://localhost:1338"
	}

	client = bodhveda.NewClient(env.BODHVEDA_API_KEY, &bodhveda.ClientOptions{
		APIURL: apiURL,
	})
}

// Bodhveda notification channels
const (
	channelMarketing = "marketing"
)

// Bodhveda notification topics
const (
	topicNone = "none"
)

// Bodhveda notification events
const (
	eventWelcome = "welcome"
)

var (
	marketingWelcomeNotificationTarget = bodhveda.Target{
		Channel: channelMarketing,
		Topic:   topicNone,
		Event:   eventWelcome,
	}
)

func SendWelcomeNotification(ctx context.Context, recipientID string) error {
	type marketingWelcomeNotificationPayload struct {
		Title string `json:"title"`
		Body  string `json:"body"`
	}

	payload, err := json.Marshal(
		marketingWelcomeNotificationPayload{
			Title: "Welcome to Arthveda!",
			Body:  "Thank you for signing up. We're excited to have you on board!",
		},
	)
	if err != nil {
		return fmt.Errorf("marshal payload: %w", err)
	}

	req := &bodhveda.SendNotificationRequest{
		RecipientID: &recipientID,
		Target:      &marketingWelcomeNotificationTarget,
		Payload:     payload,
	}

	_, err = client.Notifications.Send(ctx, req)
	return err
}
