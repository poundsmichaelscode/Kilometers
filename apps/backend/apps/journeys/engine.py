"""Journey comparison engine. Pure Python with no Django imports, so it tests without a database.

shortcut: enumerates direct and one-transfer itineraries only; move to a graph search when
we cover more than the five named corridors.
"""
from dataclasses import dataclass
from math import asin, ceil, cos, radians, sin, sqrt

WALK_M_PER_MIN = 80
WALK_DETOUR = 1.3  # straight-line to street-distance factor; shortcut: use provider walking directions later
MAX_WALK_TO_STOP_M = 1500
MAX_TRANSFER_WALK_M = 400
NEAREST_STOPS = 3
DEFAULT_WAIT_MIN = {"bus": 10, "brt": 8, "rail": 15, "ferry": 20}
DEFAULT_HOP_MIN = 3  # used when a RouteStop has no minutes_from_prev
# Weakest to strongest trust; the weakest status on any leg is the option's confidence.
STATUS_ORDER = ["estimated", "community", "operator", "field_verified", "official"]
VERIFIED = {"operator", "field_verified", "official"}


@dataclass(frozen=True)
class Stop:
    id: int
    name: str
    lat: float
    lng: float


@dataclass(frozen=True)
class Fare:
    min: int
    max: int
    status: str = "estimated"
    from_stop_id: int | None = None  # both None means a flat fare for the whole route
    to_stop_id: int | None = None


@dataclass(frozen=True)
class Route:
    id: int
    name: str
    mode: str
    stops: tuple  # ordered tuples of (Stop, minutes_from_prev or None)
    fares: tuple = ()
    headway_minutes: int | None = None
    status: str = "estimated"


def meters(a, b):
    """Haversine distance in metres between two objects with lat and lng."""
    p1, p2 = radians(a.lat), radians(b.lat)
    h = sin((p2 - p1) / 2) ** 2 + cos(p1) * cos(p2) * sin(radians(b.lng - a.lng) / 2) ** 2
    return 2 * 6371000 * asin(sqrt(h))


def walk_minutes(m):
    return ceil(m * WALK_DETOUR / WALK_M_PER_MIN)


def display_label(status):
    return "verified" if status in VERIFIED else "estimated"


def weakest(statuses):
    return min(statuses, key=STATUS_ORDER.index)


def _near(point, stops):
    found = sorted(((meters(point, s), s) for s in stops), key=lambda t: t[0])
    return [(s, m) for m, s in found if m <= MAX_WALK_TO_STOP_M][:NEAREST_STOPS]


def _index(route, stop):
    for i, (s, _) in enumerate(route.stops):
        if s.id == stop.id:
            return i
    return None


def _ride(route, i, j):
    """Ride leg from stop index i to j (i < j)."""
    hops = [mins for _, mins in route.stops[i + 1 : j + 1]]
    minutes = sum(DEFAULT_HOP_MIN if m is None else m for m in hops)
    estimated_time = any(m is None for m in hops)
    a, b = route.stops[i][0], route.stops[j][0]
    meters_ = sum(meters(route.stops[k][0], route.stops[k + 1][0]) for k in range(i, j))
    fare = next((f for f in route.fares if f.from_stop_id == a.id and f.to_stop_id == b.id), None) or next(
        (f for f in route.fares if f.from_stop_id is None and f.to_stop_id is None), None
    )
    wait = ceil(route.headway_minutes / 2) if route.headway_minutes else DEFAULT_WAIT_MIN.get(route.mode, 10)
    return {
        "type": "ride", "mode": route.mode, "route_id": route.id, "route_name": route.name,
        "from_stop_id": a.id, "from_stop_name": a.name, "to_stop_id": b.id, "to_stop_name": b.name,
        "wait_minutes": wait, "minutes": minutes, "meters": round(meters_),
        "fare": {"min": fare.min, "max": fare.max} if fare else None,
        "status": weakest([route.status] + ([fare.status] if fare else [])),
        "time_estimated": estimated_time,
    }


def _walk(m):
    return {"type": "walk", "minutes": walk_minutes(m), "meters": round(m * WALK_DETOUR)}


