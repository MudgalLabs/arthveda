-- +goose Up
-- +goose StatementBegin

ALTER TABLE broker
ADD COLUMN supports_file_import BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN supports_trade_sync BOOLEAN NOT NULL DEFAULT FALSE;

-- Backfill: assume existing brokers support file import
UPDATE broker SET supports_file_import = TRUE;

-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin

ALTER TABLE broker
DROP COLUMN supports_file_import,
DROP COLUMN supports_trade_sync;

-- +goose StatementEnd
