-- +goose Up
-- +goose StatementBegin

ALTER TABLE user_broker_account
--   DROP COLUMN IF EXISTS oauth_client_secret,
--   DROP COLUMN IF EXISTS access_token,
  ADD COLUMN oauth_client_secret_bytes BYTEA,
  ADD COLUMN oauth_client_secret_nonce BYTEA,
  ADD COLUMN access_token_bytes BYTEA,
  ADD COLUMN access_token_bytes_nonce BYTEA;

-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin

ALTER TABLE user_broker_account
  DROP COLUMN IF EXISTS oauth_client_secret_bytes,
  DROP COLUMN IF EXISTS oauth_client_secret_nonce,
  DROP COLUMN IF EXISTS access_token_bytes,
  DROP COLUMN IF EXISTS access_token_bytes_nonce;

-- +goose StatementEnd
