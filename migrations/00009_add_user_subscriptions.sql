-- +goose Up
-- +goose StatementBegin
CREATE TABLE IF NOT EXISTS user_subscription (
    user_id          UUID PRIMARY KEY REFERENCES user_profile(user_id) ON DELETE CASCADE,
    plan_id          TEXT NOT NULL CHECK (plan_id IN ('pro')),
    status           TEXT NOT NULL CHECK (status IN ('active', 'canceled', 'expired')),
    valid_from       TIMESTAMPTZ NOT NULL,
    valid_until      TIMESTAMPTZ NOT NULL,
    billing_interval TEXT NOT NULL CHECK (billing_interval IN ('monthly', 'yearly')),
    provider         TEXT NOT NULL CHECK (provider IN ('paddle')), -- e.g., 'stripe', 'paddle'
    external_ref     TEXT NOT NULL, -- e.g., Paddle subscription ID
    cancel_at_period_end BOOLEAN NOT NULL DEFAULT false, -- true if user requested cancellation
    created_at       TIMESTAMPTZ DEFAULT now(),
    updated_at       TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS user_payment_provider_profile (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES user_profile(user_id) ON DELETE CASCADE,
    provider        TEXT NOT NULL CHECK (provider IN ('paddle')),
    external_id     TEXT NOT NULL,
    metadata        JSONB,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

    UNIQUE (provider, external_id), -- e.g., unique Paddle customer ID
    UNIQUE (user_id, provider)
);

CREATE TABLE IF NOT EXISTS user_subscription_invoice (
    id                   UUID PRIMARY KEY,
    user_id              UUID NOT NULL REFERENCES user_profile(user_id) ON DELETE CASCADE,
    provider             TEXT NOT NULL CHECK (provider IN ('paddle')),                          -- e.g. 'stripe', 'paddle'
    external_id          TEXT NOT NULL,                          -- Invoice or payment ID from provider
    plan_id              TEXT NOT NULL,                          -- e.g. 'pro'
    billing_interval     TEXT NOT NULL CHECK (billing_interval IN ('monthly', 'yearly')),
    amount_paid          NUMERIC(8, 2) NOT NULL,                 
    currency             TEXT NOT NULL DEFAULT 'INR',
    paid_at              TIMESTAMPTZ NOT NULL,
    metadata             JSONB,                                  -- raw webhook or irovider data
    created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),

    UNIQUE(user_id, provider, external_id) -- e.g., unique Paddle invoice ID
);

CREATE TABLE IF NOT EXISTS user_subscription_event (
    id             UUID PRIMARY KEY,
    user_id        UUID NOT NULL REFERENCES user_profile(user_id) ON DELETE CASCADE,
    event_type TEXT NOT NULL CHECK (
        event_type IN (
            'subscribed', -- First time user successfully pays and starts a subscription
            'canceled',   -- User requests cancellation (via UI), auto-renew disabled
            'expired'     -- Subscription naturally ends (e.g. user canceled and it reached valid_until), or renewal failed
        )
    ),
    provider       TEXT NOT NULL CHECK (provider IN ('paddle')), -- e.g. 'stripe', 'paddle', 'manual'
    occurred_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DROP TABLE IF EXISTS user_subscription;
DROP TABLE IF EXISTS user_payment_provider_profile;
DROP TABLE IF EXISTS user_subscription_invoice;
DROP TABLE IF EXISTS user_subscription_event;
-- +goose StatementEnd
