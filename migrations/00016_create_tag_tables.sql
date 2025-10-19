-- +goose Up
-- +goose StatementBegin
CREATE TABLE tag_group (
    id              UUID PRIMARY KEY,
    user_id         UUID NOT NULL REFERENCES user_profile(user_id),
    name            VARCHAR(256) NOT NULL,
    description     TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ,
    UNIQUE (user_id, name)
);

CREATE TABLE tag (
    id              UUID PRIMARY KEY,
    group_id        UUID NOT NULL REFERENCES tag_group(id) ON DELETE CASCADE,
    name            VARCHAR(256) NOT NULL,
    description     TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ,
    UNIQUE (group_id, name)
);

CREATE TABLE position_tag (
    position_id     UUID NOT NULL REFERENCES position(id) ON DELETE CASCADE,
    tag_id          UUID NOT NULL REFERENCES tag(id) ON DELETE CASCADE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (position_id, tag_id)
);
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DROP TABLE IF EXISTS position_tag;
DROP TABLE IF EXISTS tag;
DROP TABLE IF EXISTS tag_group;
-- +goose StatementEnd
