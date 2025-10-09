-- +goose Up
-- +goose StatementBegin
ALTER TABLE position
ALTER COLUMN charges_as_percentage_of_net_pnl TYPE NUMERIC(8, 2);
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
ALTER TABLE position
ALTER COLUMN charges_as_percentage_of_net_pnl TYPE NUMERIC(6, 2);
-- +goose StatementEnd
