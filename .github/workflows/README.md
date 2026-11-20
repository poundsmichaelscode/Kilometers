# GitHub Actions — Kilometers Web MVP

## Workflows
- **Frontend CI**: when `apps/web/package.json` exists, enforce committed `package-lock.json` and `lint`, `test`, `build` npm scripts; run `npm ci`, lint, tests, build.
- **Backend CI**: when `apps/backend/manage.py` exists, run Django system checks, migration drift check and pytest against a PostGIS service.
- **Deploy Web MVP**: **manual only**, requires the `production` environment approval (if configured) and corresponding repository secret `WEB_DEPLOY_HOOK` or `BACKEND_DEPLOY_HOOK`.

## Current scaffold status
Neither app is initialized yet. The CI workflows **explicitly report that no application tests ran** until the corresponding app is created. A green scaffold run does not prove application quality.

## Integration checklist
1. Frontend: initialize Next.js app in `apps/web`, commit its lockfile, define repeatable non-watch `lint`, `test`, `build` scripts; adapt the test invocation if using Jest instead of Vitest.
2. Backend: initialize Django under `apps/backend`; add dependencies and pytest configuration; configure `DATABASE_URL` as a PostGIS database; include meaningful tests.
3. Configure GitHub branch protection / required checks **after apps exist and workflows first run**, and require code reviews.
4. Configure `production` environment reviewers, hosting targets and the relevant deploy-hook secrets before running a manual deployment.
5. Verify deployment on the provider (hook acknowledgment is not proof that release finished).

No deploy hooks or production credentials are committed to the repository.
