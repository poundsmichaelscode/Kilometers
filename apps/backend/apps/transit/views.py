from math import cos, radians
from types import SimpleNamespace

from django.db.models import Q
from drf_spectacular.utils import OpenApiParameter, OpenApiResponse, extend_schema
from rest_framework import serializers
from rest_framework.exceptions import NotFound
from rest_framework.generics import RetrieveAPIView
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.throttling import SimpleRateThrottle
from rest_framework.views import APIView

from apps.journeys.engine import meters

from .models import Fare, Route, Stop
from .serializers import FareSerializer, RouteDetailSerializer, RouteListSerializer, StopSerializer

DEFAULT_RADIUS_M = 1000
MAX_RADIUS_M = 5000
MAX_LIMIT = 100
METERS_PER_DEGREE = 111_320


class TransitReadThrottle(SimpleRateThrottle):
    """60 requests a minute per client address. Reads are public (guest-first MVP)."""

    scope = "transit_read"
    rate = "60/min"

    def get_cache_key(self, request, view):
        return self.cache_format % {"scope": self.scope, "ident": self.get_ident(request)}


class PublicReadMixin:
    authentication_classes = []  # tokens are ignored so an expired one cannot cause a 401
    permission_classes = [AllowAny]
    throttle_classes = [TransitReadThrottle]


class NearbyQuerySerializer(serializers.Serializer):
    lat = serializers.FloatField(min_value=-90, max_value=90, required=False)
    lng = serializers.FloatField(min_value=-180, max_value=180, required=False)
    radius_m = serializers.IntegerField(min_value=50, max_value=MAX_RADIUS_M, default=DEFAULT_RADIUS_M)
    q = serializers.CharField(required=False, allow_blank=True, max_length=80)
    limit = serializers.IntegerField(min_value=1, max_value=MAX_LIMIT, default=50)

    def validate(self, attrs):
        if ("lat" in attrs) != ("lng" in attrs):
            raise serializers.ValidationError("Send lat and lng together.")
        return attrs


class StopListView(PublicReadMixin, APIView):
    @extend_schema(
        parameters=[NearbyQuerySerializer],
        responses={200: StopSerializer(many=True), 400: OpenApiResponse(description="Invalid query.")},
        tags=["Transit"],
        description=(
            "List active stops. Send lat and lng to get stops within radius_m (default 1000, max 5000) "
            "sorted by distance. Send q to filter by name or area. Every stop shows its verification "
            "status; display_label is verified or estimated."
        ),
    )
    def get(self, request):
        query = NearbyQuerySerializer(data=request.query_params)
        query.is_valid(raise_exception=True)
        p = query.validated_data
        stops = Stop.objects.filter(is_active=True)
        if p.get("q"):
            stops = stops.filter(Q(name__icontains=p["q"]) | Q(area__icontains=p["q"]))
        if "lat" in p:
            lat, lng, radius = p["lat"], p["lng"], p["radius_m"]
            dlat = radius / METERS_PER_DEGREE
            dlng = radius / (METERS_PER_DEGREE * max(cos(radians(lat)), 0.01))
            box = stops.filter(
                latitude__range=(lat - dlat, lat + dlat), longitude__range=(lng - dlng, lng + dlng)
            )
            point = SimpleNamespace(lat=lat, lng=lng)
            found = []
            for stop in box:
                stop.distance_m = meters(point, SimpleNamespace(lat=stop.latitude, lng=stop.longitude))
                if stop.distance_m <= radius:
                    found.append(stop)
            found.sort(key=lambda s: s.distance_m)
            return Response(StopSerializer(found[: p["limit"]], many=True).data)
        return Response(StopSerializer(stops.order_by("name")[: p["limit"]], many=True).data)


class RouteListView(PublicReadMixin, APIView):
    @extend_schema(
        parameters=[OpenApiParameter("mode", str, description="bus, brt, rail or ferry")],
        responses={200: RouteListSerializer(many=True), 400: OpenApiResponse(description="Unknown mode.")},
        tags=["Transit"],
        description="List active routes, optionally filtered by mode.",
    )
    def get(self, request):
        routes = Route.objects.filter(is_active=True)
        mode = request.query_params.get("mode")
        if mode:
            if mode not in Route.Mode.values:
                raise serializers.ValidationError({"mode": [f"Choose one of: {', '.join(Route.Mode.values)}."]})
            routes = routes.filter(mode=mode)
        return Response(RouteListSerializer(routes, many=True).data)


class RouteDetailView(PublicReadMixin, RetrieveAPIView):
    serializer_class = RouteDetailSerializer
    queryset = Route.objects.filter(is_active=True).prefetch_related("route_stops__stop", "fares")

    @extend_schema(responses={200: RouteDetailSerializer, 404: OpenApiResponse(description="Not found.")}, tags=["Transit"])
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)


class FareListView(PublicReadMixin, APIView):
    @extend_schema(
        parameters=[OpenApiParameter("route", int, description="Route id")],
        responses={200: FareSerializer(many=True), 404: OpenApiResponse(description="Route not found.")},
        tags=["Transit"],
        description=(
            "List active fares. A route with no fare on file simply has no rows here; clients must show "
            "'no fare on file', never zero. Send route to filter to one route."
        ),
    )
    def get(self, request):
        fares = Fare.objects.filter(is_active=True, route__is_active=True)
        route_id = request.query_params.get("route")
        if route_id:
            if not route_id.isdigit() or not Route.objects.filter(pk=route_id, is_active=True).exists():
                raise NotFound("Route not found.")
            fares = fares.filter(route_id=route_id)
        return Response(FareSerializer(fares, many=True).data)
