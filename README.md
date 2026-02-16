

## 🏗 Outgoing

Platform to find and host events 


## 🏗 Project Layout

```bash
/outgoing
├── backend/               # Django + DRF
│   ├── .venv/             # Isolated Python Environment
│   ├── config/            # Settings (Base, Dev, Prod)
│   ├── core/              # Shared Utils (Responses, Exceptions)
│   └── api/               # API Layer (Transport only)
├── frontend/              # React + Vite
│   ├── src/
│   │   ├── api/           # Axios Client & Endpoints
│   │   ├── components/    # Common UI (shadcn/ui)
│   │   ├── features/      # Domain Features (Auth, etc.)
│   │   └── hooks/         # Global Hooks
└── .agent/rules/          # Engineering Rules
```

---

## 🛠 Tech Stack (Feb 2026 Latest Stable)

| Component | Technology | Version | Management |
| :--- | :--- | :--- | :--- |
| **Language** | Python | `3.11.x` | `brew install python@3.11` |
| **Framework** | Django | `5.2.11` (LTS) | `requirements.txt` |
| **Runtime** | Node.js | `v24` (LTS) | `nvm install 24` |
| **Frontend** | React | `18.3.1` | `package.json` |
| **Build Tool** | Vite | `7.3.1` | `package.json` |
| **Quality** | Pre-commit | `latest` | `backend/requirements.txt` |
| **Scoreboard** | Pylint | `10.00/10` | `.pylintrc` |

---

Now, simply `cd backend` will activate your virtual environment.

---

## ⚡ Quick Start (First Time Setup)

### 1. Backend Setup (Python 3.11)
```bash
# Install Python 3.11 if you haven't (on Mac)
brew install python@3.11

# Setup virtual environment
cd backend
python3.11 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python reset_database.py
```

### 2. Frontend Setup (Node v24)
```bash
# We recommend using nvm
cd frontend
nvm install 24
nvm use 24
npm install
```

### 3. Start Developing
```bash
# Terminal 1: Backend
cd backend && source .venv/bin/activate && python manage.py runserver

# Terminal 2: Frontend
cd frontend && npm run dev
```

---

## 🔐 Admin Access & Database
You can manage the database and users via the Django Admin portal.

