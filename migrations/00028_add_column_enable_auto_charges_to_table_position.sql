-- +goose Up
-- +goose StatementBegin

ALTER TABLE position
ADD COLUMN enable_auto_charges BOOLEAN NOT NULL DEFAULT false;


-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin

ALTER TABLE position DROP COLUMN enable_auto_charges;

-- +goose StatementEnd
