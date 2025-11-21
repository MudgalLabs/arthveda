-- +goose Up
-- +goose StatementBegin
ALTER TABLE position
    ALTER COLUMN net_return_percentage
    TYPE numeric(8,2)
    USING net_return_percentage::numeric(8,2);
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
ALTER TABLE position
    ALTER COLUMN net_return_percentage
    TYPE numeric(6,2)
    USING net_return_percentage::numeric(6,2);
-- +goose StatementEnd
