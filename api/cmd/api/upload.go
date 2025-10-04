package main

import (
	"arthveda/internal/feature/upload"
	"arthveda/internal/logger"
	"errors"
	"fmt"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
)

func getPutPresignHandler(s *upload.Service) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		ctx := r.Context()
		userID := getUserIDFromContext(ctx)
		enforcer := getPlanEnforcerFromCtx(ctx)

		var payload upload.PutPresignPayload
		if err := decodeJSONRequest(&payload, r); err != nil {
			malformedJSONResponse(w, r, err)
			return
		}

		result, errKind, err := s.GetPutPresign(ctx, userID, enforcer, payload)
		if err != nil {
			serviceErrResponse(w, r, errKind, err)
			return
		}

		successResponse(w, r, http.StatusOK, "", result)
	}
}

func getGetPresignHandler(s *upload.Service) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		ctx := r.Context()
		l := logger.FromCtx(ctx)
		userID := getUserIDFromContext(ctx)
		uploadIDStr := chi.URLParam(r, "id")

		uploadID, err := uuid.Parse(uploadIDStr)
		if err != nil {
			l.Warnw("Invalid upload ID", "id", uploadID, "error", err.Error())
			badRequestResponse(w, r, errors.New("Invalid upload ID"))
			return
		}

		presignedGetURL, errKind, err := s.GetGetPresign(ctx, userID, uploadID)
		if err != nil {
			serviceErrResponse(w, r, errKind, err)
			return
		}

		http.Redirect(w, r, presignedGetURL.String(), http.StatusFound)
	}
}

func cleanupUploadsHandler(s *upload.Service) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		ctx := r.Context()

		count, errKind, err := s.CleanupUploads(ctx)
		if err != nil {
			serviceErrResponse(w, r, errKind, err)
			return
		}

		successResponse(w, r, http.StatusOK, fmt.Sprintf("Cleanup completed successfully. Deleted %d stale uploads.", count), nil)
	}
}
