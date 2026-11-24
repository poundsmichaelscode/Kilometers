from types import SimpleNamespace

from drf_spectacular.utils import extend_schema
from rest_framework.response import Response
from rest_framework.views import APIView

from . import demo_data, engine
from .serializers import CompareRequestSerializer, CompareResponseSerializer

CAR_NOTE = "Car estimate unavailable: no map provider is connected yet."


class CompareView(APIView):
    @extend_schema(
        request=CompareRequestSerializer,
        responses={200: CompareResponseSerializer},
        tags=["Journeys"],
        description=(
            "Compare public transport options between two points. Options are tagged fastest and "
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
