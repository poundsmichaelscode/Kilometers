import tempfile
from io import StringIO
from pathlib import Path
from unittest import mock

from django.core.cache import cache
from django.core.exceptions import ValidationError
from django.core.management import call_command
from django.core.management.base import CommandError
from django.db import IntegrityError, transaction
from django.test import TestCase
from rest_framework.test import APIClient

from apps.journeys import engine

from .adapters import load_engine_routes
from .models import Fare, Route, RouteStop, Stop, VerificationStatus
from .views import TransitReadThrottle


def make_stop(name, lat, lng, area="Lagos", **extra):
    return Stop.objects.create(name=name, area=area, latitude=lat, longitude=lng, **extra)


class ModelTests(TestCase):
    def setUp(self):
        self.a = make_stop("A", 6.45, 3.47)
        self.b = make_stop("B", 6.60, 3.35)
        self.route = Route.objects.create(name="R1", mode="bus")

    def test_default_status_is_estimated_and_label_says_so(self):
        self.assertEqual(self.a.status, VerificationStatus.ESTIMATED)
        self.assertEqual(self.a.display_label, "estimated")

    def test_label_is_verified_only_for_operator_and_stronger(self):
        labels = {}
        for status in VerificationStatus.values:
            self.a.status = status
            labels[status] = self.a.display_label
        self.assertEqual(
            labels,
            {"estimated": "estimated", "community": "estimated", "operator": "verified",
             "field_verified": "verified", "official": "verified"},
        )

    def test_status_order_matches_journey_engine(self):
        self.assertEqual(list(VerificationStatus.values), engine.STATUS_ORDER)

    def test_latitude_out_of_range_fails_validation(self):
        stop = Stop(name="Bad", latitude=91, longitude=3)
        with self.assertRaises(ValidationError):
            stop.full_clean()

    def test_route_stop_position_and_stop_are_unique_per_route(self):
        RouteStop.objects.create(route=self.route, stop=self.a, position=1)
        with self.assertRaises(IntegrityError), transaction.atomic():
            RouteStop.objects.create(route=self.route, stop=self.b, position=1)
        with self.assertRaises(IntegrityError), transaction.atomic():
            RouteStop.objects.create(route=self.route, stop=self.a, position=2)

    def test_fare_max_below_min_is_rejected_by_the_database(self):
        with self.assertRaises(IntegrityError), transaction.atomic():
            Fare.objects.create(route=self.route, min_ngn=500, max_ngn=400)

    def test_fare_needs_both_stops_or_neither(self):
        with self.assertRaises(IntegrityError), transaction.atomic():
            Fare.objects.create(route=self.route, from_stop=self.a, min_ngn=100, max_ngn=200)


