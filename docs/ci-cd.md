# CI/CD — web-only MVP

**Current status:** workflows created; frontend and backend are still scaffolds, so real test execution remains pending app initialization.

- Frontend checks: install, lint, test, build.
- Backend checks: Django check, migration drift, pytest with PostgreSQL/PostGIS.
- Deployment: manual GitHub Actions workflow, protected `production` environment and secret deploy hook; no automatic production publishing.
- Separate workflows are triggered by relevant file changes; manual run is also supported.
- Require pull request reviews and green checks before merging once implementation starts.

## Security and operations
Do not commit secrets. Configure environment-level reviewers. Use dedicated deployment hooks with minimal privilege. Rotate hooks after exposure. Review app test settings, migrations and cache requirements when the framework is initialized.

## Limitations
A workflow that skips an uninitialized app is **not a successful test of that app**. The workflow's summary explicitly communicates the absence of tests.
