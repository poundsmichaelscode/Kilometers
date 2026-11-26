# Transit API contract

Public, read-only endpoints for stops, routes and fares. No sign-in needed. Any Authorization header is ignored, so an expired token never causes a 401. Reads are limited to 60 per minute per client address; going over returns 429 with a `Retry-After` header. Writes are not available over the API; data is managed through Django Admin and the import commands.

Interactive docs: `/api/docs/`. Schema: `/api/schema/`.

## Provenance on every record

Every stop, route and fare carries:

| Field | Meaning |
|---|---|
| `status` | `estimated`, `community`, `operator`, `field_verified` or `official` (weakest to strongest) |
| `display_label` | `verified` for `operator`, `field_verified`, `official`; `estimated` for the other two. Show this to users |
| `source` | Where the data came from, in plain text |
| `last_verified_at` | When it was last checked, or `null` if never |

The status order is the same as the journey engine's, so statuses flow straight into journey `confidence`. Anything not confirmed stays `estimated`. Nothing is marked verified by default.

## Endpoints

### `GET /api/v1/transit/stops`

Active stops. Query parameters, all optional:

| Parameter | Meaning |
|---|---|
| `lat`, `lng` | Send both for a nearby search. Results are sorted by distance and include `distance_m` |
| `radius_m` | 50 to 5000, default 1000. Only used with `lat`/`lng` |
| `q` | Case-insensitive match on stop name or area |
| `limit` | 1 to 100, default 50 |

Without `lat`/`lng`, `distance_m` is `null` and stops are sorted by name. Invalid input (out-of-range coordinates, only one of lat/lng, radius over 5000) returns 400 with field errors.

### `GET /api/v1/transit/routes`

Active routes. Optional `mode`: `bus`, `brt`, `rail` or `ferry`. An unknown mode returns 400.

### `GET /api/v1/transit/routes/{id}`

One route with its ordered `stops` (`position`, `minutes_from_prev`, stop) and its `fares`. `notes` explains gaps:

- `No fare on file for this route.` when there are no fares.
- `This route is not verified.` when the route is estimated.

Unknown or inactive ids return 404.

### `GET /api/v1/transit/fares`

Active fares. Optional `route` (route id) filters to one route; an unknown id returns 404.

A fare has `min_ngn` and `max_ngn` in naira. `from_stop_id` and `to_stop_id` are both `null` for a flat fare covering the whole route, or both set for a stop-to-stop fare. **A route with no fare on file has no fare rows. Clients must show "no fare on file", never zero.**

## Data management

- **Django Admin** (`/admin/`): stops, routes (with ordered stops and fares edited inline) and fares. Filter by status or mode.
- **`python manage.py seed_transit`**: loads a placeholder Lekki to Ikeja corridor carried over from `journeys/demo_data.py`. Everything is `estimated`. Safe to run repeatedly.
- **`python manage.py import_transit_csv <directory> [--dry-run]`**: imports `stops.csv`, `routes.csv`, `route_stops.csv` and `fares.csv` (all optional, header row required; the column lists are in the command's help text). Rows are matched by name, so re-running updates instead of duplicating. One bad row cancels the whole import and the error names the file and row. Blank `status` defaults to `estimated`.

## Using the data in journeys

`apps.transit.adapters.load_engine_routes()` returns the active routes as the journey engine's `Route`, `Stop` and `Fare` objects, so `journeys` can replace `demo_data.ROUTES` with it. Inactive routes, stops and fares are left out, and a route with fewer than two active stops is skipped. Switching `CompareView` over is a journeys change and needs agreement with the journeys owner.

## Current limitations

- The only data in the repo is the placeholder corridor. No surveyed or official stop list has been loaded yet.
- Coordinates are plain latitude and longitude columns, not a PostGIS geometry. Nearby search uses a bounding box and then exact distance, which is fine at pilot scale. Move to a PostGIS `PointField` with a GiST index when stop counts grow.
