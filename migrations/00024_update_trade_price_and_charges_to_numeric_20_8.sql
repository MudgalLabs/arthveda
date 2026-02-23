-- +goose Up
-- +goose StatementBegin
ALTER TABLE trade
ALTER COLUMN price          TYPE NUMERIC(20, 8),
ALTER COLUMN charges_amount TYPE NUMERIC(20, 8);
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
ALTER TABLE trade
ALTER COLUMN price          TYPE NUMERIC(14, 2),
ALTER COLUMN charges_amount TYPE NUMERIC(14, 2);
-- +goose StatementEnd
