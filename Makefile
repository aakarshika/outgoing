.PHONY: dev backend-dev frontend-dev reset-db shell test lint backend-test frontend-test backend-lint frontend-lint help

# --- Development ---

dev: ## Run both backend and frontend development servers
	@echo "Killing existing processes on ports 8998 and 5995..."
	@./kill_ports.sh
	@echo "Starting backend and frontend..."
	@(make backend-dev & make frontend-dev & wait)

backend-dev: ## Run Django development server
	@echo "Starting Django server..."
	@cd backend && python manage.py runserver 8998

frontend-dev: ## Run Vite development server
	@echo "Starting Vite server..."
	@cd frontend && npm run dev

reset-db: ## Reset database (ephemeral - no migrations)
	@cd backend && python reset_database.py

shell: ## Open Django shell
	@cd backend && python manage.py shell

# --- Testing ---

test: backend-test frontend-test ## Run all tests

backend-test: ## Run backend tests
	@cd backend && python manage.py test

frontend-test: ## Run frontend tests
	@cd frontend && npm test

# --- Linting & Quality ---

lint: backend-lint frontend-lint ## Run all linters

backend-lint: ## Run backend linters (black, isort, flake8, pylint)
	@cd backend && black . && isort . && flake8 . && pylint api apps core config

frontend-lint: ## Run frontend linters (eslint)
	@cd frontend && npm run lint

check: lint test ## Run all quality checks (lint + test)

# --- Help ---

help: ## Show this help message
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

.DEFAULT_GOAL := help
