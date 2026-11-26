from django.contrib import admin

from .models import Fare, Route, RouteStop, Stop


class RouteStopInline(admin.TabularInline):
    model = RouteStop
    extra = 0
    autocomplete_fields = ["stop"]
    ordering = ["position"]


class FareInline(admin.TabularInline):
    model = Fare
    extra = 0
    autocomplete_fields = ["from_stop", "to_stop"]
    fields = ("from_stop", "to_stop", "min_ngn", "max_ngn", "status", "source", "last_verified_at", "is_active")


@admin.register(Stop)
class StopAdmin(admin.ModelAdmin):
    list_display = ("name", "area", "latitude", "longitude", "status", "last_verified_at", "is_active")
    list_filter = ("status", "is_active", "area")
    search_fields = ("name", "area")


@admin.register(Route)
class RouteAdmin(admin.ModelAdmin):
    list_display = ("name", "mode", "operator", "headway_minutes", "status", "last_verified_at", "is_active")
    list_filter = ("mode", "status", "is_active")
    search_fields = ("name", "operator")
    inlines = [RouteStopInline, FareInline]


@admin.register(Fare)
class FareAdmin(admin.ModelAdmin):
    list_display = ("route", "from_stop", "to_stop", "min_ngn", "max_ngn", "status", "last_verified_at")
    list_filter = ("status", "route__mode")
    search_fields = ("route__name",)
    autocomplete_fields = ["route", "from_stop", "to_stop"]
