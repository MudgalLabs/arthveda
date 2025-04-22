-- +goose Up
-- +goose StatementBegin
CREATE TABLE IF NOT EXISTS users (
        ID BIGSERIAL PRIMARY KEY,
        EMAIL VARCHAR(255) NOT NULL UNIQUE,
        PASSWORD_HASH TEXT NOT NULL,
        CREATED_AT TIMESTAMPTZ NOT NULL,
        UPDATED_AT TIMESTAMPTZ
);
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
-- +goose StatementEnd
