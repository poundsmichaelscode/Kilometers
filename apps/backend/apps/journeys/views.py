from types import SimpleNamespace

from drf_spectacular.utils import OpenApiResponse, extend_schema
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.throttling import SimpleRateThrottle
from rest_framework.views import APIView

from . import demo_data, engine
from .serializers import CompareRequestSerializer, CompareResponseSerializer

CAR_NOTE = "Car estimate unavailable: no map provider is connected yet."


class CompareThrottle(SimpleRateThrottle):
    """30 requests a minute per client address. Guests and signed-in users share the same limit.

    shortcut: keyed on the client IP. Behind a proxy this is only safe once REST_FRAMEWORK
    NUM_PROXIES matches the real proxy count, otherwise X-Forwarded-For can be forged.
    """

    scope = "journey_compare"
    rate = "30/min"

    def get_cache_key(self, request, view):
        return self.cache_format % {"scope": self.scope, "ident": self.get_ident(request)}


class CompareView(APIView):
    # Public on purpose (guest-first MVP). Tokens are ignored, so an expired token from a
    # signed-in user cannot turn a public request into a 401.
    authentication_classes = []
    permission_classes = [AllowAny]
    throttle_classes = [CompareThrottle]

    @extend_schema(
        request=CompareRequestSerializer,
        responses={
            200: CompareResponseSerializer,
            400: OpenApiResponse(description="Invalid origin or destination."),
            429: OpenApiResponse(description="Too many requests. Retry after the time in the Retry-After header."),
        },
        tags=["Journeys"],
        description=(
            "Compare public transport options between two points. No sign-in required; limited to "
            "30 requests a minute per client. Options are tagged fastest and "
            "cheapest. A fare of null means no fare is on file, never zero. An empty options list "
            "is a normal 200 response with an explanatory note."
        ),
    )
    def post(self, request):
        data = CompareRequestSerializer(data=request.data)
        data.is_valid(raise_exception=True)
        origin = SimpleNamespace(**data.validated_data["origin"])
        destination = SimpleNamespace(**data.validated_data["destination"])
        options = engine.compare(origin, destination, demo_data.ROUTES)
        notes = [demo_data.DEMO_NOTE, CAR_NOTE]
        if not options:
            notes.append("No public transport journey was found near these points.")
        return Response({"options": options, "notes": notes})
