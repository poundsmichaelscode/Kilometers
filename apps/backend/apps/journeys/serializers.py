from math import isfinite
from types import SimpleNamespace

from rest_framework import serializers

from .engine import meters

MIN_TRIP_METERS = 100


class PointSerializer(serializers.Serializer):
    lat = serializers.FloatField(min_value=-90, max_value=90)
    lng = serializers.FloatField(min_value=-180, max_value=180)
    label = serializers.CharField(required=False, allow_blank=True, max_length=120)

    def validate(self, attrs):
        # Defence in depth: NaN passes range checks because every comparison with it is False.
        if not (isfinite(attrs["lat"]) and isfinite(attrs["lng"])):
            raise serializers.ValidationError("Coordinates must be finite numbers.")
        return attrs


class CompareRequestSerializer(serializers.Serializer):
    origin = PointSerializer()
    destination = PointSerializer()

    def validate(self, attrs):
        if meters(SimpleNamespace(**attrs["origin"]), SimpleNamespace(**attrs["destination"])) < MIN_TRIP_METERS:
            raise serializers.ValidationError("Origin and destination are too close together.")
        return attrs


class FareRangeSerializer(serializers.Serializer):
    min = serializers.IntegerField(help_text="Lowest expected fare in Naira.")
    max = serializers.IntegerField(help_text="Highest expected fare in Naira.")


class LegSerializer(serializers.Serializer):
    type = serializers.CharField(help_text="walk, ride or drive.")
    minutes = serializers.IntegerField(help_text="Time on this leg, excluding wait.")
    meters = serializers.IntegerField()
    mode = serializers.CharField(required=False, help_text="Ride legs only: bus, brt, rail or ferry.")
    route_id = serializers.IntegerField(required=False)
    route_name = serializers.CharField(required=False)
    from_stop_id = serializers.IntegerField(required=False)
    from_stop_name = serializers.CharField(required=False)
    to_stop_id = serializers.IntegerField(required=False)
    to_stop_name = serializers.CharField(required=False)
    wait_minutes = serializers.IntegerField(required=False, help_text="Estimated wait before boarding.")
    fare = FareRangeSerializer(required=False, allow_null=True, help_text="Null when no fare is on file.")
    status = serializers.CharField(required=False, help_text="Weakest data status on this leg.")
    time_estimated = serializers.BooleanField(required=False)


class OptionSerializer(serializers.Serializer):
    id = serializers.CharField(help_text="Valid for this response only.")
    modes = serializers.ListField(child=serializers.CharField())
    total_minutes = serializers.IntegerField(help_text="Includes walking, waiting and riding.")
    walk_meters = serializers.IntegerField()
    distance_km = serializers.FloatField(help_text="Ride distance, measured between stops.")
    transfers = serializers.IntegerField()
    fare_ngn = FareRangeSerializer(allow_null=True, help_text="Null when any ride has no fare on file.")
    confidence = serializers.CharField(
        help_text="Weakest status on the journey: estimated, community, operator, field_verified or official."
    )
    display_label = serializers.CharField(help_text="verified or estimated. Never show estimated as confirmed.")
    tags = serializers.ListField(child=serializers.CharField(), help_text="fastest and or cheapest.")
    legs = LegSerializer(many=True)
    steps = serializers.ListField(child=serializers.CharField())
    notes = serializers.ListField(child=serializers.CharField())


class CompareResponseSerializer(serializers.Serializer):
    options = OptionSerializer(many=True, help_text="Sorted by total_minutes. Empty when nothing was found.")
    notes = serializers.ListField(child=serializers.CharField(), help_text="Caveats that apply to the whole response.")
