"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowLeft,
  ChevronRight,
  MapPin,
  Navigation,
  X,
} from "lucide-react";

import {
  formatDuration,
  formatFare,
  journeyFilters,
  sortJourneys,
  type JourneyFilter,
} from "@/features/journeys/data";

const MapPanel = dynamic(
  () => import("@/components/journeys/MapPanel"),
  { ssr: false }
);


export default function JourneysPage() {
  const [filter, setFilter] =
    useState<JourneyFilter>("recommended");
  const [selectedId, setSelectedId] = useState("danfo-brt");
  const [showDetails, setShowDetails] = useState(false);


  const options = useMemo(
    () => sortJourneys(filter),
    [filter]
  );

  const selected =
    options.find((journey) => journey.id === selectedId) ??
    options[0];

  function changeFilter(next: JourneyFilter) {
    const sorted = sortJourneys(next);
    setFilter(next);
    setSelectedId(sorted[0].id);
    setShowDetails(false);
  }

  return (
    <div
      className="km-background min-h-screen"
    >


      <div className="flex min-h-[calc(100dvh-3.5rem)]">


        <main className="flex min-w-0 flex-1 flex-col lg:flex-row">
          <section className="w-full shrink-0 border-b border-slate-500/20 p-4 lg:w-[370px] lg:overflow-y-auto lg:border-r lg:border-b-0 xl:w-[390px]">
            <h1 className="mb-4 text-2xl font-bold">Journeys</h1>

            <div className="rounded-xl border border-slate-500/30 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <span className="size-2 rounded-full bg-blue-500" />
                Lekki Phase 1
              </div>

              <div className="ml-[3px] h-5 border-l border-dashed border-slate-400" />

              <div className="flex items-center gap-2 text-sm font-semibold">
                <span className="size-2 rounded-sm bg-slate-400" />
                Ikeja
              </div>

              <p className="mt-2 text-xs km-muted">
                Departure: Leave now · Demo journey
              </p>
            </div>

            <div className="my-4 flex flex-wrap gap-2">
              {journeyFilters.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => changeFilter(item.id)}
                  className={`shrink-0 rounded-full border px-3 py-2 text-xs font-semibold ${
                    filter === item.id
                      ? "border-emerald-500 bg-emerald-500 text-slate-950"
                      : "border-slate-500/30 hover:border-emerald-500"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <div className="space-y-3">
              {options.map((journey) => {
                const active = selected.id === journey.id;

                return (
                  <button
                    key={journey.id}
                    type="button"
                    onClick={() => {
                      setSelectedId(journey.id);
                      setShowDetails(false);
                    }}
                    className={`w-full rounded-xl border p-4 text-left transition ${
                      active
                        ? "border-emerald-500 bg-emerald-500/10"
                        : "km-surface border-slate-500/30 hover:border-emerald-500/70"
                    }`}
                  >
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <span className="rounded-full bg-emerald-500/15 px-2 py-1 text-xs text-emerald-400">
                        {journey.badge}
                      </span>
                      <span className="text-xs km-muted">
                        Demo estimate
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <strong className="text-xl">
                        {formatDuration(
                          journey.durationMinutes
                        )}
                      </strong>
                      <strong className="text-sm">
                        {formatFare(journey.fareMin)} –{" "}
                        {formatFare(journey.fareMax)}
                      </strong>
                    </div>

                    <p className="mt-2 text-sm opacity-80">
                      {journey.mode}
                    </p>

                    <p className="mt-1 text-xs km-muted">
                      {journey.transfers} transfers ·{" "}
                      {journey.walkingMeters} m walking ·{" "}
                      {journey.distanceKm} km
                    </p>
                  </button>
                );
              })}
            </div>

            <p className="my-4 text-xs leading-5 km-muted">
              Sample data only. Fares, travel times and
              connections have not been verified.
            </p>

            <button
              type="button"
              onClick={() => setShowDetails(true)}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-4 font-semibold text-slate-950 hover:bg-emerald-400"
            >
              View route: {selected.mode}
              <ChevronRight size={18} />
            </button>

            {showDetails && (
              <div className="mt-4 rounded-xl border border-emerald-500/40 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="font-semibold">
                    Illustrative route steps
                  </h2>
                  <button
                    type="button"
                    onClick={() => setShowDetails(false)}
                    aria-label="Close route details"
                  >
                    <X size={18} />
                  </button>
                </div>

                <ol className="space-y-3">
                  {selected.steps.map((step, index) => (
                    <li
                      key={`${selected.id}-${index}`}
                      className="flex items-start gap-3 text-sm"
                    >
                      <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-xs text-slate-950">
                        {index + 1}
                      </span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>

                <p className="mt-4 text-xs text-amber-400">
                  Navigation is not active. Awaiting verified
                  journey geometry from the backend.
                </p>
              </div>
            )}
          </section>

          <section className="relative min-w-0 flex-1 p-3">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm">
                <MapPin size={17} className="text-emerald-400" />
                Lagos route map
              </div>
              <span className="rounded-full bg-amber-500/15 px-3 py-1 text-xs text-amber-400">
                Demonstration
              </span>
            </div>

            <MapPanel />

            <p className="mt-2 text-xs km-muted">
              Actual road geometry and navigation will be
              displayed after the journey API is connected.
            </p>

            <Link
              href="/"
              className="mt-4 inline-flex items-center gap-2 text-sm text-emerald-400"
            >
              <ArrowLeft size={16} />
              Back to Home
            </Link>

            <Link
              href="/reports"
              className="ml-6 inline-flex items-center gap-2 text-sm text-emerald-400"
            >
              Reports <Navigation size={16} />
            </Link>
          </section>
        </main>
      </div>
    </div>
  );
}
