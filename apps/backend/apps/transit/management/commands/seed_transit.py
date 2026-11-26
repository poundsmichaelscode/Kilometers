"""Load the placeholder Lekki to Ikeja corridor so the API has something to return.

These records are carried over from apps/journeys/demo_data.py. Coordinates are approximate area
points, travel times and fares are placeholders, and every status is "estimated". Replace them
with surveyed data through the Django Admin or import_transit_csv. Safe to run more than once.
"""
from django.core.management.base import BaseCommand
from django.db import transaction

from apps.transit.models import Fare, Route, RouteStop, Stop, VerificationStatus

SOURCE = "Placeholder from journeys/demo_data.py. Not surveyed."

STOPS = {
    "lekki": ("Lekki Phase 1 stop", "Lekki", 6.4478, 3.4723),
    "cms": ("CMS stop", "Lagos Island", 6.4505, 3.3920),
    "yaba": ("Yaba stop", "Yaba", 6.5095, 3.3711),
    "oshodi": ("Oshodi stop", "Oshodi", 6.5568, 3.3446),
    "ikeja": ("Ikeja stop", "Ikeja", 6.6018, 3.3515),
}

# name, mode, ordered (stop key, minutes_from_prev), flat fare (min, max)
ROUTES = [
    ("DEMO bus: Lekki to Yaba", "bus", [("lekki", None), ("cms", 30), ("yaba", 25)], (500, 800)),
    ("DEMO BRT: Yaba to Ikeja", "brt", [("yaba", None), ("oshodi", 20), ("ikeja", 15)], (300, 500)),
    ("DEMO bus: Lekki to Ikeja", "bus", [("lekki", None), ("ikeja", 85)], (900, 1400)),
]


class Command(BaseCommand):
    help = "Load placeholder Lekki to Ikeja stops, routes and fares (all status estimated)."

    @transaction.atomic
    def handle(self, *args, **options):
        stops = {}
        for key, (name, area, lat, lng) in STOPS.items():
            stops[key], _ = Stop.objects.update_or_create(
                name=name, area=area,
                defaults={"latitude": lat, "longitude": lng, "status": VerificationStatus.ESTIMATED, "source": SOURCE},
            )
        for name, mode, route_stops, (fare_min, fare_max) in ROUTES:
            route, _ = Route.objects.update_or_create(
                name=name, defaults={"mode": mode, "status": VerificationStatus.ESTIMATED, "source": SOURCE}
            )
            for position, (key, minutes) in enumerate(route_stops, start=1):
                RouteStop.objects.update_or_create(
                    route=route, stop=stops[key], defaults={"position": position, "minutes_from_prev": minutes}
                )
            Fare.objects.update_or_create(
                route=route, from_stop=None, to_stop=None,
                defaults={"min_ngn": fare_min, "max_ngn": fare_max, "status": VerificationStatus.ESTIMATED, "source": SOURCE},
            )
        self.stdout.write(self.style.SUCCESS(
            f"Seeded {len(STOPS)} stops and {len(ROUTES)} routes. All records are marked estimated."
        ))
