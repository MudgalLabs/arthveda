package tag

import (
	"arthveda/internal/service"
	"context"
	"fmt"
	"time"

	"sort"
	"strings"

	"github.com/google/uuid"
)

type Service struct {
	repo ReadWriter
}

func NewService(repo ReadWriter) *Service {
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

func (s *Service) UpdateTagGroup(ctx context.Context, userID uuid.UUID, payload UpdateTagGroupPayload) (*UpdateTagGroupResult, service.Error, error) {
	now := time.Now().UTC()

	tagGroup, err := s.repo.GetTagGroupByID(ctx, payload.TagGroupID)
	if err != nil {
		return nil, service.ErrInternalServerError, fmt.Errorf("repo read tag group failed: %w", err)
	}

	if tagGroup.UserID != userID {
		return nil, service.ErrUnauthorized, fmt.Errorf("user does not own this tag group")
	}

	tagGroup.Name = payload.Name
	tagGroup.Description = &payload.Description
	tagGroup.UpdatedAt = &now
	if err := s.repo.UpdateTagGroup(ctx, tagGroup); err != nil {
		return nil, service.ErrInternalServerError, fmt.Errorf("repo update tag group failed: %w", err)
	}

	return &UpdateTagGroupResult{TagGroup: tagGroup}, service.ErrNone, nil
}

func (s *Service) DeleteTagGroup(ctx context.Context, userID uuid.UUID, tagGroupID uuid.UUID) (service.Error, error) {
	tagGroup, err := s.repo.GetTagGroupByID(ctx, tagGroupID)
	if err != nil {
		return service.ErrInternalServerError, fmt.Errorf("repo read tag group failed: %w", err)
	}
	if tagGroup.UserID != userID {
		return service.ErrUnauthorized, fmt.Errorf("user does not own this tag group")
	}
	if err := s.repo.DeleteTagGroup(ctx, tagGroupID); err != nil {
		return service.ErrInternalServerError, fmt.Errorf("repo delete tag group failed: %w", err)
	}
	return service.ErrNone, nil
}

type CreateTagPayload struct {
	GroupID     uuid.UUID `json:"group_id"`
	Name        string    `json:"name"`
	Description *string   `json:"description"`
}

type CreateTagResult struct {
	Tag *Tag `json:"tag"`
}

func (s *Service) CreateTag(ctx context.Context, payload CreateTagPayload) (*CreateTagResult, service.Error, error) {
	tag, err := NewTag(payload.GroupID, payload.Name, payload.Description)
	if err != nil {
		return nil, service.ErrInternalServerError, fmt.Errorf("failed to build tag: %w", err)
	}

	if err := s.repo.CreateTag(ctx, tag); err != nil {
		return nil, service.ErrInternalServerError, fmt.Errorf("repo create tag failed: %w", err)
	}

	return &CreateTagResult{Tag: tag}, service.ErrNone, nil
}

type UpdateTagPayload struct {
	TagID       uuid.UUID `json:"tag_id"`
	Name        string    `json:"name"`
	Description string    `json:"description"`
}

type UpdateTagResult struct {
	Tag *Tag `json:"tag"`
}

func (s *Service) UpdateTag(ctx context.Context, payload UpdateTagPayload) (*UpdateTagResult, service.Error, error) {
	now := time.Now().UTC()
	tag, err := s.repo.GetTagByID(ctx, payload.TagID)
	if err != nil {
		return nil, service.ErrInternalServerError, fmt.Errorf("repo read tag failed: %w", err)
	}
	tag.Name = payload.Name
	tag.Description = &payload.Description
	tag.UpdatedAt = &now
	if err := s.repo.UpdateTag(ctx, tag); err != nil {
		return nil, service.ErrInternalServerError, fmt.Errorf("repo update tag failed: %w", err)
	}
	return &UpdateTagResult{Tag: tag}, service.ErrNone, nil
}

type DeleteTagPayload struct {
	TagID uuid.UUID `json:"tag_id"`
}

func (s *Service) DeleteTag(ctx context.Context, payload DeleteTagPayload) (service.Error, error) {
	if err := s.repo.DeleteTag(ctx, payload.TagID); err != nil {
		return service.ErrInternalServerError, fmt.Errorf("repo delete tag failed: %w", err)
	}
	return service.ErrNone, nil
}

type AttachTagToPositionPayload struct {
	PositionID uuid.UUID   `json:"position_id"`
	TagIDs     []uuid.UUID `json:"tag_ids"`
}

func (s *Service) AttachTagToPosition(ctx context.Context, payload AttachTagToPositionPayload) (service.Error, error) {
	now := time.Now().UTC()

	if err := s.repo.RemoveAllTagsFromPosition(ctx, payload.PositionID); err != nil {
		return service.ErrInternalServerError, fmt.Errorf("repo remove all tags from position failed: %w", err)
	}

	if len(payload.TagIDs) > 0 {
		if err := s.repo.AttachTagsToPosition(ctx, payload.PositionID, payload.TagIDs, now); err != nil {
			return service.ErrInternalServerError, fmt.Errorf("repo attach tags to position failed: %w", err)
		}
	}

	return service.ErrNone, nil
}

type ListTagGroupsResult struct {
	TagGroups []*TagGroupWithTags `json:"tag_groups"`
}

func (s *Service) ListTagGroups(ctx context.Context, userID uuid.UUID) (*ListTagGroupsResult, service.Error, error) {
	groups, err := s.repo.ListTagGroupsWithTags(ctx, userID)
	if err != nil {
		return nil, service.ErrInternalServerError, fmt.Errorf("repo list tag groups with tags failed: %w", err)
	}

	// Sort tags within each group by name (case-insensitive, ascending)
	for _, g := range groups {
		sort.SliceStable(g.Tags, func(i, j int) bool {
			return strings.ToLower(g.Tags[i].Name) < strings.ToLower(g.Tags[j].Name)
		})
	}

	// Sort groups by name (case-insensitive, ascending)
	sort.SliceStable(groups, func(i, j int) bool {
		return strings.ToLower(groups[i].Name) < strings.ToLower(groups[j].Name)
	})

	return &ListTagGroupsResult{TagGroups: groups}, service.ErrNone, nil
}
