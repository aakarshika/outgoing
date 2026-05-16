---
title: Frontend — Working in React/TS
status: living
last-updated: 2026-05-16
---

# Frontend — Working in React/TS

How this React/TypeScript app is organized and how to add a page or feature consistently.

## TL;DR

- React 18 + Vite 7 + TS + React Query 5 + axios + react-router 6. Tailwind/shadcn-style primitives **and** MUI/Emotion coexist — prefer Tailwind/shadcn for new UI.
- Per-domain data lives in `src/features/<domain>/` (`api.ts` raw calls + `hooks.ts` React Query). Route pages in `src/pages/`. Shared UI in `src/components/` (`ui/` = hand-maintained shadcn primitives).
- Routes are declared centrally in `src/routes/routes.config.ts`; `RoleGuard` gates by auth/role.
- The axios `client` does **not** unwrap the envelope — `api.ts` functions return the full `{ success, data, … }` and consumers read `.data`.
- Use the canonical `ApiResponse<T>` from `src/types/api.ts` (not the looser one in `src/api/types.ts`). No tests exist; lint is permissive.

## Layout

```
src/
  api/client.ts       axios instance, request(JWT)/response(401-refresh) interceptors
  api/types.ts        LEGACY loose ApiResponse — avoid; use src/types/api.ts
  features/<domain>/   api.ts (raw axios calls), hooks.ts (React Query), components
                       domains: alerts auth chat events needs profiles requests tickets vendors
  pages/               lazy-loaded route targets (suffix *Page)
  routes/              routes.config.ts, AppRoutes.tsx, RoleGuard.tsx
  components/           shared UI; components/ui = shadcn-style primitives
  types/               canonical TS types mirroring backend serializers (api.ts is canonical)
  theme/               ThemeProvider/BackgroundProvider/ThemeWrapper
  constants/ utils/ lib/
```

## API client (verbatim behavior)

`src/api/client.ts`: `axios.create({ baseURL: '/api' })`. (`VITE_API_BASE_URL` is documented in `.env.example` but **not read** — baseURL is hardcoded.)

- **Request interceptor**: reads `localStorage.token`, sets `Authorization: Bearer <token>`.
- **Response interceptor**: on `401` (once, `_retry` guard) calls `POST /api/auth/token/refresh/` with `localStorage.refresh_token` via **bare `axios`** (no interceptors); on success stores new `token` and replays; on failure clears tokens and `window.location.href = '/signin'`.
- **No envelope unwrapping.** Each `features/<domain>/api.ts` call returns the whole envelope:

```ts
export async function fetchEvent(eventId: number) {
  const { data } = await client.get<ApiResponse<EventDetail>>(`/events/${eventId}/`);
  return data;            // full envelope; the hook/consumer reads .data
}
```

Tokens live in `localStorage` (`token`, `refresh_token`). Note: `LoginSimple.tsx` also writes `last_username`/`last_password` in plaintext — a known wart, don't extend it.

## Data fetching

One `QueryClient` in `App.tsx`. Per-resource hooks in `features/<domain>/hooks.ts` wrap `features/<domain>/api.ts`. Array query keys, domain-prefixed:

```ts
export function useEvent(eventId: number) {
  return useQuery({ queryKey: ['event', eventId], queryFn: () => fetchEvent(eventId) });
}

export function useToggleInterest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ eventId, isInterested }) => toggleInterest(eventId, isInterested),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['feed'] });
      qc.invalidateQueries({ queryKey: ['event'] });
    },
  });
}
```

Key conventions: `['event', id]`, `['feed', params]`, `['categories']`, `['myEvents']`. Invalidation targets prefixes broadly. Some feed hooks disable refetch (`retry:false`, `refetchOnMount/WindowFocus:false`) and set `staleTime`; some mutations do optimistic `setQueryData`.

## Routing

`src/routes/routes.config.ts` exports `routesConfig: RouteDefinition[]`:

```ts
interface RouteDefinition {
  path: string;
  componentName: string;   // key into the lazy registry in AppRoutes.tsx
  roles?: UserRole[];      // present ⇒ protected
  theme?: string;
  isPublic?: boolean;
  isGuestOnly?: boolean;   // hidden when authenticated
  children?: RouteDefinition[];
}
```

