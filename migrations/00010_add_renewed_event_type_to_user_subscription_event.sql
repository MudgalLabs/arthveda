-- +goose Up
-- +goose StatementBegin
ALTER TABLE user_subscription_event
    DROP CONSTRAINT user_subscription_event_event_type_check,
    ADD CONSTRAINT user_subscription_event_event_type_check
        CHECK (
            event_type IN (
                'subscribed',
                'canceled',
                'expired',
                'renewed' -- User successfully renews their subscription
            )
        );
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
ALTER TABLE user_subscription_event
    DROP CONSTRAINT user_subscription_event_event_type_check,
    ADD CONSTRAINT user_subscription_event_event_type_check
        CHECK (
            event_type IN (
                'subscribed',
                'canceled',
                'expired'
            )
        );
-- +goose StatementEnd
