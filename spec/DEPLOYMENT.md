# Deployment & Infrastructure [DRAFT]

## Environments

| Environment | Purpose | Status |
| :--- | :--- | :--- |
| **Local Dev** | Development and testing | [ACTIVE] |
| **Staging** | Pre-production verification | [PLANNED] |
| **Production** | Live users | [PLANNED] |

## Local Development

| Service | URL | Port |
| :--- | :--- | :--- |
| Frontend (Vite) | http://localhost:5995 | 5995 |
| Backend (Django) | http://localhost:8998 | 8998 |
| Django Admin | http://localhost:8998/admin/ | 8998 |
| Swagger Docs | http://localhost:8998/api/docs/ | 8998 |
| Django Silk | http://localhost:8998/silk/ | 8998 |

- Vite proxies `/api` requests to the backend
- SQLite database, ephemeral (reset via `reset_database.py`)
- Default admin credentials: `root` / `root`

## Production Infrastructure

<!-- TBD: Final decisions on all of these -->

| Component | Technology | Notes |
| :--- | :--- | :--- |
| Hosting | <!-- TBD: AWS? Vercel? Railway? --> | |
| Database | Postgres | Required for production (SQLite is dev only) |
| File Storage | Django media (dev), S3 (prod) | Avatars, cover photos, event images, portfolio images |
| CDN | <!-- TBD --> | |
| Email / SMTP | <!-- TBD: SendGrid? SES? --> | Needed for: email verification, password reset, notifications |
| Payments | Stripe (planned) | Needed for: ticket purchases, vendor payments |
| Domain | <!-- TBD --> | |
| SSL | <!-- TBD --> | |

## File Storage Requirements

The platform has several features that require file/image storage:

| Feature | Files | Sizing Notes |
| :--- | :--- | :--- |
| User avatar | 1 per user | Small, thumbnail-friendly |
| User cover photo | 1 per user | Banner-sized |
| Event cover image | 1 per event | Card + detail page sizes |
| Vendor portfolio images | N per service | Gallery display |

**Development**: Django `ImageField` with local `media/` directory. Files stored at `backend/media/` (git-ignored). Django dev server serves files at `/media/`. Vite proxies `/media` to Django alongside `/api`. Upload limit: 5 MB, formats: JPEG/PNG/WebP.

**Production**: Django Storages + S3-compatible object storage. The `ImageField` abstraction means the switch requires only a settings change (`DEFAULT_FILE_STORAGE`), no code changes.

## Payment Integration

Payments are modeled in the data layer but not processed yet:

| Payment Flow | Model | Status |
| :--- | :--- | :--- |
| Ticket purchase | `Ticket.price_paid` | Data modeled, no real payment |
| Vendor deals | `NeedApplication.price_quote` | Data modeled, no real payment |

**When we add real payments**:
- Stripe integration for ticket purchases
- Escrow or direct payment for vendor deals (TBD)
- Refund handling for cancelled events
- Payout to hosts/vendors (TBD)

## CI/CD

### Current

- Pre-push hooks enforce code quality (Pylint, ESLint, Black, isort)

### Planned

<!-- TBD: GitHub Actions? -->

- [ ] Automated testing on PR
- [ ] Lint + format checks in CI
- [ ] Automated deployment pipeline
- [ ] Database migrations strategy for production

## Environment Variables

| Variable | Used In | Description |
| :--- | :--- | :--- |
| `SECRET_KEY` | Backend | Django secret key |
| `DEBUG` | Backend | Debug mode toggle |
| `OPENAI_API_KEY` | Backend | AI features (core/ai.py) |
| `DATABASE_URL` | Backend | Production Postgres connection string (planned) |
| `STRIPE_SECRET_KEY` | Backend | Payment processing (planned) |
| `STRIPE_PUBLISHABLE_KEY` | Frontend | Stripe client-side key (planned) |
| `SMTP_HOST` | Backend | Email sending (planned) |
| `SMTP_USER` | Backend | Email credentials (planned) |
| `SMTP_PASSWORD` | Backend | Email credentials (planned) |
| `MEDIA_ROOT` | Backend | Absolute path to uploaded file storage (dev: `backend/media/`) |
| `AWS_STORAGE_BUCKET_NAME` | Backend | S3 bucket for uploaded files (production) |
| `AWS_S3_REGION_NAME` | Backend | S3 region (production) |

## Monitoring & Observability

<!-- TBD -->

- [ ] Error tracking (Sentry?)
- [ ] Application monitoring
- [ ] Uptime checks
- [ ] Log aggregation

## Backup Strategy

<!-- TBD — relevant once we're on Postgres in production -->

---

### Changelog

| Date | Change |
| :--- | :--- |
| 2026-02-28 | Initial draft with local dev setup documented |
| 2026-02-28 | Added file storage requirements, payment integration notes, expanded env vars |
| 2026-02-28 | Resolved file storage: Django ImageField + local media/ for dev, S3 for prod. Updated env vars. |
