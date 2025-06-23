-- +goose Up
-- +goose StatementBegin
CREATE TABLE IF NOT EXISTS user_identity (
        id UUID PRIMARY KEY,
        email VARCHAR(255) NOT NULL UNIQUE,
        password_hash TEXT NOT NULL DEFAULT '',
        verified BOOLEAN NOT NULL,
        oauth_provider VARCHAR(32) NOT NULL,
        last_login_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL,
        updated_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS user_profile (
        user_id UUID PRIMARY KEY UNIQUE REFERENCES user_identity(id),
        email VARCHAR(255) NOT NULL UNIQUE,
        name VARCHAR(255) NOT NULL,
        avatar_url TEXT,
        created_at TIMESTAMPTZ NOT NULL,
        updated_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS broker (
        id UUID PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE
);

INSERT INTO broker (id, name) VALUES (gen_random_uuid(), 'Zerodha');
INSERT INTO broker (id, name) VALUES (gen_random_uuid(), 'Groww');

CREATE TYPE POSITION_INSTRUMENT AS ENUM('equity');

CREATE TYPE POSITION_DIRECTION AS ENUM('long','short');

CREATE TYPE POSITION_STATUS AS ENUM('win', 'loss', 'breakeven', 'open');

CREATE TABLE IF NOT EXISTS position (
        id UUID PRIMARY KEY,
        created_by UUID REFERENCES user_profile(user_id),
        created_at TIMESTAMPTZ NOT NULL,
        updated_at TIMESTAMPTZ,
        symbol VARCHAR(255) NOT NULL,
        instrument POSITION_INSTRUMENT NOT NULL,
        currency VARCHAR(3) NOT NULL,
        risk_amount NUMERIC(14, 2) NOT NULL,
        notes TEXT NOT NULL DEFAULT '',
        total_charges_amount NUMERIC(14, 2) NOT NULL,
        direction POSITION_DIRECTION NOT NULL,
        status POSITION_STATUS NOT NULL,
        opened_at TIMESTAMPTZ NOT NULL,
        closed_at TIMESTAMPTZ,
        gross_pnl_amount NUMERIC(14, 2) NOT NULL,
        net_pnl_amount NUMERIC(14, 2) NOT NULL,
        r_factor NUMERIC(8, 2) NOT NULL,
        net_return_percentage NUMERIC(6, 2) NOT NULL,
        charges_as_percentage_of_net_pnl NUMERIC(6, 2) NOT NULL,
        open_quantity NUMERIC(20, 8) NOT NULL,
        open_average_price_amount NUMERIC(14, 2) NOT NULL,
        broker_id UUID REFERENCES broker(id)

        -- Add a constraint to ensure notes length does not exceed 4096 characters
        CONSTRAINT notes_len CHECK (char_length(notes) <= 4096)
);

CREATE TYPE TRADE_KIND AS ENUM('buy', 'sell');

CREATE TABLE IF NOT EXISTS trade (
        id UUID PRIMARY KEY,
        position_id UUID NOT NULL REFERENCES position(id),
        created_at TIMESTAMPTZ NOT NULL,
        updated_at TIMESTAMPTZ,

        kind TRADE_KIND NOT NULL,
        time TIMESTAMPTZ NOT NULL,
        quantity NUMERIC(14, 2) NOT NULL,
        price NUMERIC(14, 2) NOT NULL,
        charges_amount NUMERIC(14, 2) NOT NULL DEFAULT 0,

        broker_trade_id VARCHAR(255)
);

CREATE TABLE sessions (
	token TEXT PRIMARY KEY,
	data BYTEA NOT NULL,
	expiry TIMESTAMPTZ NOT NULL
);

CREATE INDEX sessions_expiry_idx ON sessions (expiry);

-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
-- +goose StatementEnd

