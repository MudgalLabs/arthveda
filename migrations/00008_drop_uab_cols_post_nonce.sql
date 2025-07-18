-- +goose Up
-- +goose StatementBegin
ALTER TABLE user_broker_account
  DROP COLUMN IF EXISTS oauth_client_secret,
  DROP COLUMN IF EXISTS access_token;
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
ALTER TABLE user_broker_account
  ADD COLUMN oauth_client_secret TEXT,
  ADD COLUMN access_token TEXT;
-- +goose StatementEnd
