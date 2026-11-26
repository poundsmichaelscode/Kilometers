"""Convert transit database rows into the journey engine dataclasses.

The journeys app can call load_engine_routes() instead of using demo_data.ROUTES.
"""
from apps.journeys.engine import Fare as EngineFare
from apps.journeys.engine import Route as EngineRoute
from apps.journeys.engine import Stop as EngineStop

from .models import Route


def load_engine_routes():
    routes = (
        Route.objects.filter(is_active=True)
        .prefetch_related("route_stops__stop", "fares")
        .order_by("id")
    )
    result = []
    for route in routes:
        route_stops = [rs for rs in route.route_stops.all() if rs.stop.is_active]
        route_stops.sort(key=lambda rs: rs.position)
        if len(route_stops) < 2:
            continue  # a route needs at least two stops to ride
        stops = [
            (EngineStop(rs.stop.id, rs.stop.name, rs.stop.latitude, rs.stop.longitude), rs.minutes_from_prev)
            for rs in route_stops
        ]
        stops[0] = (stops[0][0], None)  # the first stop has nothing before it
        fares = tuple(
            EngineFare(f.min_ngn, f.max_ngn, f.status, f.from_stop_id, f.to_stop_id)
            for f in route.fares.all()
            if f.is_active
        )
        result.append(
            EngineRoute(route.id, route.name, route.mode, tuple(stops), fares, route.headway_minutes, route.status)
        )
    return tuple(result)
