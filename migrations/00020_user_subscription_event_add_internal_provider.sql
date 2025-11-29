-- +goose Up
-- +goose StatementBegin
ALTER TABLE user_subscription_event DROP CONSTRAINT user_subscription_event_provider_check;
ALTER TABLE user_subscription_event
    ADD CONSTRAINT user_subscription_event_provider_check
    CHECK (provider IN ('paddle', 'internal'));
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
ALTER TABLE user_subscription_event DROP CONSTRAINT user_subscription_event_provider_check;
ALTER TABLE user_subscription_event
    ADD CONSTRAINT user_subscription_event_provider_check
    CHECK (provider IN ('paddle'));
-- +goose StatementEnd
