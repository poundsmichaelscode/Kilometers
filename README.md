# Kilometers

Smart mobility and journey planning platform.

Structure-only monorepo for the **web frontend**, **Django backend**, and **mobile app**.

## Workspace
- `apps/web` — Next.js / TypeScript (planned)
- `apps/backend` — Django / Django REST Framework (planned)
- `apps/mobile` — React Native / Expo (planned)
- `packages/shared-types` — shared API contracts and types (planned)
- `packages/ui` — shared design guidance (planned)
- `infra/docker` — local development infrastructure
- `infra/deployment` — hosting and release notes
- `docs` — project, API, and architecture documentation
- `.github/workflows` — future CI pipelines

**This commit creates folders and placeholder files only.** No app is installed, runnable, or deployed yet.

## Collaborating
1. Clone the repository.
2. Create a branch such as `feat/web-setup`, `feat/backend-setup`, or `feat/mobile-setup`.
3. Initialize your own app within its assigned folder.
4. Open a pull request for review before merging.

Keep secrets in local `.env` files, never in Git.
