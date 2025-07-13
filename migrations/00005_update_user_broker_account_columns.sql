-- +goose Up
-- +goose StatementBegin

ALTER TABLE user_broker_account
	DROP COLUMN IF EXISTS enable_auto_sync,
	DROP COLUMN IF EXISTS last_successful_sync_at,
	DROP COLUMN IF EXISTS last_sync_status,
	ADD COLUMN access_token TEXT;

-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin

ALTER TABLE user_broker_account
	DROP COLUMN IF EXISTS access_token,
	ADD COLUMN enable_auto_sync BOOLEAN NOT NULL DEFAULT FALSE,
	ADD COLUMN last_successful_sync_at TIMESTAMPTZ,
	ADD COLUMN last_sync_status TEXT CHECK (last_sync_status IN ('success', 'failure'));

-- +goose StatementEnd
