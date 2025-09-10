-- +goose Up
-- +goose StatementBegin
INSERT INTO broker (id, name) VALUES (gen_random_uuid(), 'Kotak Securities');
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DELETE FROM broker WHERE name = 'Kotak Securities';
-- +goose StatementEnd
