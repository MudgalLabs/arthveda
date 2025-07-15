# Build stage
FROM golang:1.24-alpine3.22 AS builder

# Install git and ca-certificates (needed for fetching dependencies)
RUN apk add --no-cache git ca-certificates

WORKDIR /app

# Copy go mod files first for better caching
COPY ./api/go.mod ./api/go.sum ./

# Download dependencies (cached if go.mod/go.sum haven't changed)
RUN go mod download

# Copy source code
COPY ./api .

# Build the binary with optimizations
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build \
    -ldflags='-w -s -extldflags "-static"' \
    -a -installsuffix cgo \
    -o bin/arthveda ./cmd/api

# Runtime stage - use distroless for better security and smaller size
FROM gcr.io/distroless/static:nonroot

WORKDIR /app

# Copy the binary from builder stage
COPY --from=builder /app/bin/arthveda .

# Open port
EXPOSE 1337

# Start API
CMD ["./arthveda"]
