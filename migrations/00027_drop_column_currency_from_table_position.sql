-- +goose Up
-- +goose StatementBegin

ALTER TABLE position DROP COLUMN currency;

-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin

ALTER TABLE position
ADD COLUMN currency VARCHAR(3) NOT NULL DEFAULT 'INR' REFERENCES currency(code);

-- +goose StatementEnd
