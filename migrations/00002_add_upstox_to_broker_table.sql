-- +goose Up
-- +goose StatementBegin
INSERT INTO broker (id, name) VALUES (gen_random_uuid(), 'Upstox');
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DELETE FROM broker WHERE name = 'Upstox';
-- +goose StatementEnd
