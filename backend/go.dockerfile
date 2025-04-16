FROM golang:1.24.1-alpine3.21

WORKDIR /app

COPY . .

# Download and install the dependencies:
RUN go get -d -v ./...

# Build the go app
RUN go build -o bin/arthveda cmd/api/main.go

EXPOSE 1337

CMD ["./bin/arthveda"]
