-- +goose Up
-- +goose StatementBegin

ALTER TABLE user_profile
ADD COLUMN onboarded BOOLEAN NOT NULL DEFAULT true;


-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin

ALTER TABLE user_profile DROP COLUMN onboarded;

-- +goose StatementEnd
