# Journey comparison API contract

`POST /api/v1/journeys/compare`  (public: no sign-in needed)

Any Authorization header is ignored, so an expired token never causes a 401 here. Requests are limited to 30 per minute per client address; going over returns 429 with a `Retry-After` header. Account endpoints stay protected.

Interactive docs: `/api/docs/`. Schema: `/api/schema/`.

## Request

```json
{
  "origin":      {"lat": 6.4478, "lng": 3.4723, "label": "Lekki Phase 1"},
  "destination": {"lat": 6.6018, "lng": 3.3515, "label": "Ikeja"}
}
```

- `lat` is a number from -90 to 90 and `lng` a number from -180 to 180. Both are required.
- `label` is optional text, up to 120 characters. It is not used for routing.
- Origin and destination closer than 100 m are rejected.
- Invalid input returns 400 with field errors, for example `{"origin": {"lat": ["Ensure this value is less than or equal to 90."]}}`.

## Response (200)

```json
{
  "options": [ /* Option, sorted by total_minutes */ ],
  "notes": ["Demo data: stops, travel times and fares are placeholders and not verified."]
}
```

`options` is an empty list, with a note, when nothing is found. That is a normal 200, not an error.

### Option

| Field | Type | Meaning |
|---|---|---|
| `id` | string | Valid for this response only |
| `modes` | string[] | In order, for example `["walk","bus","walk","brt"]` |
| `total_minutes` | integer | Walking, waiting and riding |
| `walk_meters` | integer | Total walking |
| `distance_km` | number | Ride distance, measured between stops |
| `transfers` | integer | Number of changes |
| `fare_ngn` | `{min,max}` or null | Naira range. Null means no fare is on file for part of the journey, never zero |
| `confidence` | string | Weakest status on the journey (see below) |
| `display_label` | string | `verified` or `estimated`. Show this to users |
| `tags` | string[] | `fastest` and or `cheapest`. The backend sets these, the client must not re-rank |
| `legs` | Leg[] | Walk and ride legs in order |
| `steps` | string[] | Ready-to-show instructions |
| `notes` | string[] | Caveats for this option |

### Leg

`type` is `walk` or `ride`. Walk legs have `minutes` and `meters`. Ride legs add `mode`, `route_id`, `route_name`, `from_stop_id`, `from_stop_name`, `to_stop_id`, `to_stop_name`, `wait_minutes`, `fare` (`{min,max}` or null), `status` and `time_estimated`. Leg `minutes` excludes `wait_minutes`; `total_minutes` includes both.

### Confidence values

From weakest to strongest: `estimated`, `community`, `operator`, `field_verified`, `official`. `display_label` is `verified` for the last three and `estimated` for the first two. An estimated option must never be presented as confirmed.

### Unavailable data

- No fare on file: `fare_ngn` is null, the option note says so, and the option is excluded from the `cheapest` tag.
- Missing travel time on a route segment: a default of 3 minutes per hop is used and the option note says "Some travel times are estimated."
- No car option yet: the response note says the car estimate is unavailable until a map provider is connected.

## Current limitation

Routes, stops, times and fares come from `apps/journeys/demo_data.py`, which is placeholder data. Every status is `estimated` and every response carries a demo note. It will be replaced by the transit module's data.

## Front-end field mapping

| Front end | Backend |
|---|---|
| `durationMinutes` | `total_minutes` |
| `fareMin`, `fareMax` | `fare_ngn.min`, `fare_ngn.max` (null: show the note) |
| `distanceKm` | `distance_km` |
| `walkingMeters` | `walk_meters` |
| `transfers` | `transfers` |
| `badge` | `tags` and `display_label` |
| `steps` | `steps` |
| `mode` | `modes`, joined for display |
