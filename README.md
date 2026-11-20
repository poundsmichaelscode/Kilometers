# Kilometers

Smart urban mobility and journey-planning **web MVP**.

This is a structure-only monorepo for a **web frontend** and **Django REST backend**. A native mobile app is not included in the MVP.

## Layout
- `apps/web` — responsive web frontend (proposed Next.js + TypeScript)
- `apps/backend` — Django REST API (proposed Django + DRF, PostgreSQL/PostGIS)
- `packages/shared-types` — shared API contracts (placeholder)
- `packages/ui` — web UI conventions (placeholder)
- `infra/docker` — local development infrastructure (placeholder)
- `infra/deployment` — hosting and release notes (placeholder)
- `docs/backend-ownership.md` — four-backend-developer work allocation
- `docs/architecture`, `docs/api`, `docs/product` — team documentation
- `.github/workflows` — future CI placeholders

## Scope
Deliver the responsive web experience first: search, journey comparison, available transit information, traffic reports and a tool-grounded assistant as prioritized by the approved MVP specification.

## Team workflow
Create separate branches for frontend and backend tasks. Open pull requests for review; coordinate all shared model/migration and API contract changes. No application framework has been initialized yet.

Never commit API keys or environment secrets.
