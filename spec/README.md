# Outgoing — Spec Kit

> Source of truth for the Outgoing platform — a decision and coordination engine for events, where organisers coordinate with hosts, vendors, and goers through a social marketplace.

## Documents

### Conceptual Layer (Business Domain)

| Document | Purpose |
| :--- | :--- |
| [DOMAIN.md](./DOMAIN.md) | Conceptual domain model — actors, vendor classification, event lifecycle, system responsibilities |
| [SCENARIOS.md](./SCENARIOS.md) | Business scenario inventory — vendor failure, cancellation, attendance, force majeure, decision paths |

### Product Layer (Features & Design)

| Document | Purpose |
| :--- | :--- |
| [OVERVIEW.md](./OVERVIEW.md) | Vision, product positioning, actor model, differentiation |
| [FEATURES.md](./FEATURES.md) | Feature inventory by role, statuses, user stories, business rule themes |
| [UI-UX.md](./UI-UX.md) | Page inventory, navigation, user flows, abstract UI module mapping |
| [AUTH.md](./AUTH.md) | Actor permissions, behavioral roles, vendor opt-in, token lifecycle |

### Technical Layer (Implementation)

| Document | Purpose |
| :--- | :--- |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | System design, tech stack, backend + frontend structure, responsibility areas |
| [DATA-MODELS.md](./DATA-MODELS.md) | Model definitions, field-level detail, relationships, Django app layout |
| [API-SPEC.md](./API-SPEC.md) | Full API surface with request/response contracts |
| [ROADMAP.md](./ROADMAP.md) | Phased delivery plan with backend + frontend tasks per phase |
| [DEPLOYMENT.md](./DEPLOYMENT.md) | Infrastructure, file storage, payments, CI/CD, environment variables |

## How to Read These Docs

Start with **DOMAIN.md** and **SCENARIOS.md** for the business logic and decision framework. These define *what* the system must handle. Then read the product and technical layers for *how* it will be built.

## Conventions

- **Status tags**: Each section uses `[DRAFT]`, `[REVIEW]`, or `[FINAL]` to indicate maturity.
- **TBD markers**: Open questions are marked with `<!-- TBD: ... -->` so they're easy to find.
- **Updates**: When the spec changes, update the relevant doc and note the date in its changelog at the bottom.
