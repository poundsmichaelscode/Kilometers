# KILOMETER MVP implementation gap audit — 27 November 2026

**Source of truth:** Backend technical spec (18 Nov), seven-day MVP brief (17 Nov), frontend technical specification, security checklist (19 Nov), QA testing strategy; inspected GitHub branches `feat/backend-journeys-integration` and `feat/web-complete-mvp`.

**Status:** Incomplete MVP. Do not describe estimated sample routes/fares, static incidents, or assistant demo responses as live or verified.

## Verified in backend source

- Django REST Framework / Django 5 Docker service, PostgreSQL, Render deployment, JWT register/login/refresh/logout, current user `GET /api/v1/me`, health, API docs/schema.
- Public `POST /api/v1/journeys/compare`, direct/one-transfer itinerary engine, fare-range handling, labels, throttling.
- Django account DB/migrations and token blacklist exist.
- Current comparison source is `apps/journeys/demo_data.py`: ALL transit stops/routes/fares are explicitly unverified placeholders.
- Production database uses ordinary PostgreSQL (not PostGIS) while geographic models are absent.
- Only `apps.accounts` and `apps.journeys` are installed in `config/settings.py`; no transit/places/traffic/assistant backend routes are registered in `config/urls.py`.

## Required vs observed (NOT equivalent to QA sign-off)

| Deliverable | Status | Evidence / next step |
|---|---|---|
| Registration/login/JWT refresh/logout/me | Implemented; integrated QA outstanding | accounts routes/views, Next.js auth API routes |
| Authenticated profile UI | Fix pushed to web branch; deployment & browser verification outstanding | `apps/web/src/app/profile/page.tsx` now checks `/api/auth/session` |
| Documented OpenAPI | Implemented for existing endpoints | `/api/schema/`, `/api/docs/`; missing services not documented |
| Transit Stop/Route/RouteStop/Fare models | MISSING | Need DB constraints, schema, migrations; add status, source note, verification attribution |
| Verified Lekki–Ikeja bus/BRT data | MISSING | Source and verification collected by designated transport-data team, never invent |
| Transit read API, staff-write API, admin verification | MISSING | `/transit/stops`, `/transit/routes`, staff-only verification workflow |
| Journey comparison logic | Partial | Python engine implemented; draws from static demo, not approved DB; car option unavailable |
| Map provider, live tiles, GPS and places search | MISSING or demo-only | Provider decision/token restrictions; `GET /places/search` missing; frontend fallback map |
| Driving/walking directions | MISSING | `GET /directions` missing; no provider geometry/steps |
| Assistant with tool-based backend | MISSING | `POST /assistant/message` missing; frontend currently static demo, voice preview only |
| Incidents list/create/votes | MISSING | `/traffic/incidents` and `/{id}/votes` missing; frontend shows samples and previews without submission |
| Incident moderation | MISSING | Need staff moderation / expiry / duplicate or vote constraints |
| Security assessment | Not signed off | Login/register throttles; missing incident/assistant rules; HSTS/logging/CORS/secrets/dependency checks pending |
| QA testing | Not signed off | Existing backend/frontend automated tests are narrower than supplied QA strategy; real-device end-to-end checks not recorded |
| Admin PHP integration | Not verified | PHP admin architecture and API plan required from Adebowa or team decision to use Django Admin |
| Backend consolidated technical handover | Partial | Spec is draft and mismatches actual API: compare is public; hosted DB has no PostGIS; missing routes cannot be claimed |

## Critical acceptance criteria before demo sign-off

1. A registered user can log in, maintain session on refresh and Profile, log out, and receive a rejected protected request afterward.
2. The journey comparison result is labelled **demo/estimated** until routes and fares have evidenced verification.
3. Selected map location, search and directions return real provider results (or explicit unavailable errors, not fabricated geometry).
4. Assistant uses same backend journey/search/directions functions; suggested navigation requires explicit user confirmation.
5. Incident creation stores a user-selected location, applies per-user throttles, and supports reading/moderation and one vote per account.
6. Transit edits require staff permission; verification source and timestamp are tracked.
7. Required negative security tests, abuse throttles, privacy checks and dependency scan produce recorded results.
8. QA engineer executes all MVP scenarios, captures defects, and records formal approval/remaining risks.

## Priority / ownership / blockers

**P0 backend (Daniel + Michael):** add transit model/migrations/admin/read APIs; replace demo route source with approved stored records; obtain approved fare/time data. Implement places and directions provider proxy; incident APIs; assistant orchestration. Publish OpenAPI per endpoint with response schemas and error contracts.

**P0 frontend (Gideon / collaborating engineer):** deploy and verify profile fix; connect map/search/directions; replace incident preview with real submission only after location consent; replace static assistant cards with backend responses; use loaded data only.

**P0 infrastructure/security (Michael + Tobi):** full staging smoke test, domain/HTTPS/CORS/cookie verification, throttles, dependency audit, privacy/access policy, API secrets handling, HSTS assessment. Render free PostgreSQL expires 27 Dec 2026; no managed backups.

**P0 coordination (Esther / Adebowa / Lydia):** select map provider and verified transport-data owner; agree PHP admin vs Django Admin; execute QA plan and record evidence.

## Deployment branch and verification

Frontend: `feat/web-complete-mvp` (Vercel web project, production deployments previously performed via `npx vercel --prod`). Backend: `feat/backend-journeys-integration` (Render service follows branch). GitHub Actions push triggers have been added to both deployment branches. Passing CI, Render/Vercel deployment, and browser QA are separate checks; a commit alone is not proof of live deployment.

No production credentials or user location data should be committed or pasted into tickets.
