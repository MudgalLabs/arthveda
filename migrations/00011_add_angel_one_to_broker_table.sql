-- +goose Up
-- +goose StatementBegin
INSERT INTO broker (id, name) VALUES (gen_random_uuid(), 'Angel One');
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DELETE FROM broker WHERE name = 'Angel One';
-- +goose StatementEnd
