.PHONY: dev backend-dev frontend-dev reset-db shell test lint backend-test frontend-test backend-lint frontend-lint help nossl dev-noauth

# --- Development ---

# Check if nossl or --nossl is present in MAKECMDGOALS or environment
# We use a variable that can be passed down to sub-makes
ifeq ($(filter nossl --nossl,$(MAKECMDGOALS)),)
  # Not in goals, check environment
  ifneq ($(VITE_NO_SSL),true)
    VITE_NO_SSL = false
  endif
else
  VITE_NO_SSL = true
endif

VITE_ENV = $(if $(filter true,$(VITE_NO_SSL)),VITE_NO_SSL=true,)

dev: ## Run both backend and frontend development servers
	@echo "Killing existing processes on ports 8998 and 5995..."
	@./kill_ports.sh
	@echo "Starting backend and frontend (SSL: $(if $(filter true,$(VITE_NO_SSL)),OFF,ON))..."
	@($(VITE_ENV) $(MAKE) backend-dev & $(VITE_ENV) $(MAKE) frontend-dev & wait)

backend-dev: ## Run Django development server
	@echo "Starting Django server..."
	@cd backend && .venv/bin/python manage.py runserver 8998

frontend-dev: ## Run Vite development server
	@echo "Starting Vite server..."
	@cd frontend && $(VITE_ENV) npm run dev

nossl: ## Option to disable SSL (usage: make dev nossl)
	@:

# Captures email from command line or environment
EMAIL_VAL = $(if $(email),$(email),$(DEV_USER_EMAIL))

dev-noauth: ## Run dev mode without auth (usage: make dev-noauth email=EMAIL [nossl])
	@if [ -z "$(EMAIL_VAL)" ]; then echo "Error: email is required. Usage: make dev-noauth email=user@example.com"; exit 1; fi
	@echo "Starting dev mode without auth for Email: $(EMAIL_VAL)"
	@DEV_USER_EMAIL=$(EMAIL_VAL) VITE_NO_SSL=$(VITE_NO_SSL) $(MAKE) dev

reset-db: ## Reset database (ephemeral - no migrations)
	@cd backend && .venv/bin/python reset_database.py

shell: ## Open Django shell
	@cd backend && .venv/bin/python manage.py shell

seed-event-120: ## Seed event 120 with detailed data
	@cd backend && .venv/bin/python manage.py seed_event_120

# --- Testing ---

test: backend-test frontend-test ## Run all tests

backend-test: ## Run backend tests
	@cd backend && .venv/bin/python manage.py test

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

# To handle additional targets (like nossl)
%:
	@:
