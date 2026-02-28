-- +goose Up
-- +goose StatementBegin

CREATE TABLE IF NOT EXISTS exchange_rate (
    rate_date           DATE NOT NULL,
    quote_currency_code VARCHAR(3) NOT NULL REFERENCES currency(code),
    rate                NUMERIC(20,8) NOT NULL,
    PRIMARY KEY (rate_date, quote_currency_code)
);

CREATE INDEX IF NOT EXISTS idx_exchange_rate_lookup
ON exchange_rate (quote_currency_code, rate_date DESC);

ALTER TABLE position
ADD COLUMN currency_code VARCHAR(3) NOT NULL DEFAULT 'INR' REFERENCES currency(code),
ADD COLUMN fx_rate NUMERIC(20,8) NOT NULL DEFAULT 1,
ADD COLUMN fx_source TEXT NOT NULL DEFAULT 'system'
CHECK (fx_source IN ('system', 'manual')),
ADD COLUMN gross_pnl_amount_away NUMERIC(20, 8),
ADD COLUMN net_pnl_amount_away NUMERIC(20, 8),
ADD COLUMN total_charges_amount_away NUMERIC(20, 8);


ALTER TABLE user_profile
ADD COLUMN home_currency_code VARCHAR(3) NOT NULL DEFAULT 'INR'
    REFERENCES currency(code);

-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin

ALTER TABLE user_profile
DROP COLUMN home_currency_code;

ALTER TABLE position
DROP COLUMN fx_source,
DROP COLUMN fx_rate,
DROP COLUMN currency_code,
DROP column gross_pnl_amount_away,
DROP column net_pnl_amount_away,
DROP column total_charges_amount_away;

DROP INDEX IF EXISTS idx_exchange_rate_lookup;

DROP TABLE exchange_rate;
-- +goose StatementEnd
