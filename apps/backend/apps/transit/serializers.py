from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers

from .models import Fare, Route, RouteStop, Stop


class ProvenanceMixin(serializers.Serializer):
    display_label = serializers.CharField(read_only=True, help_text="verified or estimated. Show this to users.")


class StopSerializer(ProvenanceMixin, serializers.ModelSerializer):
    distance_m = serializers.SerializerMethodField(help_text="Only present when lat and lng are sent.")

    class Meta:
        model = Stop
        fields = [
            "id", "name", "area", "latitude", "longitude",
            "status", "display_label", "source", "last_verified_at", "distance_m",
        ]

    @extend_schema_field(serializers.IntegerField(allow_null=True))
    def get_distance_m(self, obj):
        value = getattr(obj, "distance_m", None)
        return None if value is None else round(value)


class FareSerializer(ProvenanceMixin, serializers.ModelSerializer):
    from_stop_id = serializers.IntegerField(read_only=True)
    to_stop_id = serializers.IntegerField(read_only=True)

    class Meta:
        model = Fare
        fields = [
            "id", "route_id", "from_stop_id", "to_stop_id", "min_ngn", "max_ngn",
            "status", "display_label", "source", "last_verified_at", "effective_from",
        ]


class RouteStopSerializer(serializers.ModelSerializer):
    stop = StopSerializer(read_only=True)

    class Meta:
        model = RouteStop
        fields = ["position", "minutes_from_prev", "stop"]


class RouteListSerializer(ProvenanceMixin, serializers.ModelSerializer):
    class Meta:
        model = Route
        fields = [
            "id", "name", "mode", "operator", "headway_minutes",
            "status", "display_label", "source", "last_verified_at",
        ]


class RouteDetailSerializer(RouteListSerializer):
    stops = serializers.SerializerMethodField()
    fares = serializers.SerializerMethodField()
    notes = serializers.SerializerMethodField()

    class Meta(RouteListSerializer.Meta):
        fields = RouteListSerializer.Meta.fields + ["stops", "fares", "notes"]

    @extend_schema_field(RouteStopSerializer(many=True))
    def get_stops(self, obj):
        route_stops = [rs for rs in obj.route_stops.all() if rs.stop.is_active]
        return RouteStopSerializer(sorted(route_stops, key=lambda rs: rs.position), many=True).data

    @extend_schema_field(FareSerializer(many=True))
    def get_fares(self, obj):
        return FareSerializer([f for f in obj.fares.all() if f.is_active], many=True).data

    @extend_schema_field(serializers.ListField(child=serializers.CharField()))
    def get_notes(self, obj):
        notes = []
        if not any(f.is_active for f in obj.fares.all()):
            notes.append("No fare on file for this route.")  # never shown as zero
        if obj.display_label == "estimated":
            notes.append("This route is not verified.")
        return notes
