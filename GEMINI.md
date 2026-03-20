# GEMINI.md

## 🏗 Project Overview: Outgoing

**Outgoing** is a decision and coordination engine for events, built as a full-stack web application. It functions as an event marketplace where users can find events, host them, manage vendors, and handle ticket sales.

### 🛠 Tech Stack (Feb 2026 Latest Stable)

| Component | Technology | Version | Management |
| :--- | :--- | :--- | :--- |
| **Language** | Python | `3.11.x` | `brew install python@3.11` |
| **Framework** | Django | `5.2.11` (LTS) | `pyproject.toml` |
| **Runtime** | Node.js | `v24` (LTS) | `.nvmrc` / `nvm` |
| **Frontend** | React | `18.3.1` | `package.json` |
| **Build Tool** | Vite | `7.3.1` | `package.json` |
| **Styling** | TailwindCSS | `latest` | `tailwind.config.cjs` |
| **UI Library** | shadcn/ui + Radix | `latest` | `src/components/ui/` |

---

## 🚀 Getting Started

### ⚡ Quick Start (First Time Setup)

1.  **Environment Setup**:
    *   Backend: `cd backend && python3.11 -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt`
    *   Frontend: `cd frontend && nvm install 24 && nvm use 24 && npm install`

2.  **Run Development Environment**:
    *   **Unified**: `make dev` (runs both frontend and backend)
    *   **Backend only**: `make backend-dev` (Port 8998)
    *   **Frontend only**: `make frontend-dev` (Port 5995)

3.  **Database Reset & Seeding**:
    *   Reset DB: `make reset-db` (Note: Uses an ephemeral approach without migrations).
    *   Seed Data: `cd backend && python manage.py seed_all` or `python manage.py seed_event_120`.

---

## 🏗 Architecture & Conventions

### 📂 Directory Structure

```bash
/outgoing
├── backend/               # Django + DRF
│   ├── api/v1/            # Transport layer (Serializers, Views, URLs)
│   ├── apps/              # Domain logic (Models, Business Rules)
│   │   ├── profiles/      # UserProfile and showcase fields
│   │   ├── events/        # Event lifecycle and models
│   │   ├── needs/         # Event needs and vendor applications
│   │   └── ...            # vendors, tickets, requests, content_generator
│   ├── core/              # Shared utilities (Responses, AI wrapper, etc.)
│   └── config/            # Django settings (base, dev, prod)
├── frontend/              # React + Vite
│   ├── src/
│   │   ├── api/           # Axios client & interceptors
│   │   ├── components/    # Shared UI (shadcn/ui in src/components/ui)
│   │   ├── features/      # Domain-specific modules (Auth, Events, Feed, etc.)
│   │   ├── pages/         # Route-level components
│   │   └── ...            # types, utils, hooks, theme
└── spec/                  # System specifications and documentation
```

### 📏 Development Standards

*   **API Contract**: All responses MUST follow the unified envelope: `{ "success": boolean, "message": string, "data": any, "meta": any }`.
*   **Quality Gates**: Enforced 10.00/10 Pylint score in backend. Linting (`eslint`) and formatting (`prettier`) in frontend.
*   **Domain Driven**: Logic is encapsulated within `apps/` (backend) and `features/` (frontend).
*   **Database**: Development uses an ephemeral SQLite database. Do not create migration files; use the reset script.
*   **Authentication**: SimpleJWT handles access/refresh tokens. Mandatory auth is enabled for most endpoints.
*   **Port Sync**: Backend runs on `8998`. Frontend Vite proxy is configured to route `/api` and `/media` to this port.

---

## 🛠 Useful Commands

| Command | Description |
| :--- | :--- |
| `make dev` | Start both backend and frontend servers. |
| `make reset-db` | Reset the ephemeral database. |
| `make lint` | Run all linters (Black, Isort, Flake8, Pylint, ESLint). |
| `make test` | Run backend and frontend test suites. |
| `make shell` | Open the Django management shell. |
| `python manage.py seed_all` | Populates the database with realistic sample data. |

---

## 📖 Key Documentation (in `spec/`)

*   **ARCHITECTURE.md**: Comprehensive system design and data flow.
*   **API-SPEC.md**: (If exists) Detailed endpoint definitions.
*   **DATA-MODELS.md**: Schema definitions and relationships.
*   **FEATURES.md**: Roadmap and feature inventory.