- **URL**: [http://localhost:8998/admin/](http://localhost:8998/admin/)
- **Username**: `root`
- **Password**: `root`

---

## 🐍 Backend (Django)

The backend provides a strictly typed JSON API using Django REST Framework.

### Key Features
- **Strict API Contract**: All responses follow a unified `{ success, message, data, meta }` envelope.
- **Mandatory Auth**: Authentication is always enabled. SimpleJWT handles access/refresh.
- **Ephemeral Database**: No migrations - database is reset using `reset_database.py` script.
- **App Architecture**:
    - **`apps/`**: Domain Logic, Models (e.g., `profiles`).
    - **`api/`**: Transport Logic, Serializers, Views, URLs.
    - **`core/`**: Shared Utils (Responses, Exceptions).
    - **Rule**: Every new model MUST be registered in `admin.py` immediately.

### Configuration (`backend/config/settings/`)
- `base.py`: Shared settings.
- `development.py`: Active by default (`DEBUG=True`), CORS allow localhost:5173.
- `production.py`: For deployment.

**Environment Variables**:
- `SECRET_KEY`: Django secret key.
- `DEBUG`: Set to `True` for development.

### Running the Backend

1. **Active Environment**:
   Ensure Python 3.11 is active:
   ```bash
   cd backend
   # If not using direnv:
   source .venv/bin/activate
   ```

2. **Install Dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

2. **Initialize Database**:
   ```bash
   # Reset database (ephemeral - creates tables directly from models)
   python reset_database.py
   ```
   > **Note**: This project uses an ephemeral database approach. The `reset_database.py` script:
   > - Deletes all migration files (except `__init__.py`)
   > - Drops the existing database
   > - Creates all tables directly from Django models
   > - Creates a default superuser (`root` / `root`)

3. **Start Server**:
   ```bash
   python manage.py runserver 8998
   ```
   Runs on http://localhost:8998

> [!IMPORTANT]
> **Port Configuration**: If you change the Django port (e.g., `python manage.py runserver 8998`), you **must** also update the `proxy` target in [frontend/vite.config.ts](file:///Users/aakarshika/Dev/outgoing/frontend/vite.config.ts) to match. Otherwise, the frontend will not be able to communicate with the API.

---

### Code Quality (Push Hooks)
This project enforces a **10.00/10 quality gate** via `pre-push` hooks. Checks run automatically when you push code, but not during local commits.
- **Linter (Python)**: `pylint $(find . -name "*.py")`
- **Formatter**: `black .`
- **Imports**: `isort .`
- **Linter (JS/TS)**: `npm run lint`

---

## 🔍 Debugging & Profiling

This project includes powerful tools to help you identify performance bottlenecks and runtime issues.

### Backend (Django Silk)
- **What it does**: Intercepts and records all HTTP requests and database queries.
- **Access**: Visit [http://localhost:8998/silk/](http://localhost:8998/silk/) while the backend is running.
- **Usage**: Use this to find N+1 queries, slow database calls, and timing issues.

### Frontend (React Query Devtools & React Scan)
- **React Query Devtools**: Provides visibility into the server state, caching, and fetch status.
    - **Access**: A small floating icon appears in the bottom right of the app in development.
- **React Scan**: Highlights parts of the UI that are re-rendering.
    - **How to use**: Watch for flashing outlines on components. If a component flashes when it shouldn't, consider optimizing with `useMemo` or `React.memo`.

---

## ⚛️ Frontend (React)

The frontend is a modern SPA built with performance and developer experience in mind.

### Tech Stack
- **Framework**: Vite + React 18.3.1 (Latest)
- **Language**: TypeScript (Strict)
- **Styling**: TailwindCSS
- **Runtime**: Node.js v24 (Managed via `.nvmrc`)
- **UI Component Library**: shadcn/ui + Radix Primitives
- **State Management**: React Query (Server state), Context (Global Auth)
- **Routing**: React Router DOM

### Architecture
- **`src/lib/`**: Shared utilities (e.g., `utils.ts` for Shadcn's `cn` logic).
- **`src/features/`**: Domain logic. E.g., `features/auth` contains:
  - `AuthContext.tsx`: Global authentication state provider.
  - `api.ts`: API calls for that feature.
  - `pages/`: Route components (SignIn, SignUp, Profile).
- **`src/components/ui/`**: Reusable Shadcn/UI components built on Radix Primitives.

### Running the Frontend

1. **Active Environment**:
   Ensure Node v24 is active:
   ```bash
   cd frontend
   nvm use
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Start Dev Server**:
   ```bash
   npm run dev
   ```
   # Runs on http://localhost:5995
   *Note: Vite is configured to Proxy `/api` requests to `http://localhost:8998` automatically.*

3. **Production Build**:
   ```bash
   npm run build
   # Outputs to /dist folder
   ```

4. **Code Quality**:
   - **Auto-Fix (All)**: `npm run lint:fix && npm run format`
   - **Linter**: `npm run lint`
   - **Formatter**: `npm run format`

---

## ⚠️ Important: Production Readiness (Auth)
This project uses a **Simplified Authentication Flow** optimized for rapid development.
1. **No Email Verification**: Users are active immediately upon signup.
2. **Missing SMPT**: Email sending is not configured.
3. **Pre-filled Defaults**: The `SignUpPage` is pre-filled with credentials to reduce friction.

**Before going to Production:**
- Enable Email Confirmation strategies in `backend/v1/auth`.
- Remove default `useState` values in `frontend/src/features/auth/SignUpPage.tsx`.
- Configure an SMTP provider (SendGrid/Amazon SES).

---


## 🔒 Authentication Flow
The project comes with a pre-built Auth feature.

1. **Sign Up**:
   - Visit `/signup`.
   - Collects Username, Email, Name, and **Phone Number**.
   - Automatically creates `User` and linked `UserProfile`.
2. **Sign In**:
   - Visit `/signin`.
   - Receives JWT Access/Refresh tokens.
   - **Auto-Refresh**: Interceptor refreshes tokens transparently on 401s.
3. **Profile**:
   - Visit `/profile` (Protected Route).
   - Displays a friendly **Welcome Dashboard** with the user's name and an animated waving avatar (Hand icon).
   - Fetches user info from `/api/v1/auth/me/` via the global `AuthContext`.

---

- **Quality Gates**: Enforced via `pre-push` hooks (ESLint, Black, Pylint 10/10).
- **TypeScript**: Strict mode enabled with exhaustive type checking.
- **Rules**: Comprehensive AI-assisted rules in `.agent/rules/rules.md`.
- **Commits**: Conventional commits (feat, fix, style, docs) are preferred.