`AppRoutes.tsx` lazy-maps `componentName` → component, wraps in `RoleGuard` + `ThemeWrapper` + `Suspense`, filters by auth state. `RoleGuard` (uses `useAuth()`): loading → spinner; `isGuestOnly` & authed → `/`; `isPublic` → render; unauthenticated → `/signin?redirectTo=…`; role mismatch → `/unauthorized`. `UserRole` ∈ `ADMIN | USER | GUEST`.

**Many routes are commented out** in `routes.config.ts` / the registry (`/alerts`, `/dashboard`, `/calendar`, `/events/create`, `/vendors`, `/requests`, `/profile`, …). Some have working backends. Re-enabling a page = uncomment its config entry + registry entry; verify the backend endpoint in [api.md](api.md).

## Auth

`features/auth/AuthContext.tsx` (exported via `features/auth/hooks.ts` as `AuthProvider`/`useAuth`), mounted in `App.tsx`. Shape: `{ user, loading, login(access, refresh, userData), logout, isAuthenticated }`. On mount, if `localStorage.token` exists it calls `GET /auth/me/` to hydrate `user`. `logout()` clears tokens locally (no backend logout). Protected-route component is `RoleGuard`.

## Components & styling

- `pages/` = route targets (lazy, `*Page`). `features/<domain>/` = domain logic + domain components. `components/` = cross-cutting; `components/ui/` = shadcn-style primitives.
- shadcn primitives are **hand-maintained** (no `components.json`, no CLI): `cva` variants + `cn()` from `@/lib/utils` + Radix `Slot`. Lowercase filenames for primitives, PascalCase for custom (`ComicButton.tsx`) — naming is inconsistent; match the neighbor file.
- Tailwind via `className` + `cn()`; design tokens are HSL CSS vars in `index.css` mapped in `tailwind.config.cjs`; `darkMode: ['class']`; per-route `theme` field + runtime `ThemeWrapper`.
- **MUI/Emotion** is used in parallel (auth pages are pure MUI). Prefer Tailwind/shadcn for new work; don't introduce more MUI without reason.

## How to add a page/feature

1. Backend endpoint exists? Confirm in [api.md](api.md).
2. Add raw call(s) to `src/features/<domain>/api.ts` typed with `ApiResponse<T>` from `src/types/api.ts`; return the envelope.
3. Add a React Query hook in `src/features/<domain>/hooks.ts` with a domain-prefixed array key; set up invalidation for mutations.
4. Add the page component under `src/pages/<area>/` (lazy-loaded, `*Page`).
5. Register it: add a `RouteDefinition` in `routes.config.ts` and a registry entry in `AppRoutes.tsx`; set `roles`/`isPublic`/`isGuestOnly` appropriately.
6. Add/extend TS types in `src/types/` to mirror the backend serializer.

## Anti-patterns (don't)

- Don't add an axios interceptor that unwraps the envelope — the codebase reads `.data` at call sites; changing that breaks everything.
- Don't import `ApiResponse` from `src/api/types.ts` — use `src/types/api.ts`.
- Don't store more secrets in `localStorage` (the existing `last_password` is a wart, not a pattern).
- Don't add new MUI where Tailwind/shadcn fits.
- Don't rely on `react-hooks/exhaustive-deps` to catch you — it's disabled (see lint below). Get deps right manually.
- Don't route-govern chat — it opens as a single global drawer, URL unchanged ([product.md](product.md)).

## Tooling

```
npm run dev       # vite, :5995, HTTPS via basic-ssl (VITE_NO_SSL to disable)
npm run build     # tsc && vite build
npm run lint      # eslint --max-warnings 0
npm run format    # prettier
```

ESLint (flat config) **disables most correctness rules**: `@typescript-eslint/no-explicit-any: off`, `no-unused-vars: off`, all `react-hooks/*` off, `react-refresh/only-export-components: off`. Effectively only Prettier formatting + `simple-import-sort` are enforced. Prettier: 2-space, semicolons, single quotes, `printWidth 88`, trailing commas. **No tests, no test runner** configured. Be conservative — the tooling will not catch much for you.