def _option(legs, notes):
    rides = [leg for leg in legs if leg["type"] == "ride"]
    fares = [leg["fare"] for leg in rides]
    fare = None if any(f is None for f in fares) else {"min": sum(f["min"] for f in fares), "max": sum(f["max"] for f in fares)}
    opt_notes = list(notes)
    if fare is None:
        opt_notes.append("No fare on file for part of this journey.")
    if any(leg["time_estimated"] for leg in rides):
        opt_notes.append("Some travel times are estimated.")
    status = weakest([leg["status"] for leg in rides])
    modes = []
    for leg in legs:
        mode = leg["type"] if leg["type"] == "walk" else leg["mode"]
        if not modes or modes[-1] != mode:
            modes.append(mode)
    steps = []
    for leg in legs:
        if leg["type"] == "walk":
            steps.append(f"Walk about {leg['meters']} m")
        else:
            steps.append(f"Take {leg['route_name']} from {leg['from_stop_name']} to {leg['to_stop_name']}")
    return {
        "modes": modes,
        "total_minutes": sum(leg["minutes"] + leg.get("wait_minutes", 0) for leg in legs),
        "walk_meters": sum(leg["meters"] for leg in legs if leg["type"] == "walk"),
        "distance_km": round(sum(leg["meters"] for leg in rides) / 1000, 1),
        "transfers": len(rides) - 1,
        "fare_ngn": fare,
        "confidence": status,
        "display_label": display_label(status),
        "legs": legs,
        "steps": steps,
        "notes": opt_notes,
        "tags": [],
    }


def car_option(minutes, meters_, fuel_cost_per_km):
    """Car option from provider duration and distance. Cost is a configured estimate, never verified."""
    cost = round(meters_ / 1000 * fuel_cost_per_km)
    return {
        "modes": ["car"], "total_minutes": round(minutes), "walk_meters": 0,
        "distance_km": round(meters_ / 1000, 1), "transfers": 0,
        "fare_ngn": {"min": round(cost * 0.8), "max": round(cost * 1.2)},
        "confidence": "estimated", "display_label": "estimated",
        "legs": [{"type": "drive", "minutes": round(minutes), "meters": round(meters_)}],
        "steps": ["Drive to your destination"], "notes": ["Fuel cost is an estimate."], "tags": [],
    }


def compare(origin, destination, routes, car=None):
    """Return options with fastest and cheapest tags. origin and destination have lat and lng."""
    stops = {s.id: s for r in routes for s, _ in r.stops}.values()
    near_o, near_d = _near(origin, stops), _near(destination, stops)
    best = {}  # one itinerary per route or route pair, the quickest

    def keep(key, legs):
        opt = _option(legs, [])
        if key not in best or opt["total_minutes"] < best[key]["total_minutes"]:
            best[key] = opt

    for ra in routes:
        for so, mo in near_o:
            i = _index(ra, so)
            if i is None:
                continue
            for sd, md in near_d:
                j = _index(ra, sd)
                if j is not None and j > i:
                    keep((ra.id,), [_walk(mo), _ride(ra, i, j), _walk(md)])
            for k in range(i + 1, len(ra.stops)):  # one transfer
                for rb in routes:
                    if rb.id == ra.id:
                        continue
                    for m, (sx, _) in enumerate(rb.stops):
                        gap = meters(ra.stops[k][0], sx)
                        if gap > MAX_TRANSFER_WALK_M:
                            continue
                        for sd, md in near_d:
                            j = _index(rb, sd)
                            if j is not None and j > m:
                                keep((ra.id, rb.id), [_walk(mo), _ride(ra, i, k), _walk(gap), _ride(rb, m, j), _walk(md)])
    options = list(best.values()) + ([car] if car else [])
    if not options:
        return []
    min(options, key=lambda o: o["total_minutes"])["tags"].append("fastest")
    priced = [o for o in options if o["fare_ngn"]]
    if priced:
        min(priced, key=lambda o: (o["fare_ngn"]["max"], o["total_minutes"]))["tags"].append("cheapest")
    for n, o in enumerate(sorted(options, key=lambda o: o["total_minutes"]), 1):
        o["id"] = f"opt_{n}"
    return sorted(options, key=lambda o: o["total_minutes"])
