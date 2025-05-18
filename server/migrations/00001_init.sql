-- +goose Up
-- +goose StatementBegin
CREATE TABLE IF NOT EXISTS user_identity (
        id UUID PRIMARY KEY,
        email VARCHAR(255) NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        verified BOOLEAN NOT NULL,
        failed_login_attempts INT NOT NULL,
        last_login_at TIMESTAMP,
        created_at TIMESTAMP NOT NULL,
        updated_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_profile (
        user_id UUID PRIMARY KEY UNIQUE,
        email VARCHAR(255) NOT NULL UNIQUE,
        display_name VARCHAR(255) NOT NULL,
        display_image TEXT NOT NULL,
        created_at TIMESTAMP NOT NULL,
        updated_at TIMESTAMP,

        FOREIGN KEY (user_id) REFERENCES user_identity(id)
);

CREATE TYPE POSITION_INSTRUMENT AS ENUM('equity','future','option');

CREATE TYPE POSITION_DIRECTION AS ENUM('long','short');

CREATE TYPE POSITION_STATUS AS ENUM('win', 'loss', 'breakeven', 'open');

CREATE TABLE IF NOT EXISTS position (
        id UUID PRIMARY KEY,
        user_id UUID,
        created_at TIMESTAMP NOT NULL,
        updated_at TIMESTAMP,
        symbol VARCHAR(255) NOT NULL,
        instrument POSITION_INSTRUMENT NOT NULL,
        currency_code VARCHAR(3) NOT NULL,
        risk_amount NUMERIC(14, 2) NOT NULL,
        charges_amount NUMERIC(14, 2) NOT NULL,
        direction POSITION_DIRECTION NOT NULL,
        status POSITION_STATUS NOT NULL,
        opened_at TIMESTAMP NOT NULL,
        closed_at TIMESTAMP,
        gross_pnl_amount NUMERIC(14, 2) NOT NULL,
        net_pnl_amount NUMERIC(14, 2) NOT NULL,
        r_factor REAL NOT NULL,
        net_return_percentage REAL NOT NULL,
        charges_as_percentage_of_net_pnl REAL NOT NULL,
        open_quantity NUMERIC(14, 2) NOT NULL,
        open_average_price_amount NUMERIC(14, 2) NOT NULL,

        FOREIGN KEY (user_id) REFERENCES user_profile(user_id)
);

CREATE TYPE TRADE_KIND AS ENUM('buy', 'sell');

CREATE TABLE IF NOT EXISTS trade (
        id UUID PRIMARY KEY,
        position_id UUID NOT NULL,
        created_at TIMESTAMP NOT NULL,
        updated_at TIMESTAMP,
        kind TRADE_KIND NOT NULL,
        time TIMESTAMP NOT NULL,
        quantity NUMERIC(18, 6) NOT NULL,
        price NUMERIC(14, 2) NOT NULL,

        FOREIGN KEY (position_id) REFERENCES position(id)
);

-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DROP TYPE POSITION_INSTRUMENT CASCADE;
DROP TYPE POSITION_DIRECTION CASCADE;
DROP TYPE POSITION_STATUS CASCADE;
DROP TYPE TRADE_KIND CASCADE;

DROP TABLE user_identity CASCADE;
DROP TABLE user_profile CASCADE;
DROP TABLE position CASCADE;
DROP TABLE trade;
-- +goose StatementEnd
