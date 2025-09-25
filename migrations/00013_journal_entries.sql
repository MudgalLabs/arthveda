-- +goose Up
-- +goose StatementBegin
CREATE TABLE IF NOT EXISTS journal_entry (
    id                  UUID PRIMARY KEY,
    user_id             UUID NOT NULL REFERENCES user_profile(user_id) ON DELETE CASCADE,
    scope               TEXT NOT NULL CHECK (scope IN ('position', 'day')),
    position_id         UUID REFERENCES position(id) ON DELETE CASCADE,
    journal_date        DATE,
    plain_text          TEXT,
    created_at          TIMESTAMPTZ NOT NULL,
    updated_at          TIMESTAMPTZ NOT NULL
);

-- optional index for filtering by user + date
-- CREATE INDEX IF NOT EXISTS idx_journal_entries_user_date ON journal_entries(user_id, journal_date);

CREATE TABLE IF NOT EXISTS journal_entry_content (
    entry_id UUID       PRIMARY KEY REFERENCES journal_entry(id) ON DELETE CASCADE,
    content JSONB       NOT NULL
);

-- CREATE TABLE IF NOT EXISTS journal_entry_attachments (
--     id                  UUID PRIMARY KEY,
--     entry_id            UUID NOT NULL REFERENCES journal_entry(id) ON DELETE CASCADE,
--     user_id             UUID NOT NULL REFERENCES user_profile(id) ON DELETE CASCADE,
--     url                 TEXT NOT NULL,
--     size_bytes          BIGINT NOT NULL,
--     type                TEXT NOT NULL CHECK (type = 'image'),
--     metadata            JSONB,
--     created_at          TIMESTAMPTZ NOT NULL
-- );

-- for fast quota checks
-- CREATE INDEX IF NOT EXISTS idx_attachments_user_id ON journal_entry_attachments(user_id);
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DROP TABLE IF EXISTS journal_entry_content;
DROP TABLE IF EXISTS journal_entry;
-- DROP TABLE IF EXISTS journal_entry_attachments;
-- +goose StatementEnd
