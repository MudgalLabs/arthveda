package tag

import (
	"arthveda/internal/service"
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
)

type Service struct {
	repo Repository
}

func NewService(repo Repository) *Service {
	return &Service{repo: repo}
}

type CreateTagGroupPayload struct {
	Name        string  `json:"name"`
	Description *string `json:"description"`
}

type CreateTagGroupResult struct {
	TagGroup *TagGroup `json:"tag_group"`
}

func (s *Service) CreateTagGroup(ctx context.Context, userID uuid.UUID, payload CreateTagGroupPayload) (*CreateTagGroupResult, service.Error, error) {
	tagGroup, err := NewTagGroup(userID, payload.Name, payload.Description)
	if err != nil {
		return nil, service.ErrInternalServerError, fmt.Errorf("failed to build tag group: %w", err)
	}

	if err := s.repo.CreateTagGroup(ctx, tagGroup); err != nil {
		return nil, service.ErrInternalServerError, fmt.Errorf("repo create tag group failed: %w", err)
	}

	return &CreateTagGroupResult{TagGroup: tagGroup}, service.ErrNone, nil
}

type UpdateTagGroupPayload struct {
	TagGroupID  uuid.UUID `json:"tag_group_id"`
	Name        string    `json:"name"`
	Description string    `json:"description"`
}

type UpdateTagGroupResult struct {
	TagGroup *TagGroup `json:"tag_group"`
}

func (s *Service) UpdateTagGroup(ctx context.Context, payload UpdateTagGroupPayload) (*UpdateTagGroupResult, service.Error, error) {
	now := time.Now().UTC()
	if err := s.repo.UpdateTagGroup(ctx, payload.TagGroupID, payload.Name, payload.Description, now); err != nil {
		return nil, service.ErrInternalServerError, fmt.Errorf("repo update tag group failed: %w", err)
	}
	tagGroup, err := s.repo.GetTagGroupByID(ctx, payload.TagGroupID)
	if err != nil {
		return nil, service.ErrInternalServerError, fmt.Errorf("repo get tag group failed: %w", err)
	}
	return &UpdateTagGroupResult{TagGroup: tagGroup}, service.ErrNone, nil
}

type AddTagPayload struct {
	GroupID     uuid.UUID `json:"group_id"`
	Name        string    `json:"name"`
	Description *string   `json:"description"`
}

type AddTagResult struct {
	Tag *Tag `json:"tag"`
}

func (s *Service) AddTag(ctx context.Context, payload AddTagPayload) (*AddTagResult, service.Error, error) {
	tag, err := NewTag(payload.GroupID, payload.Name, payload.Description)
	if err != nil {
		return nil, service.ErrInternalServerError, fmt.Errorf("failed to build tag: %w", err)
	}

	if err := s.repo.CreateTag(ctx, tag); err != nil {
		return nil, service.ErrInternalServerError, fmt.Errorf("repo create tag failed: %w", err)
	}

	return &AddTagResult{Tag: tag}, service.ErrNone, nil
}

type RemoveTagPayload struct {
	TagID uuid.UUID `json:"tag_id"`
}

type RemoveTagResult struct{}

func (s *Service) RemoveTag(ctx context.Context, payload RemoveTagPayload) (*RemoveTagResult, service.Error, error) {
	if err := s.repo.DeleteTag(ctx, payload.TagID); err != nil {
		return nil, service.ErrInternalServerError, fmt.Errorf("repo delete tag failed: %w", err)
	}
	return &RemoveTagResult{}, service.ErrNone, nil
}

type AttachTagToPositionPayload struct {
	PositionID uuid.UUID `json:"position_id"`
	TagID      uuid.UUID `json:"tag_id"`
}

type AttachTagToPositionResult struct{}

func (s *Service) AttachTagToPosition(ctx context.Context, payload AttachTagToPositionPayload) (*AttachTagToPositionResult, service.Error, error) {
	now := time.Now().UTC()
	if err := s.repo.AttachTagToPosition(ctx, payload.PositionID, payload.TagID, now); err != nil {
		return nil, service.ErrInternalServerError, fmt.Errorf("repo attach tag to position failed: %w", err)
	}
	return &AttachTagToPositionResult{}, service.ErrNone, nil
}

type ListTagGroupsResult struct {
	TagGroups []*TagGroupWithTags `json:"tag_groups"`
}

func (s *Service) ListTagGroups(ctx context.Context, userID uuid.UUID) (*ListTagGroupsResult, service.Error, error) {
	groups, err := s.repo.ListTagGroupsWithTags(ctx, userID)
	if err != nil {
		return nil, service.ErrInternalServerError, fmt.Errorf("repo list tag groups with tags failed: %w", err)
	}

	return &ListTagGroupsResult{TagGroups: groups}, service.ErrNone, nil
}
