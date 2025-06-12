.PHONY: up dev down logs db build build-client build-server

up:
	docker compose up -d database

down:
	docker compose down

logs:
	docker compose logs -f

db:
	docker compose exec database psql -U postgres -d postgres

dev:
	$(MAKE) up
	tmux new-session -d -s dev \
		"cd client && npm run dev" \; \
		split-window -v -t 0 "cd server && air -c air.toml" \; \
		select-pane -t 0 \; \
		split-window -h -t 0 "bash" \; \
		select-pane -t 2 \; \
		send-keys "clear" C-m

	tmux attach -t dev

build:
	@echo ""
	@echo "🔨 Building server..."
	@if $(MAKE) build-server; then \
		echo "✅ Server build succeeded"; \
	else \
		echo "❌ Server build failed"; exit 1; \
	fi
	@echo ""
	@echo "🔨 Building client..."
	@if $(MAKE) build-client; then \
		echo "✅ Client build succeeded"; \
	else \
		echo "❌ Client build failed"; exit 1; \
	fi
	@echo ""

build-client:
	@cd client && npm run build

build-server:
	@cd server && go build -o ./bin/arthveda ./cmd/api
