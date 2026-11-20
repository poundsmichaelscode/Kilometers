# Backend work allocation — web MVP (proposed)

Four backend developers contribute to **one Django + DRF modular monolith**, not four independently deployed services. This document is a proposed split pending the team’s agreement.

| Owner | Modules / responsibility | MVP deliverables |
| --- | --- | --- |
| **Michael** — Dev 1, integration lead | `config/`, `accounts/`, core schema and migrations, infrastructure | Django project setup; environment configuration; PostgreSQL/PostGIS and Docker; user registration/login/JWT; permissions baseline; migrations ownership; CI, deployment and API integration review |
| **Daniel** — Dev 2, journeys and maps | `journeys/`, `places/` | Place search; map-provider directions proxy; journey comparison algorithm (walking, bus/BRT, driving); clear fastest/cheapest tags and provider failure behavior; journey engine tests |
| **Backend Developer 3** — transit data | `transit/` | Stop, Route, RouteStop and Fare data models coordinated with Michael; Django Admin and CSV seed/import workflow; stop/route/fare read endpoints; verification statuses; transit tests |
| **Backend Developer 4** — traffic and assistant | `traffic/`, `assistant/` | Incident reporting/listing/voting/moderation; assistant tool-calling over approved journey/map/incident functions; privacy-safe logging; request validation, throttling and endpoint tests |

## Ownership boundaries and dependencies
1. **Michael owns migration coordination**: Developer 3 proposes model changes and migration files in a PR; no parallel unreviewed migrations on the same Django app.
2. **Daniel defines journey service contracts early** and works with Developer 3 to agree on route/stops/fares shape before implementation.
3. **Developer 4 uses existing service functions**, never copies route logic or invents fares/traffic results.
4. **All four own tests for their changes**, review each other's PRs and validate OpenAPI response contracts with the web team.
5. **External roles remain separate**: web UI ownership and QA/security coordination are not counted as backend developer assignments unless the team explicitly agrees.

## Suggested branches
- `feat/backend-foundation-auth` — Michael
- `feat/journey-maps` — Daniel
- `feat/transit-data` — Backend Developer 3
- `feat/traffic-assistant` — Backend Developer 4

## MVP acceptance checklist
- Auth works, JWT-protected endpoints reject unauthenticated access
- Seeded Lekki–Ikeja stops/routes/fares are clearly labeled verified or estimated
- Journey comparison returns interpretable duration/fare/leg data, including missing-data states
- Directions/search work or show explicit upstream errors
- Incidents can be reported and retrieved with basic safeguards
- Assistant uses tools, reports uncertainty and never invents route/fare facts
- OpenAPI schema, tests and smoke checks pass before web integration

**Not in this MVP:** native mobile app, offline maps, booking/payments, saved places and journey history. The extra two developers’ names and final ownership require team confirmation.
