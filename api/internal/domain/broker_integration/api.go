package broker_integration

import (
	"arthveda/internal/feature/broker"
	"context"
	"fmt"
	"net/url"

	"github.com/google/uuid"
	kiteconnect "github.com/zerodha/gokiteconnect/v4"
)

type APIAdapter interface {
	// Connect checks the connection to the broker's API.
	// It returns an error if the connection fails.
	GetLoginURL(ctx context.Context, userID, ubaID uuid.UUID) string
}

// GetAPIAdapter returns an importer for the given broker.
func GetAPIAdapter(b *broker.Broker, clientID, clientSecret string) (APIAdapter, error) {
	switch b.Name {
	case broker.BrokerNameZerodha:
		return &zerodhaAPIAdapter{clientID, clientSecret}, nil
	case broker.BrokerNameGroww:
		return &growwAPIAdapter{}, nil
	case broker.BrokerNameUpstox:
		return &upstoxAPIAdapter{}, nil
	default:
		return nil, fmt.Errorf("unsupported broker: %s", b.Name)
	}
}

type zerodhaAPIAdapter struct {
	clientID     string
	clientSecret string
}

func (adapter *zerodhaAPIAdapter) GetLoginURL(ctx context.Context, userID, ubaID uuid.UUID) string {
	kc := kiteconnect.New(adapter.clientID)

	urlValues := url.Values{}
	urlValues.Add("uba_id", ubaID.String())
	urlValues.Add("user_id", userID.String())

	loginURL := kc.GetLoginURLWithparams(urlValues)
	return loginURL
}

type growwAPIAdapter struct {
	clientID     string
	clientSecret string
}

func (adapter *growwAPIAdapter) GetLoginURL(ctx context.Context, userID, ubaID uuid.UUID) string {
	return ""
}

type upstoxAPIAdapter struct {
	clientID     string
	clientSecret string
}

func (adapter *upstoxAPIAdapter) GetLoginURL(ctx context.Context, userID, ubaID uuid.UUID) string {
	return ""
}
