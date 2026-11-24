import unittest

from . import engine as e

ORIGIN = e.Stop(0, "origin", 6.4478, 3.4723)
DEST = e.Stop(0, "dest", 6.6018, 3.3515)
A = e.Stop(1, "Lekki Stop", 6.4480, 3.4725)
C = e.Stop(3, "Mid Stop", 6.5500, 3.3800)
C2 = e.Stop(4, "Mid Stop Opposite", 6.5503, 3.3803)  # about 40 m from C
D = e.Stop(5, "Ikeja Stop", 6.6016, 3.3517)
FLAT = e.Fare(500, 800)


def route(rid, stops, fares=(FLAT,), status="estimated", mode="bus"):
    return e.Route(rid, f"Route {rid}", mode, tuple((s, 10) for s in stops), tuple(fares), status=status)


class EngineTests(unittest.TestCase):
    def test_direct_route(self):
        out = e.compare(ORIGIN, DEST, [route(1, [A, D])])
        self.assertEqual(len(out), 1)
        self.assertEqual(out[0]["transfers"], 0)
        self.assertEqual(out[0]["fare_ngn"], {"min": 500, "max": 800})
        self.assertEqual(out[0]["tags"], ["fastest", "cheapest"])

    def test_one_transfer_when_no_direct_route(self):
        out = e.compare(ORIGIN, DEST, [route(1, [A, C]), route(2, [C2, D])])
        self.assertEqual(len(out), 1)
        self.assertEqual(out[0]["transfers"], 1)
        self.assertEqual(out[0]["fare_ngn"], {"min": 1000, "max": 1600})

    def test_wrong_direction_gives_nothing(self):
        self.assertEqual(e.compare(ORIGIN, DEST, [route(1, [D, A])]), [])

    def test_missing_fare_excluded_from_cheapest_and_noted(self):
        out = e.compare(ORIGIN, DEST, [route(1, [A, D], fares=())])
        self.assertIsNone(out[0]["fare_ngn"])
        self.assertNotIn("cheapest", out[0]["tags"])
        self.assertIn("No fare on file for part of this journey.", out[0]["notes"])

    def test_confidence_is_weakest_leg(self):
        out = e.compare(ORIGIN, DEST, [route(1, [A, C], status="official"), route(2, [C2, D])])
        self.assertEqual(out[0]["confidence"], "estimated")
        self.assertEqual(out[0]["display_label"], "estimated")

    def test_verified_label(self):
        fare = e.Fare(500, 800, status="field_verified")
        out = e.compare(ORIGIN, DEST, [route(1, [A, D], fares=(fare,), status="official")])
        self.assertEqual(out[0]["display_label"], "verified")

    def test_stop_pair_fare_beats_flat_fare(self):
        pair = e.Fare(300, 400, from_stop_id=A.id, to_stop_id=D.id)
        out = e.compare(ORIGIN, DEST, [route(1, [A, D], fares=(FLAT, pair))])
        self.assertEqual(out[0]["fare_ngn"], {"min": 300, "max": 400})

    def test_no_stops_nearby_returns_car_only(self):
        far = e.Stop(9, "far", 7.5, 4.5)
        car = e.car_option(60, 31000, 120)
        out = e.compare(far, DEST, [route(1, [A, D])], car=car)
        self.assertEqual([o["modes"] for o in out], [["car"]])
        self.assertIn("fastest", out[0]["tags"])

    def test_missing_minutes_are_estimated_and_noted(self):
        r = e.Route(1, "Route 1", "bus", ((A, None), (D, None)), (FLAT,))
        out = e.compare(ORIGIN, DEST, [r])
        self.assertIn("Some travel times are estimated.", out[0]["notes"])

    def test_no_routes_and_no_car_returns_empty(self):
        self.assertEqual(e.compare(ORIGIN, DEST, []), [])


if __name__ == "__main__":
    unittest.main()
