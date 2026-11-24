"""TEMPORARY placeholder transit data for the demo. Replace with the transit module's models.

Every stop time, fare and route below is a placeholder, not verified, and every status is
"estimated". The compare endpoint adds DEMO_NOTE to each response while this file is in use.
"""
from .engine import Fare, Route, Stop

DEMO_NOTE = "Demo data: stops, travel times and fares are placeholders and not verified."

LEKKI = Stop(1, "Lekki Phase 1 stop", 6.4478, 3.4723)
CMS = Stop(2, "CMS stop", 6.4505, 3.3920)
YABA = Stop(3, "Yaba stop", 6.5095, 3.3711)
OSHODI = Stop(4, "Oshodi stop", 6.5568, 3.3446)
IKEJA = Stop(5, "Ikeja stop", 6.6018, 3.3515)

ROUTES = (
    Route(101, "DEMO bus: Lekki to Yaba", "bus", ((LEKKI, None), (CMS, 30), (YABA, 25)), (Fare(500, 800),)),
    Route(102, "DEMO BRT: Yaba to Ikeja", "brt", ((YABA, None), (OSHODI, 20), (IKEJA, 15)), (Fare(300, 500),)),
    Route(103, "DEMO bus: Lekki to Ikeja", "bus", ((LEKKI, None), (IKEJA, 85)), (Fare(900, 1400),)),
)
