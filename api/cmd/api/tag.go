package main

import (
	"arthveda/internal/feature/tag"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
)

func listTagGroupsHandler(s *tag.Service) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		ctx := r.Context()
		userID := getUserIDFromContext(ctx)

		result, errKind, err := s.ListTagGroups(ctx, userID)
		if err != nil {
			serviceErrResponse(w, r, errKind, err)
			return
		}

		successResponse(w, r, http.StatusOK, "", result)
	}
}

func createTagGroupHandler(s *tag.Service) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		ctx := r.Context()
		userID := getUserIDFromContext(ctx)

		var payload tag.CreateTagGroupPayload
		if err := decodeJSONRequest(&payload, r); err != nil {
			malformedJSONResponse(w, r, err)
			return
		}

		result, errKind, err := s.CreateTagGroup(ctx, userID, payload)
		if err != nil {
			serviceErrResponse(w, r, errKind, err)
			return
		}

		successResponse(w, r, http.StatusOK, "", result)
	}
}

func createTagHandler(s *tag.Service) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		ctx := r.Context()

		var payload tag.CreateTagPayload
		if err := decodeJSONRequest(&payload, r); err != nil {
			malformedJSONResponse(w, r, err)
			return
		}

		result, errKind, err := s.CreateTag(ctx, payload)
		if err != nil {
			serviceErrResponse(w, r, errKind, err)
			return
		}

		successResponse(w, r, http.StatusOK, "", result)
	}
}

func updateTagHandler(s *tag.Service) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		ctx := r.Context()

		var payload tag.UpdateTagPayload
		if err := decodeJSONRequest(&payload, r); err != nil {
			malformedJSONResponse(w, r, err)
			return
		}

		idStr := chi.URLParam(r, "id")
		tagID, err := uuid.Parse(idStr)
		if err != nil {
			malformedJSONResponse(w, r, err)
			return
		}

		payload.TagID = tagID

		result, errKind, err := s.UpdateTag(ctx, payload)
		if err != nil {
			serviceErrResponse(w, r, errKind, err)
			return
		}

		successResponse(w, r, http.StatusOK, "", result)
	}
}

func updateTagGroupHandler(s *tag.Service) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		ctx := r.Context()
		userID := getUserIDFromContext(ctx)

		var payload tag.UpdateTagGroupPayload
		if err := decodeJSONRequest(&payload, r); err != nil {
			malformedJSONResponse(w, r, err)
			return
		}

		idStr := chi.URLParam(r, "id")
		tagGroupID, err := uuid.Parse(idStr)
		if err != nil {
			malformedJSONResponse(w, r, err)
			return
		}

		payload.TagGroupID = tagGroupID

		result, errKind, err := s.UpdateTagGroup(ctx, userID, payload)
		if err != nil {
			serviceErrResponse(w, r, errKind, err)
			return
		}

		successResponse(w, r, http.StatusOK, "", result)
	}
}

func deleteTagGroupHandler(s *tag.Service) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		ctx := r.Context()
		userID := getUserIDFromContext(ctx)

		idStr := chi.URLParam(r, "id")
		tagGroupID, err := uuid.Parse(idStr)
		if err != nil {
			malformedJSONResponse(w, r, err)
			return
		}

		errKind, err := s.DeleteTagGroup(ctx, userID, tagGroupID)
		if err != nil {
			serviceErrResponse(w, r, errKind, err)
			return
		}

		successResponse(w, r, http.StatusOK, "Tag group deleted successfully", nil)
	}
}

func deleteTagHandler(s *tag.Service) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		ctx := r.Context()

		idStr := chi.URLParam(r, "id")
		tagID, err := uuid.Parse(idStr)
		if err != nil {
			malformedJSONResponse(w, r, err)
			return
		}

		payload := tag.DeleteTagPayload{TagID: tagID}
		errKind, err := s.DeleteTag(ctx, payload)
		if err != nil {
			serviceErrResponse(w, r, errKind, err)
			return
		}

		successResponse(w, r, http.StatusOK, "Tag deleted successfully", nil)
	}
}
