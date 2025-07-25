package subscription

import (
	"arthveda/internal/env"

	"github.com/PaddleHQ/paddle-go-sdk"
)

func GetPaddleClient() (*paddle.SDK, error) {
	var option paddle.Option
	if env.IsProd() {
		option = paddle.WithBaseURL(paddle.ProductionBaseURL)
	} else {
		option = paddle.WithBaseURL(paddle.SandboxBaseURL)
	}

	paddleClient, err := paddle.New(env.PADDLE_API_KEY, option)
	if err != nil {
		return nil, err
	}

	return paddleClient, nil
}
