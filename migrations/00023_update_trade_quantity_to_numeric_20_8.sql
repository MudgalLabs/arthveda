-- +goose Up
-- +goose StatementBegin
ALTER TABLE trade
ALTER COLUMN quantity TYPE NUMERIC(20, 8);
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
ALTER TABLE trade
ALTER COLUMN quantity TYPE NUMERIC(14, 2);
-- +goose StatementEnd
