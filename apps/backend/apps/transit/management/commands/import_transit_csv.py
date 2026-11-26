"""Import transit data from CSV files in one directory.

Files (all optional, UTF-8, with a header row), imported in this order:
  stops.csv        name, area, latitude, longitude, status, source, source_url, last_verified_at
  routes.csv       name, mode, operator, headway_minutes, status, source, source_url, last_verified_at
  route_stops.csv  route, stop, area, position, minutes_from_prev
  fares.csv        route, from_stop, from_area, to_stop, to_area, min_ngn, max_ngn, status, source,
                   source_url, last_verified_at, effective_from

Blank cells mean unknown. status defaults to "estimated". Rows are matched by name (stops by name and
area), so re-running updates instead of duplicating. The whole import is one transaction: any bad row
cancels everything and the error names the file and row. Use --dry-run to check a file without saving.
"""
import csv
from pathlib import Path

from django.core.exceptions import ValidationError
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.utils.dateparse import parse_date, parse_datetime

from apps.transit.models import Fare, Route, RouteStop, Stop, VerificationStatus


class RowError(Exception):
    pass


def clean(row):
    return {(k or "").strip(): (v or "").strip() for k, v in row.items()}


def to_int(value, field):
    if value == "":
        return None
    try:
        return int(value)
    except ValueError:
        raise RowError(f"{field} must be a whole number, got {value!r}")


def to_float(value, field):
    try:
        return float(value)
    except ValueError:
        raise RowError(f"{field} must be a number, got {value!r}")


def to_datetime(value):
    if value == "":
        return None
    parsed = parse_datetime(value)
    if parsed is None:
        raise RowError(f"Bad datetime {value!r}; use e.g. 2026-11-26T09:00:00+01:00")
    return parsed


def provenance(row):
    status = row.get("status") or VerificationStatus.ESTIMATED
    if status not in VerificationStatus.values:
        raise RowError(f"status must be one of {', '.join(VerificationStatus.values)}, got {status!r}")
    return {
        "status": status,
        "source": row.get("source", ""),
        "source_url": row.get("source_url", ""),
        "last_verified_at": to_datetime(row.get("last_verified_at", "")),
    }


def find_stop(name, area):
    matches = Stop.objects.filter(name=name, area=area)
    if not matches.exists():
        raise RowError(f"Stop {name!r} (area {area!r}) not found. Add it to stops.csv first.")
    return matches.get()


def find_route(name):
    try:
        return Route.objects.get(name=name)
    except Route.DoesNotExist:
        raise RowError(f"Route {name!r} not found. Add it to routes.csv first.")


class Command(BaseCommand):
    help = "Import stops, routes, route stops and fares from CSV files in a directory."

    def add_arguments(self, parser):
        parser.add_argument("directory")
        parser.add_argument("--dry-run", action="store_true", help="Validate and report, then roll back.")

    def handle(self, *args, directory, dry_run, **options):
        base = Path(directory)
        if not base.is_dir():
            raise CommandError(f"{directory} is not a directory.")
        counts = {}
        try:
            with transaction.atomic():
                for filename, handler in (
                    ("stops.csv", self.stop),
                    ("routes.csv", self.route),
                    ("route_stops.csv", self.route_stop),
                    ("fares.csv", self.fare),
                ):
                    path = base / filename
                    if not path.exists():
                        continue
                    with path.open(newline="", encoding="utf-8-sig") as handle:
                        for number, row in enumerate(csv.DictReader(handle), start=2):
                            try:
                                handler(clean(row))
                            except (RowError, ValidationError) as error:
                                raise CommandError(f"{filename} row {number}: {self.describe(error)}")
                            counts[filename] = counts.get(filename, 0) + 1
                if dry_run:
                    transaction.set_rollback(True)
        except CommandError:
            raise
        summary = ", ".join(f"{n} {name}" for name, n in counts.items()) or "no files found"
        prefix = "Dry run OK (nothing saved): " if dry_run else "Imported: "
        self.stdout.write(self.style.SUCCESS(prefix + summary))

    @staticmethod
    def describe(error):
        return "; ".join(error.messages) if isinstance(error, ValidationError) else str(error)

    @staticmethod
    def upsert(model, lookup, values):
        """Validate before saving, so bad values give a row error instead of a database error."""
        obj = model.objects.filter(**lookup).first() or model(**lookup)
        for field, value in values.items():
            setattr(obj, field, value)
        obj.full_clean()
        obj.save()

    def stop(self, row):
        self.upsert(
            Stop,
            {"name": row["name"], "area": row.get("area", "")},
            {
                "latitude": to_float(row["latitude"], "latitude"),
                "longitude": to_float(row["longitude"], "longitude"),
                **provenance(row),
            },
        )

    def route(self, row):
        self.upsert(
            Route,
            {"name": row["name"]},
            {
                "mode": row.get("mode", ""),
                "operator": row.get("operator", ""),
                "headway_minutes": to_int(row.get("headway_minutes", ""), "headway_minutes"),
                **provenance(row),
            },
        )

    def route_stop(self, row):
        route, stop = find_route(row["route"]), find_stop(row["stop"], row.get("area", ""))
        position = to_int(row["position"], "position")
        if position is None:
            raise RowError("position is required")
        self.upsert(
            RouteStop,
            {"route": route, "stop": stop},
            {"position": position, "minutes_from_prev": to_int(row.get("minutes_from_prev", ""), "minutes_from_prev")},
        )

    def fare(self, row):
        route = find_route(row["route"])
        from_name, to_name = row.get("from_stop", ""), row.get("to_stop", "")
        if bool(from_name) != bool(to_name):
            raise RowError("Give both from_stop and to_stop, or leave both blank for a flat fare.")
        from_stop = find_stop(from_name, row.get("from_area", "")) if from_name else None
        to_stop = find_stop(to_name, row.get("to_area", "")) if to_name else None
        fare_min, fare_max = to_int(row["min_ngn"], "min_ngn"), to_int(row["max_ngn"], "max_ngn")
        if fare_min is None or fare_max is None:
            raise RowError("min_ngn and max_ngn are required. Leave the row out if the fare is unknown.")
        if fare_max < fare_min:
            raise RowError(f"max_ngn ({fare_max}) cannot be below min_ngn ({fare_min}).")
        self.upsert(
            Fare,
            {"route": route, "from_stop": from_stop, "to_stop": to_stop},
            {
                "min_ngn": fare_min,
                "max_ngn": fare_max,
                "effective_from": parse_date(row["effective_from"]) if row.get("effective_from") else None,
                **provenance(row),
            },
        )
