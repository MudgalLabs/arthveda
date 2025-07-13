package user_broker_account

import (
	"arthveda/internal/feature/broker"
	"context"
	"errors"
	"fmt"
	"net/http"

	kiteconnect "github.com/zerodha/gokiteconnect/v4"
)

// TODO: Create a "BrokerOAuth" interface with "Connect", "Disconnect", and "Sync" methods.

type Connect interface {
	connect(ctx context.Context, clientID, clientSecret string) error
}

type growwConnect struct{}

func (g *growwConnect) connect(ctx context.Context, clientID, clientSecret string) error {
	// Implement Groww connection logic here
	return nil
}

type upstoxConnect struct{}

func (u *upstoxConnect) connect(ctx context.Context, clientID, clientSecret string) error {
	// Implement Upstox connection logic here
	return nil
}

type zerodhaConnect struct{}

func (z *zerodhaConnect) connect(ctx context.Context, clientID, clientSecret string) error {
	kc := kiteconnect.New(clientID)

	// Login URL from which request token can be obtained
	loginURL := kc.GetLoginURL()
	fmt.Println("Login URL:", loginURL)

	// Make an HTTP GET request to the login URL to get the request token.
	client := &http.Client{}
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, loginURL, nil)
	if err != nil {
		return fmt.Errorf("failed to create request: %w", err)
	}

	resp, err := client.Do(req)
	if err != nil {
		return fmt.Errorf("failed to make GET request: %w", err)
	}
	defer resp.Body.Close()

	fmt.Println("Response Status Code:", resp.StatusCode)
	if resp.StatusCode > 399 || resp.StatusCode < 200 {
		return fmt.Errorf("unexpected response status code: %d", resp.StatusCode)
	}

	return nil
}

func getConnector(name broker.Name) (Connect, error) {
	switch name {
	case "Groww":
		return &growwConnect{}, nil
	case "Upstox":
		return &upstoxConnect{}, nil
	case "Zerodha":
		return &zerodhaConnect{}, nil
	default:
		return nil, errors.New("unsupported broker name")
	}
}
