-- +goose Up
-- +goose StatementBegin

ALTER TYPE POSITION_INSTRUMENT ADD VALUE IF NOT EXISTS 'future';
ALTER TYPE POSITION_INSTRUMENT ADD VALUE IF NOT EXISTS 'option';
ALTER TYPE POSITION_INSTRUMENT ADD VALUE IF NOT EXISTS 'crypto';

-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin

-- No-op: PostgreSQL does not support removing enum values directly

-- +goose StatementEnd
