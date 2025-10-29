-- +goose Up
-- +goose StatementBegin
ALTER TABLE user_subscription DROP CONSTRAINT user_subscription_plan_id_check;
ALTER TABLE user_subscription
    ADD CONSTRAINT user_subscription_plan_id_check
    CHECK (plan_id IN ('pro', 'trial'));

ALTER TABLE user_subscription DROP CONSTRAINT user_subscription_billing_interval_check;
ALTER TABLE user_subscription
    ADD CONSTRAINT user_subscription_billing_interval_check
    CHECK (billing_interval IN ('monthly', 'yearly', 'once'));

ALTER TABLE user_subscription DROP CONSTRAINT user_subscription_provider_check;
ALTER TABLE user_subscription
    ADD CONSTRAINT user_subscription_provider_check
    CHECK (provider IN ('paddle', 'internal'));

ALTER TABLE user_subscription
    ALTER COLUMN external_ref SET DEFAULT '';
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
ALTER TABLE user_subscription
    ALTER COLUMN external_ref DROP DEFAULT;

ALTER TABLE user_subscription DROP CONSTRAINT user_subscription_provider_check;
ALTER TABLE user_subscription
    ADD CONSTRAINT user_subscription_provider_check
    CHECK (provider IN ('paddle'));

ALTER TABLE user_subscription DROP CONSTRAINT user_subscription_billing_interval_check;
ALTER TABLE user_subscription
    ADD CONSTRAINT user_subscription_billing_interval_check
    CHECK (billing_interval IN ('monthly', 'yearly'));

ALTER TABLE user_subscription DROP CONSTRAINT user_subscription_plan_id_check;
ALTER TABLE user_subscription
    ADD CONSTRAINT user_subscription_plan_id_check
    CHECK (plan_id IN ('pro'));
-- +goose StatementEnd