class ApiTests(TestCase):
    def setUp(self):
        cache.clear()
        self.client = APIClient()
        self.lekki = make_stop("Lekki stop", 6.4478, 3.4723, "Lekki")
        self.cms = make_stop("CMS stop", 6.4505, 3.3920, "Island")
        self.ikeja = make_stop("Ikeja stop", 6.6018, 3.3515, "Ikeja", status="operator")
        self.near = make_stop("Near stop", 6.4700, 3.4723, "Lekki")  # about 2.5 km north of Lekki stop
        self.hidden = make_stop("Closed stop", 6.4479, 3.4724, "Lekki", is_active=False)
        self.route = Route.objects.create(name="Bus 1", mode="bus", headway_minutes=10)
        RouteStop.objects.create(route=self.route, stop=self.lekki, position=1)
        RouteStop.objects.create(route=self.route, stop=self.cms, position=2, minutes_from_prev=30)
        self.unpriced = Route.objects.create(name="BRT 2", mode="brt", status="official")
        Fare.objects.create(route=self.route, min_ngn=500, max_ngn=800)

    def test_endpoints_are_public_and_ignore_bad_tokens(self):
        self.client.credentials(HTTP_AUTHORIZATION="Bearer not-a-real-token")
        for url in ("/api/v1/transit/stops", "/api/v1/transit/routes", "/api/v1/transit/fares"):
            self.assertEqual(self.client.get(url).status_code, 200, url)

    def test_stops_hide_inactive_and_show_provenance(self):
        data = self.client.get("/api/v1/transit/stops").json()
        self.assertEqual({s["name"] for s in data}, {"Lekki stop", "Near stop", "CMS stop", "Ikeja stop"})
        by_name = {s["name"]: s for s in data}
        self.assertEqual(by_name["Ikeja stop"]["display_label"], "verified")
        self.assertEqual(by_name["Lekki stop"]["display_label"], "estimated")
        self.assertIsNone(by_name["Lekki stop"]["distance_m"])

    def test_nearby_returns_close_stops_sorted_with_distance(self):
        data = self.client.get("/api/v1/transit/stops", {"lat": 6.4478, "lng": 3.4723, "radius_m": 1000}).json()
        self.assertEqual([s["name"] for s in data], ["Lekki stop"])
        self.assertLessEqual(data[0]["distance_m"], 5)

    def test_nearby_radius_widens_results_in_distance_order(self):
        data = self.client.get("/api/v1/transit/stops", {"lat": 6.4478, "lng": 3.4723, "radius_m": 5000}).json()
        self.assertEqual([s["name"] for s in data], ["Lekki stop", "Near stop"])
        self.assertEqual(data, sorted(data, key=lambda s: s["distance_m"]))

    def test_search_by_name_or_area(self):
        self.assertEqual([s["name"] for s in self.client.get("/api/v1/transit/stops", {"q": "ikeja"}).json()],
                         ["Ikeja stop"])

    def test_stops_validate_query(self):
        for params in ({"lat": 95, "lng": 3}, {"lat": 6.4}, {"lat": 6.4, "lng": 3.4, "radius_m": 999999},
                       {"limit": 0}, {"lat": "abc", "lng": 3}):
            self.assertEqual(self.client.get("/api/v1/transit/stops", params).status_code, 400, params)

    def test_routes_filter_by_mode(self):
        self.assertEqual([r["name"] for r in self.client.get("/api/v1/transit/routes", {"mode": "brt"}).json()],
                         ["BRT 2"])
        self.assertEqual(self.client.get("/api/v1/transit/routes", {"mode": "teleport"}).status_code, 400)

    def test_route_detail_orders_stops_and_lists_fares(self):
        data = self.client.get(f"/api/v1/transit/routes/{self.route.id}").json()
        self.assertEqual([s["position"] for s in data["stops"]], [1, 2])
        self.assertEqual(data["stops"][1]["minutes_from_prev"], 30)
        self.assertEqual((data["fares"][0]["min_ngn"], data["fares"][0]["max_ngn"]), (500, 800))
        self.assertIn("This route is not verified.", data["notes"])

    def test_route_without_fare_says_so_and_never_returns_zero(self):
        data = self.client.get(f"/api/v1/transit/routes/{self.unpriced.id}").json()
        self.assertEqual(data["fares"], [])
        self.assertIn("No fare on file for this route.", data["notes"])
        self.assertNotIn("This route is not verified.", data["notes"])  # official route

    def test_unknown_or_inactive_route_is_404(self):
        self.assertEqual(self.client.get("/api/v1/transit/routes/9999").status_code, 404)
        Route.objects.filter(pk=self.route.pk).update(is_active=False)
        self.assertEqual(self.client.get(f"/api/v1/transit/routes/{self.route.id}").status_code, 404)

    def test_fares_filter_by_route(self):
        self.assertEqual(len(self.client.get("/api/v1/transit/fares").json()), 1)
        self.assertEqual(self.client.get("/api/v1/transit/fares", {"route": self.unpriced.id}).json(), [])
        self.assertEqual(self.client.get("/api/v1/transit/fares", {"route": "9999"}).status_code, 404)
        self.assertEqual(self.client.get("/api/v1/transit/fares", {"route": "abc"}).status_code, 404)

    def test_reads_are_rate_limited(self):
        with mock.patch.object(TransitReadThrottle, "rate", "2/min"):
            statuses = [self.client.get("/api/v1/transit/routes").status_code for _ in range(3)]
        self.assertEqual(statuses, [200, 200, 429])

    def test_writes_are_not_allowed(self):
        self.assertEqual(self.client.post("/api/v1/transit/stops", {}, format="json").status_code, 405)


class AdapterTests(TestCase):
    def test_database_routes_feed_the_journey_engine(self):
        call_command("seed_transit", stdout=StringIO())
        routes = load_engine_routes()
        self.assertEqual(len(routes), 3)
        origin = engine.Stop(0, "o", 6.4478, 3.4723)
        destination = engine.Stop(0, "d", 6.6018, 3.3515)
        options = engine.compare(origin, destination, routes)
        self.assertTrue(options)
        self.assertIn("fastest", options[0]["tags"])
        self.assertTrue(all(o["display_label"] == "estimated" for o in options))

    def test_inactive_routes_stops_and_fares_are_left_out(self):
        call_command("seed_transit", stdout=StringIO())
        Route.objects.filter(name="DEMO bus: Lekki to Ikeja").update(is_active=False)
        Fare.objects.filter(route__name="DEMO BRT: Yaba to Ikeja").update(is_active=False)
        Stop.objects.filter(name="Oshodi stop").update(is_active=False)
        by_name = {r.name: r for r in load_engine_routes()}
        self.assertNotIn("DEMO bus: Lekki to Ikeja", by_name)
        self.assertEqual(by_name["DEMO BRT: Yaba to Ikeja"].fares, ())
        self.assertEqual([s.name for s, _ in by_name["DEMO BRT: Yaba to Ikeja"].stops], ["Yaba stop", "Ikeja stop"])

    def test_route_with_missing_fare_gives_null_fare_not_zero(self):
        call_command("seed_transit", stdout=StringIO())
        Fare.objects.all().delete()
        options = engine.compare(engine.Stop(0, "o", 6.4478, 3.4723), engine.Stop(0, "d", 6.6018, 3.3515),
                                 load_engine_routes())
        self.assertTrue(all(o["fare_ngn"] is None for o in options))

    def test_first_stop_never_has_a_ride_time(self):
        route = Route.objects.create(name="R", mode="bus")
        RouteStop.objects.create(route=route, stop=make_stop("A", 6.4, 3.4), position=1, minutes_from_prev=9)
        RouteStop.objects.create(route=route, stop=make_stop("B", 6.5, 3.5), position=2, minutes_from_prev=7)
        self.assertEqual([m for _, m in load_engine_routes()[0].stops], [None, 7])


