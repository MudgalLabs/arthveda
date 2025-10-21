// Package tag defines the core data structures for tag management.
package tag

import (
	"time"

	"github.com/google/uuid"
)

type TagGroup struct {
	ID          uuid.UUID  `json:"id"`
	UserID      uuid.UUID  `json:"user_id"`
	Name        string     `json:"name"`
	Description *string    `json:"description"`
	CreatedAt   time.Time  `json:"created_at"`
	UpdatedAt   *time.Time `json:"updated_at"`
}

type Tag struct {
	ID          uuid.UUID  `json:"id"`
	GroupID     uuid.UUID  `json:"group_id"`
	Name        string     `json:"name"`
	Description *string    `json:"description"`
	CreatedAt   time.Time  `json:"created_at"`
	UpdatedAt   *time.Time `json:"updated_at"`
}

type PositionTag struct {
	PositionID uuid.UUID `json:"position_id"`
	TagID      uuid.UUID `json:"tag_id"`
	CreatedAt  time.Time `json:"created_at"`
}

type TagGroupWithTags struct {
	TagGroup
	Tags []*Tag `json:"tags"`
}

type TagWithPositionID struct {
	Tag
	PositionID uuid.UUID `json:"position_id"`
}

func NewTagGroup(userID uuid.UUID, name string, description *string) (*TagGroup, error) {
	id, err := uuid.NewV7()
	if err != nil {
		return nil, err
	}
	now := time.Now().UTC()
	return &TagGroup{
		ID:          id,
		UserID:      userID,
		Name:        name,
		Description: description,
		CreatedAt:   now,
		UpdatedAt:   nil,
	}, nil
}

func NewTag(groupID uuid.UUID, name string, description *string) (*Tag, error) {
	id, err := uuid.NewV7()
	if err != nil {
		return nil, err
	}
	now := time.Now().UTC()
	return &Tag{
		ID:          id,
		GroupID:     groupID,
		Name:        name,
		Description: description,
		CreatedAt:   now,
		UpdatedAt:   nil,
	}, nil
}
