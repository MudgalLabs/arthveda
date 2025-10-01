-- +goose Up
-- +goose StatementBegin
CREATE TABLE IF NOT EXISTS uploads (
    id              UUID PRIMARY KEY,
    user_id         UUID NOT NULL REFERENCES user_profile(user_id) ON DELETE CASCADE,
    resource_type   TEXT NOT NULL,           -- e.g., 'journal', 'avatar'
    resource_id     UUID,                    -- nullable, linked resource
    object_key      TEXT NOT NULL,           -- internal MinIO key
    file_name       TEXT NOT NULL,
    mime_type       TEXT NOT NULL,
    size_bytes      BIGINT NOT NULL,
    status          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','active')),
    created_at      TIMESTAMPTZ NOT NULL,
    updated_at      TIMESTAMPTZ
);

CREATE INDEX idx_uploads_user_id ON uploads(user_id);
CREATE INDEX idx_uploads_object_key ON uploads(object_key);
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DROP TABLE IF EXISTS uploads;
DROP INDEX IF EXISTS idx_uploads_user_id;
DROP INDEX IF EXISTS idx_uploads_object_key;
-- +goose StatementEnd
