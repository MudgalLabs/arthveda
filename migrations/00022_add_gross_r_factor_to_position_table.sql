-- +goose Up
-- +goose StatementBegin
ALTER TABLE position
ADD COLUMN gross_r_factor NUMERIC(8,2) NOT NULL DEFAULT 0;

UPDATE position
SET gross_r_factor =
    CASE
        WHEN risk_amount IS NULL OR risk_amount = 0 THEN 0
        ELSE ROUND(gross_pnl_amount / risk_amount, 2)
    END;
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
ALTER TABLE position
DROP COLUMN gross_r_factor;
-- +goose StatementEnd
