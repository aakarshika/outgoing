# Authentication & Authorization [DRAFT]

## Overview

Outgoing uses JWT-based authentication via Django SimpleJWT. All API endpoints require authentication by default unless explicitly marked as public.

## Actor Model

Outgoing has a richer actor model than a typical RBAC system. For full definitions, see [DOMAIN.md](./DOMAIN.md).

### Product Actors (Behavioral, Not Rigid)

Users aren't locked into a single role. Roles are behaviors, and any user can take on multiple:

| Behavior | Trigger | What it unlocks |
| :--- | :--- | :--- |
| **Goer** | Default — all users | Browse events, buy tickets, post requests, upvote |
| **Organiser** | Create an event | Full event management, vendor coordination, needs posting, application review |
| **Host** | Named as host on an event | Identified as the brand/client behind the event. May have approval authority on high-level decisions. |
| **Vendor** | Set `is_vendor: true` on profile | List services, apply to event needs |

In the simplest case, the organiser and host are the same person. The system should not force complexity on simple events — when a user creates an event, they are both organiser and host by default. The host can be designated as a separate user for more complex arrangements.

### Vendor Classification (Not a Permission — Metadata)

Vendor classification (primary/standby, customer-facing/operational, essential/replaceable/non-substitutable) is **event-level metadata**, not a user permission. The same vendor user can be "primary + customer-facing" on one event and "standby + operational" on another. These classifications are set per vendor-event assignment, not on the user profile.

### Admin / Operations Role

Platform admins use Django's built-in `is_staff` / `is_superuser` flags. This grants:
- Access to Django Admin panel
- Access to operations dashboards (platform-wide event health, at-risk events)
- Override capabilities (force-cancel, force-refund, vendor reassignment)
- Audit trail access

This is separate from product roles and is not a behavior users opt into.

## Token Lifecycle

```
Sign Up / Sign In
       │
       ▼
┌──────────────┐
│ Access Token  │  Short-lived (5 minutes default)
│ Refresh Token │  Long-lived (7 days default)
└──────┬───────┘
       │
       ▼  (on 401)
┌──────────────┐
│ Auto-Refresh  │  Axios interceptor sends refresh token
│ via /token/   │  to get new access token
│ refresh/      │
└──────────────┘
```

## Token Storage

- Tokens are stored in localStorage (current implementation)
- Access token is attached as `Authorization: Bearer <token>` header
- <!-- TBD: Consider httpOnly cookies for production -->

## Authentication Flows

### Registration
1. User submits sign-up form (username, email, name, phone, password)
2. Backend creates `User` + `UserProfile` in a single transaction
3. Backend returns JWT access + refresh tokens
4. Frontend stores tokens and redirects to home feed

### Login
1. User submits username + password
2. Backend validates credentials, returns JWT tokens
3. Frontend stores tokens and redirects

### Token Refresh
1. Axios interceptor detects 401 response
2. Interceptor sends refresh token to `/api/auth/token/refresh/`
3. New access token is stored and original request is retried
4. If refresh also fails → user is logged out, tokens cleared

### Logout
<!-- TBD: Implement token blacklisting or just clear client-side? -->

## Route Protection

The `RoleGuard` component wraps protected routes:
- Checks if user is authenticated (has valid token)
- Redirects to `/signin` if not authenticated
- No per-role route gating for product roles (roles are behavioral)
- Admin/operations routes check `is_staff` flag

## Permission Model

Permissions are enforced at the API layer. They fall into three categories:

### Object-Level Permissions (Per-Event)

| Action | Permission Check |
| :--- | :--- |
| Edit/cancel event | Authenticated + is the organiser of that event |
| Create event need | Authenticated + is the organiser of that event |
| Review/accept/reject applications | Authenticated + is the organiser of that event |
| View full vendor assignments | Authenticated + is the organiser of that event |
| Change event state (postpone, cancel) | Authenticated + is the organiser of that event (or admin) |
| View attendee list | Authenticated + is the organiser of that event |

### Feature-Gated Permissions (Vendor)

| Action | Permission Check |
| :--- | :--- |
| Create vendor service | Authenticated + `is_vendor: true` on profile |
| Apply to event need | Authenticated + `is_vendor: true` on profile |
| View "My Applications" | Authenticated + `is_vendor: true` on profile |

### Universal Permissions (Any Authenticated User)

| Action | Permission Check |
| :--- | :--- |
| Create event | Authenticated (anyone can organise) |
| Buy ticket | Authenticated |
| Post event request | Authenticated |
| Upvote request | Authenticated |
| Edit own profile | Authenticated |

### Admin Permissions

| Action | Permission Check |
| :--- | :--- |
| Access Django Admin | `is_staff: true` |
| Access operations dashboard | `is_staff: true` |
| Force-cancel / force-refund | `is_superuser: true` |
| Override vendor assignment | `is_superuser: true` |
| View audit trails | `is_staff: true` |

### Vendor Opt-In Flow

```
Profile Settings → "I offer services" toggle
  → Sets is_vendor: true on UserProfile (PATCH /api/profiles/me/)
  → Unlocks: "My Services" tab in dashboard, "Add Service" button
  → Unlocks: "Apply" buttons on event needs
```

### Organiser-Host Relationship

When organiser and host are the same person (default), a single user has full control. When they're different:
- The **organiser** has operational control (vendor management, logistics, status changes)
- The **host** has approval authority on high-level decisions (cancel event, approve material substitutions)
- <!-- TBD: How is the organiser-host relationship formalized? A field on the Event model? An invitation flow? -->

## Security Considerations

- No email verification currently (users active immediately)
- No SMTP configured
- Sign-up form has pre-filled defaults (dev convenience, remove for prod)
- Organiser permissions are per-event (can't manage other users' events)
- Vendor permissions require explicit opt-in
- Admin/ops actions should be logged in the audit trail
- <!-- TBD: Rate limiting on auth endpoints -->
- <!-- TBD: Rate limiting on ticket purchase (prevent bot buying) -->
- <!-- TBD: Password strength requirements -->

## Production Readiness Checklist

- [ ] Enable email verification
- [ ] Configure SMTP provider
- [ ] Remove pre-filled sign-up defaults
- [ ] Implement password reset flow
- [ ] Add rate limiting on auth endpoints
- [ ] Add rate limiting on ticket purchase
- [ ] Review token lifetimes
- [ ] Consider httpOnly cookie storage for tokens
- [ ] Add CSRF protection if using cookies
- [ ] Implement token blacklisting on logout
- [ ] Add account lockout after failed login attempts
- [ ] Implement audit logging for admin/ops actions
- [ ] Define organiser-host permission boundary

---

### Changelog

| Date | Change |
| :--- | :--- |
| 2026-02-28 | Initial draft from codebase analysis |
| 2026-02-28 | Defined behavioral roles, vendor opt-in, per-action permission checks |
| 2026-02-28 | Expanded actor model (Organiser/Host split, vendor classification as metadata, admin/ops). Permission model reorganized into object-level, feature-gated, universal, and admin categories. |
