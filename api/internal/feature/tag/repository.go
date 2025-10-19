package tag

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Reader interface {
	ListTagGroupsWithTags(ctx context.Context, userID uuid.UUID) ([]*TagGroupWithTags, error)
	GetTagGroupByID(ctx context.Context, tagGroupID uuid.UUID) (*TagGroup, error)
	GetTagByID(ctx context.Context, tagID uuid.UUID) (*Tag, error)
}

type Writer interface {
	CreateTagGroup(ctx context.Context, tg *TagGroup) error
	UpdateTagGroup(ctx context.Context, tg *TagGroup) error
	CreateTag(ctx context.Context, tag *Tag) error
	DeleteTag(ctx context.Context, tagID uuid.UUID) error
	AttachTagToPosition(ctx context.Context, positionID, tagID uuid.UUID, createdAt time.Time) error
	UpdateTag(ctx context.Context, tag *Tag) error
}

type ReadWriter interface {
	Reader
	Writer
}

type repository struct {
	db *pgxpool.Pool
}

func NewRepository(db *pgxpool.Pool) ReadWriter {
	return &repository{db: db}
}

func (r *repository) CreateTagGroup(ctx context.Context, tg *TagGroup) error {
	_, err := r.db.Exec(ctx, `
		INSERT INTO tag_group (id, user_id, name, description, created_at)
		VALUES ($1, $2, $3, $4, $5)
	`, tg.ID, tg.UserID, tg.Name, tg.Description, tg.CreatedAt)
	return err
}

func (r *repository) UpdateTagGroup(ctx context.Context, tg *TagGroup) error {
	_, err := r.db.Exec(ctx, `
		UPDATE tag_group
		SET name = $1, description = $2, updated_at = $3
		WHERE id = $4
	`, tg.Name, tg.Description, tg.UpdatedAt, tg.ID)
	return err
}

func (r *repository) GetTagGroupByID(ctx context.Context, tagGroupID uuid.UUID) (*TagGroup, error) {
	row := r.db.QueryRow(ctx, `
		SELECT id, user_id, name, description, created_at, updated_at
		FROM tag_group
		WHERE id = $1
	`, tagGroupID)
	var tg TagGroup
	err := row.Scan(&tg.ID, &tg.UserID, &tg.Name, &tg.Description, &tg.CreatedAt, &tg.UpdatedAt)
	if err != nil {
		return nil, fmt.Errorf("tag group not found: %w", err)
	}
	return &tg, nil
}

func (r *repository) CreateTag(ctx context.Context, tag *Tag) error {
	_, err := r.db.Exec(ctx, `
		INSERT INTO tag (id, group_id, name, description, created_at)
		VALUES ($1, $2, $3, $4, $5)
	`, tag.ID, tag.GroupID, tag.Name, tag.Description, tag.CreatedAt)
	return err
}

func (r *repository) DeleteTag(ctx context.Context, tagID uuid.UUID) error {
	_, err := r.db.Exec(ctx, `
		DELETE FROM tag WHERE id = $1
	`, tagID)
	return err
}

func (r *repository) AttachTagToPosition(ctx context.Context, positionID, tagID uuid.UUID, createdAt time.Time) error {
	_, err := r.db.Exec(ctx, `
		INSERT INTO position_tag (position_id, tag_id, created_at)
		VALUES ($1, $2, $3)
		ON CONFLICT DO NOTHING
	`, positionID, tagID, createdAt)
	return err
}

func (r *repository) ListTagGroupsWithTags(ctx context.Context, userID uuid.UUID) ([]*TagGroupWithTags, error) {
	rows, err := r.db.Query(ctx, `
		SELECT tg.id, tg.user_id, tg.name, tg.description, tg.created_at, tg.updated_at,
		       t.id, t.group_id, t.name, t.description, t.created_at, t.updated_at
		FROM tag_group tg
		LEFT JOIN tag t ON t.group_id = tg.id
		WHERE tg.user_id = $1
		ORDER BY LOWER(tg.name), t.created_at
	`, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to query tag groups with tags: %w", err)
	}

	defer rows.Close()

	groupMap := make(map[uuid.UUID]*TagGroupWithTags)

	for rows.Next() {
		var tg TagGroup
		var tagID *uuid.UUID
		var tagGroupID *uuid.UUID
		var tagName *string
		var tagDesc *string
		var tagCreatedAt *time.Time
		var tagUpdatedAt *time.Time

		err := rows.Scan(
			&tg.ID, &tg.UserID, &tg.Name, &tg.Description, &tg.CreatedAt, &tg.UpdatedAt,
			&tagID, &tagGroupID, &tagName, &tagDesc, &tagCreatedAt, &tagUpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan tag group with tag: %w", err)
		}

		group, ok := groupMap[tg.ID]
		if !ok {
			group = &TagGroupWithTags{
				TagGroup: tg,
				Tags:     []*Tag{},
			}
			groupMap[tg.ID] = group
		}

		if tagID != nil {
			tag := &Tag{
				ID:          *tagID,
				GroupID:     *tagGroupID,
				Name:        "",
				Description: tagDesc,
				CreatedAt:   time.Time{},
				UpdatedAt:   tagUpdatedAt,
			}
			if tagName != nil {
				tag.Name = *tagName
			}
			if tagCreatedAt != nil {
				tag.CreatedAt = *tagCreatedAt
			}
			group.Tags = append(group.Tags, tag)
		}
	}

	result := []*TagGroupWithTags{}
	for _, g := range groupMap {
		result = append(result, g)
	}

	return result, nil
}

func (r *repository) UpdateTag(ctx context.Context, tag *Tag) error {
	_, err := r.db.Exec(ctx, `
		UPDATE tag
		SET name = $1, description = $2, updated_at = $3
		WHERE id = $4
	`, tag.Name, tag.Description, tag.UpdatedAt, tag.ID)
	return err
}

func (r *repository) GetTagByID(ctx context.Context, tagID uuid.UUID) (*Tag, error) {
	row := r.db.QueryRow(ctx, `
		SELECT id, group_id, name, description, created_at, updated_at
		FROM tag
		WHERE id = $1
	`, tagID)
	var t Tag
	err := row.Scan(&t.ID, &t.GroupID, &t.Name, &t.Description, &t.CreatedAt, &t.UpdatedAt)
	if err != nil {
		return nil, fmt.Errorf("tag not found: %w", err)
	}
	return &t, nil
}