class SeedTests(TestCase):
    def test_seed_is_idempotent_and_everything_is_estimated(self):
        for _ in range(2):
            call_command("seed_transit", stdout=StringIO())
        self.assertEqual((Stop.objects.count(), Route.objects.count(), Fare.objects.count()), (5, 3, 3))
        self.assertEqual(RouteStop.objects.count(), 8)
        for model in (Stop, Route, Fare):
            self.assertFalse(model.objects.exclude(status="estimated").exists())


class CsvImportTests(TestCase):
    def run_import(self, files, **options):
        with tempfile.TemporaryDirectory() as folder:
            for name, text in files.items():
                (Path(folder) / name).write_text(text, encoding="utf-8")
            out = StringIO()
            call_command("import_transit_csv", folder, stdout=out, **options)
            return out.getvalue()

    GOOD = {
        "stops.csv": "name,area,latitude,longitude,status,source\n"
                     "Alpha,Lekki,6.45,3.47,field_verified,Survey\nBeta,Ikeja,6.60,3.35,,\n",
        "routes.csv": "name,mode,operator,headway_minutes,status,source\nLine 1,brt,LAMATA,8,operator,LAMATA\n",
        "route_stops.csv": "route,stop,area,position,minutes_from_prev\nLine 1,Alpha,Lekki,1,\nLine 1,Beta,Ikeja,2,40\n",
        "fares.csv": "route,from_stop,from_area,to_stop,to_area,min_ngn,max_ngn,status,source\n"
                     "Line 1,,,,,300,500,operator,LAMATA\nLine 1,Alpha,Lekki,Beta,Ikeja,400,600,,\n",
    }

    def test_imports_everything_with_provenance(self):
        self.run_import(self.GOOD)
        self.assertEqual((Stop.objects.count(), Route.objects.count(), RouteStop.objects.count(), Fare.objects.count()),
                         (2, 1, 2, 2))
        self.assertEqual(Stop.objects.get(name="Alpha").status, "field_verified")
        self.assertEqual(Stop.objects.get(name="Beta").status, "estimated")  # blank defaults to estimated
        self.assertIsNone(RouteStop.objects.get(position=1).minutes_from_prev)
        self.assertEqual(Fare.objects.filter(from_stop__isnull=True).count(), 1)

    def test_rerun_updates_instead_of_duplicating(self):
        self.run_import(self.GOOD)
        self.run_import(self.GOOD)
        self.assertEqual((Stop.objects.count(), Route.objects.count(), RouteStop.objects.count(), Fare.objects.count()),
                         (2, 1, 2, 2))

    def test_dry_run_saves_nothing(self):
        output = self.run_import(self.GOOD, dry_run=True)
        self.assertIn("Dry run OK", output)
        self.assertEqual(Stop.objects.count(), 0)

    def assertImportFails(self, files, message):
        with self.assertRaises(CommandError) as ctx:
            self.run_import(files)
        self.assertIn(message, str(ctx.exception))
        self.assertEqual(Stop.objects.count() + Route.objects.count(), 0, "a bad row must cancel the whole import")

    def test_bad_rows_cancel_everything_and_name_the_row(self):
        bad_stop = dict(self.GOOD, **{"stops.csv": "name,area,latitude,longitude\nAlpha,Lekki,6.45,3.47\nBad,X,95,3\n"})
        self.assertImportFails(bad_stop, "stops.csv row 3")
        self.assertImportFails(dict(self.GOOD, **{"stops.csv": "name,area,latitude,longitude\nA,,abc,3\n"}),
                               "latitude must be a number")
        self.assertImportFails(dict(self.GOOD, **{"routes.csv": "name,mode\nLine 1,hovercraft\n"}), "routes.csv row 2")
        self.assertImportFails(dict(self.GOOD, **{"stops.csv": "name,area,latitude,longitude,status\nA,,6,3,great\n"}),
                               "status must be one of")

    def test_unknown_references_and_half_fares_are_rejected(self):
        self.assertImportFails(dict(self.GOOD, **{"route_stops.csv": "route,stop,area,position\nGhost,Alpha,Lekki,1\n"}),
                               "Route 'Ghost' not found")
        half = "route,from_stop,from_area,to_stop,to_area,min_ngn,max_ngn\nLine 1,Alpha,Lekki,,,1,2\n"
        self.assertImportFails(dict(self.GOOD, **{"fares.csv": half}), "both from_stop and to_stop")
        inverted = "route,min_ngn,max_ngn\nLine 1,900,100\n"
        with self.assertRaises(CommandError):
            self.run_import(dict(self.GOOD, **{"fares.csv": inverted}))

    def test_missing_directory_is_a_clear_error(self):
        with self.assertRaises(CommandError):
            call_command("import_transit_csv", "does-not-exist")
