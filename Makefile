.PHONY: help install dev build start migrate migrate-dev db-push db-studio test lint clean docker-up docker-down docker-logs

help: ## Show this help message
	@echo "Available commands:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}'

install: ## Install dependencies
	npm install

dev: ## Run development server
	npm run dev

build: ## Build TypeScript
	npm run build

start: ## Start production server
	npm start

migrate: ## Run migrations (production)
	npm run migrate

migrate-dev: ## Run migrations (development)
	npm run migrate:dev

db-push: ## Push schema changes without migration
	npm run db:push

db-studio: ## Open Prisma Studio
	npm run db:studio

generate: ## Generate Prisma client
	npm run generate

test: ## Run tests
	npm test

lint: ## Run linter
	npm run lint

lint-fix: ## Fix linting issues
	npm run lint:fix

clean: ## Clean build artifacts
	rm -rf dist node_modules/.cache

docker-up: ## Start Docker containers
	docker-compose up -d

docker-down: ## Stop Docker containers
	docker-compose down

docker-logs: ## Show Docker logs
	docker-compose logs -f

docker-build: ## Build Docker image
	docker-compose build

docker-restart: ## Restart Docker containers
	docker-compose restart
