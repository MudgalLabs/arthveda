-- +goose Up
-- +goose StatementBegin

-- Create user_broker_account table
CREATE TABLE IF NOT EXISTS user_broker_account (
    id UUID PRIMARY KEY,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ,

    name VARCHAR(63) NOT NULL,
    broker_id UUID NOT NULL REFERENCES broker(id),
    user_id UUID NOT NULL REFERENCES user_profile(user_id),

    oauth_client_id TEXT,
    oauth_client_secret TEXT,
    enable_auto_sync BOOLEAN NOT NULL DEFAULT FALSE,

    -- Sync tracking fields
    last_sync_at TIMESTAMPTZ,
    last_successful_sync_at TIMESTAMPTZ,
    last_sync_status TEXT CHECK (last_sync_status IN ('success', 'failure')),

    -- Constraints
    UNIQUE(user_id, broker_id, name),
    UNIQUE(user_id, broker_id, oauth_client_id)
);

-- Add user_broker_account_id to position table (nullable for now)
ALTER TABLE position ADD COLUMN user_broker_account_id UUID;

-- Add FK from position → user_broker_account with ON DELETE SET NULL
ALTER TABLE position ADD CONSTRAINT fk_position_user_broker_account
    FOREIGN KEY (user_broker_account_id)
    REFERENCES user_broker_account(id)
    ON DELETE SET NULL;

-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin

-- Drop FK and column from position
ALTER TABLE position DROP CONSTRAINT IF EXISTS fk_position_user_broker_account;
ALTER TABLE position DROP COLUMN IF EXISTS user_broker_account_id;

-- Drop user_broker_account table
DROP TABLE IF EXISTS user_broker_account;

-- +goose StatementEnd
