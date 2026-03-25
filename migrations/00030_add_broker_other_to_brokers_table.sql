-- +goose Up
-- +goose StatementBegin
INSERT INTO broker (id, name, supports_file_import, supports_trade_sync) VALUES (gen_random_uuid(), 'Other', false, false);
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DELETE FROM broker WHERE name = 'Other';
-- +goose StatementEnd
