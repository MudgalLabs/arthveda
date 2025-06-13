.PHONY: up dev down logs db build build_web build_api

up:
	docker compose up -d arthveda_db

down:
	docker compose down

logs:
	docker compose logs -f

db:
	docker compose exec arthveda_db psql -U postgres -d postgres

dev:
	$(MAKE) up
	tmux new-session -d -s arthveda \
		"cd web && npm run dev" \; \
		split-window -v -t 0 "cd api && air -c air.toml" \; \
		select-pane -t 0 \; \
		split-window -h -t 0 "bash" \; \
		select-pane -t 2 \; \
		send-keys "clear" C-m

	tmux attach -t arthveda

kill:
	@docker compose down && tmux kill-session -t arthveda;

compose:
	@docker compose build
	@docker compose up 


build:
	@echo ""
	@echo "🔨 Building api ..."
	@if $(MAKE) build-api; then \
		echo "✅ api build succeeded"; \
	else \
		echo "❌ api build failed"; exit 1; \
	fi
	@echo ""
	@echo "🔨 Building web ..."
	@if $(MAKE) build-web; then \
		echo "✅ web build succeeded"; \
	else \
		echo "❌ web build failed"; exit 1; \
	fi
	@echo ""

build_web:
	@cd web && npm run build

build_api:
	@cd api && go build -o ./bin/arthveda ./cmd/api
