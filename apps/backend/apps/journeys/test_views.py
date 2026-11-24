from unittest import mock

from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient

from . import demo_data, engine
from .serializers import CompareResponseSerializer

URL = "/api/v1/journeys/compare"
LEKKI = {"lat": 6.4478, "lng": 3.4723, "label": "Lekki Phase 1"}
IKEJA = {"lat": 6.6018, "lng": 3.3515, "label": "Ikeja"}
ABUJA = {"lat": 9.0765, "lng": 7.3986}


class CompareEndpointTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = get_user_model().objects.create_user(email="rider@example.com", password="SecureTestPassword@2026")

    def post(self, body):
        self.client.force_authenticate(self.user)
        return self.client.post(URL, body, format="json")

    def test_requires_login(self):
        response = APIClient().post(URL, {"origin": LEKKI, "destination": IKEJA}, format="json")
        self.assertEqual(response.status_code, 401)

    def test_returns_tagged_options_and_demo_note(self):
        response = self.post({"origin": LEKKI, "destination": IKEJA})
        self.assertEqual(response.status_code, 200)
        body = response.json()
        self.assertGreaterEqual(len(body["options"]), 2)
        tags = [t for option in body["options"] for t in option["tags"]]
        self.assertEqual(sorted(tags), ["cheapest", "fastest"])
        self.assertIn(demo_data.DEMO_NOTE, body["notes"])
        self.assertTrue(all(o["display_label"] == "estimated" for o in body["options"]))

    def test_response_matches_documented_schema(self):
        body = self.post({"origin": LEKKI, "destination": IKEJA}).json()
        check = CompareResponseSerializer(data=body)
        self.assertTrue(check.is_valid(), check.errors)

    def test_latitude_out_of_range_is_rejected(self):
        response = self.post({"origin": {"lat": 9999, "lng": 3.4}, "destination": IKEJA})
        self.assertEqual(response.status_code, 400)
        self.assertIn("origin", response.json())

    def test_missing_destination_is_rejected(self):
        response = self.post({"origin": LEKKI})
        self.assertEqual(response.status_code, 400)
        self.assertIn("destination", response.json())

    def test_overlong_label_is_rejected(self):
        response = self.post({"origin": {**LEKKI, "label": "x" * 10000}, "destination": IKEJA})
        self.assertEqual(response.status_code, 400)

    def test_same_point_is_rejected(self):
        response = self.post({"origin": LEKKI, "destination": LEKKI})
        self.assertEqual(response.status_code, 400)

    def test_nothing_nearby_is_200_with_note(self):
        response = self.post({"origin": ABUJA, "destination": IKEJA})
        self.assertEqual(response.status_code, 200)
        body = response.json()
        self.assertEqual(body["options"], [])
        self.assertIn("No public transport journey was found near these points.", body["notes"])

    def test_missing_fare_is_null_and_not_cheapest(self):
        no_fare = engine.Route(
            201, "DEMO no fare", "bus", ((demo_data.LEKKI, None), (demo_data.IKEJA, 85)), ()
        )
        with mock.patch.object(demo_data, "ROUTES", (no_fare,)):
            body = self.post({"origin": LEKKI, "destination": IKEJA}).json()
        option = body["options"][0]
        self.assertIsNone(option["fare_ngn"])
        self.assertNotIn("cheapest", option["tags"])
        self.assertIn("No fare on file for part of this journey.", option["notes"])
