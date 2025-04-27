-- +goose Up
-- +goose StatementBegin
CREATE TABLE IF NOT EXISTS user_identity (
        id BIGSERIAL PRIMARY KEY,
        email VARCHAR(255) NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        verified BOOLEAN NOT NULL,
        failed_login_attempts INT,
        last_login_at TIMESTAMP,
        created_at TIMESTAMP NOT NULL,
        updated_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_profile (
        user_id BIGINT PRIMARY KEY,
        display_name VARCHAR(255) NOT NULL UNIQUE,
        display_image TEXT NOT NULL UNIQUE,
        created_at TIMESTAMP NOT NULL,
        updated_at TIMESTAMP
);
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DROP TABLE user_identity;
DROP TABLE user_profile;
-- +goose StatementEnd
