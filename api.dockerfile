FROM golang:1.24.1-alpine3.21

WORKDIR /app

# Copy the backend directory contents to /app
COPY ./api .

# Install dependencies
RUN go get -d -v ./...

# Build
RUN go build -o ./bin/arthveda ./cmd/api

# Open port
EXPOSE 1337

# Start API
CMD ["./bin/arthveda"]
