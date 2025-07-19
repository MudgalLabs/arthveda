ARG TARGETOS=linux
ARG TARGETARCH=amd64

# Build stage
FROM golang:1.24-alpine3.22 AS builder

# Install git and ca-certificates (needed for fetching dependencies)
RUN apk add --no-cache git ca-certificates tzdata
WORKDIR /app

# Copy go mod files first for better caching
COPY ./api/go.mod ./api/go.sum ./

# Download dependencies (cached if go.mod/go.sum haven't changed)
RUN go mod download

# Copy source code
COPY ./api .

# Build the binary with optimizations and embed timezone data
RUN CGO_ENABLED=0 GOOS=${TARGETOS} GOARCH=${TARGETARCH} go build \
    -ldflags='-w -s -extldflags "-static"' \
    -o bin/arthveda ./cmd/api

FROM alpine:3.22

WORKDIR /app
ENV TZ=UTC
# Copy timezone data
COPY --from=builder /usr/share/zoneinfo /usr/share/zoneinfo
# Copy the binary from builder stage
COPY --from=builder /app/bin/arthveda .
# Open port
EXPOSE 1337

# Start API
CMD ["./arthveda"]
