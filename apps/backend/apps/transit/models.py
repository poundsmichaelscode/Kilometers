"""Transit catalog: stops, routes, ordered route stops and fares.

Every record carries provenance (status, source, last_verified_at). The status values and their
order match apps.journeys.engine.STATUS_ORDER, so the journey engine can use them directly.

shortcut: coordinates are plain latitude/longitude columns, which is what the journey engine
consumes. Move to a PostGIS PointField with a GiST index once nearby search needs it at scale.
"""
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models
from django.db.models import F, Q


class VerificationStatus(models.TextChoices):
    # Weakest to strongest. "estimated" and "community" display as estimated, the rest as verified.
    ESTIMATED = "estimated", "Estimated"
    COMMUNITY = "community", "Community submitted"
    OPERATOR = "operator", "Operator provided"
    FIELD_VERIFIED = "field_verified", "Field verified"
    OFFICIAL = "official", "Official"


VERIFIED_STATUSES = {
    VerificationStatus.OPERATOR,
    VerificationStatus.FIELD_VERIFIED,
    VerificationStatus.OFFICIAL,
}


class Provenance(models.Model):
    status = models.CharField(
        max_length=16, choices=VerificationStatus.choices, default=VerificationStatus.ESTIMATED
    )
    source = models.CharField(max_length=255, blank=True, help_text="Where this data came from.")
    source_url = models.URLField(blank=True)
    last_verified_at = models.DateTimeField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True

    @property
    def display_label(self):
        return "verified" if self.status in VERIFIED_STATUSES else "estimated"


class Stop(Provenance):
    name = models.CharField(max_length=120)
    area = models.CharField(max_length=120, blank=True)
    latitude = models.FloatField(validators=[MinValueValidator(-90), MaxValueValidator(90)])
    longitude = models.FloatField(validators=[MinValueValidator(-180), MaxValueValidator(180)])

    class Meta:
        ordering = ["name"]
        indexes = [models.Index(fields=["latitude", "longitude"], name="transit_stop_latlng_idx")]
        constraints = [
            models.UniqueConstraint(fields=["name", "area"], name="transit_stop_unique_name_area"),
        ]

    def __str__(self):
        return f"{self.name} ({self.area})" if self.area else self.name


class Route(Provenance):
    class Mode(models.TextChoices):
        BUS = "bus", "Bus"
        BRT = "brt", "BRT"
        RAIL = "rail", "Rail"
        FERRY = "ferry", "Ferry"

    name = models.CharField(max_length=160, unique=True)
    mode = models.CharField(max_length=8, choices=Mode.choices)
    operator = models.CharField(max_length=120, blank=True)
    headway_minutes = models.PositiveSmallIntegerField(
        null=True, blank=True, help_text="Typical minutes between vehicles. Blank if unknown."
    )
    stops = models.ManyToManyField(Stop, through="RouteStop", related_name="routes")

    class Meta:
        ordering = ["name"]
        indexes = [models.Index(fields=["mode", "is_active"], name="transit_route_mode_idx")]

    def __str__(self):
        return self.name


class RouteStop(models.Model):
    route = models.ForeignKey(Route, on_delete=models.CASCADE, related_name="route_stops")
    stop = models.ForeignKey(Stop, on_delete=models.PROTECT, related_name="route_stops")
    position = models.PositiveSmallIntegerField(help_text="Order along the route, starting at 1.")
    minutes_from_prev = models.PositiveSmallIntegerField(
        null=True, blank=True, help_text="Ride minutes from the previous stop. Blank if unknown."
    )

    class Meta:
        ordering = ["route", "position"]
        constraints = [
            models.UniqueConstraint(fields=["route", "position"], name="transit_routestop_unique_position"),
            models.UniqueConstraint(fields=["route", "stop"], name="transit_routestop_unique_stop"),
        ]

    def __str__(self):
        return f"{self.route} #{self.position}: {self.stop}"


class Fare(Provenance):
    """A naira fare range. Both stops blank means a flat fare for the whole route."""

    route = models.ForeignKey(Route, on_delete=models.CASCADE, related_name="fares")
    from_stop = models.ForeignKey(Stop, null=True, blank=True, on_delete=models.PROTECT, related_name="+")
    to_stop = models.ForeignKey(Stop, null=True, blank=True, on_delete=models.PROTECT, related_name="+")
    min_ngn = models.PositiveIntegerField()
    max_ngn = models.PositiveIntegerField()
    effective_from = models.DateField(null=True, blank=True)

    class Meta:
        ordering = ["route", "id"]
        constraints = [
            models.CheckConstraint(condition=Q(max_ngn__gte=F("min_ngn")), name="transit_fare_max_gte_min"),
            models.CheckConstraint(
                condition=(
                    Q(from_stop__isnull=True, to_stop__isnull=True)
                    | Q(from_stop__isnull=False, to_stop__isnull=False)
                ),
                name="transit_fare_both_or_no_stops",
            ),
        ]

    def __str__(self):
        return f"{self.route}: N{self.min_ngn}-{self.max_ngn}"
