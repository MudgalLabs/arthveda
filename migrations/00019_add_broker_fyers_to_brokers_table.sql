-- +goose Up
-- +goose StatementBegin
INSERT INTO broker (id, name, supports_file_import) VALUES (gen_random_uuid(), 'Fyers', true);
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DELETE FROM broker WHERE name = 'Fyers';
-- +goose StatementEnd

