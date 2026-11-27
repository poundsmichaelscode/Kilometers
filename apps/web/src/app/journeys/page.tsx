"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import {
  ArrowLeft,
  ChevronRight,
  MapPin,
  Navigation,
} from "lucide-react";

const MapPanel = dynamic(
  () => import("@/components/journeys/MapPanel"),
  { ssr: false }
);

const locations = [
  { name: "Lekki Phase 1", lat: 6.4478, lng: 3.4723 },
  { name: "CMS", lat: 6.4505, lng: 3.3920 },
  { name: "Yaba", lat: 6.5095, lng: 3.3711 },
  { name: "Oshodi", lat: 6.5568, lng: 3.3446 },
  { name: "Ikeja", lat: 6.6018, lng: 3.3515 },
];

type Fare = { min: number; max: number } | null;

type JourneyOption = {
  id: string;
  modes: string[];
  total_minutes: number;
  walk_meters: number;
  distance_km: number;
  transfers: number;
  fare_ngn: Fare;
  confidence: string;
  display_label: string;
  tags: string[];
  steps: string[];
  notes: string[];
};

type ComparisonResponse = {
  options: JourneyOption[];
  notes: string[];
};

const formatMoney = (value: number) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(value);

function fareLabel(fare: Fare) {
  if (!fare) return "Fare unavailable";

  return `${formatMoney(fare.min)} – ${formatMoney(fare.max)}`;
}

export default function JourneysPage() {
  const [origin, setOrigin] = useState("Lekki Phase 1");
  const [destination, setDestination] = useState("Ikeja");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] =
    useState<ComparisonResponse | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(
    null
  );

  const selected = result?.options.find(
    (option) => option.id === selectedId
  );

  async function compare(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setResult(null);
    setSelectedId(null);

    if (origin === destination) {
      setError("Choose two different locations.");
      return;
    }

    const from = locations.find((p) => p.name === origin);
    const to = locations.find((p) => p.name === destination);

    if (!from || !to) {
      setError("Please choose valid locations.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/journeys/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          origin: {
            lat: from.lat,
            lng: from.lng,
            label: from.name,
          },
          destination: {
            lat: to.lat,
            lng: to.lng,
            label: to.name,
          },
        }),
      });

      const data: unknown = await response.json();

      if (!response.ok) {
        const detail =
          typeof data === "object" &&
          data !== null &&
          "detail" in data &&
          typeof data.detail === "string"
            ? data.detail
            : "Journey comparison is unavailable.";

        throw new Error(detail);
      }

      if (
        typeof data !== "object" ||
        data === null ||
        !("options" in data) ||
        !Array.isArray(data.options) ||
        !("notes" in data) ||
        !Array.isArray(data.notes)
      ) {
        throw new Error("Unexpected journey API response.");
      }

      const comparison = data as ComparisonResponse;
      setResult(comparison);
      setSelectedId(comparison.options[0]?.id ?? null);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to compare journeys."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="km-background min-h-screen p-4 md:p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">
            Plan your journey
          </h1>
          <p className="km-muted mt-2">
            Compare transport options without signing in.
          </p>
        </div>

        <div className="grid gap-5 lg:grid-cols-[390px_minmax(0,1fr)]">
          <section className="space-y-5">
            <form
              onSubmit={compare}
              className="km-surface space-y-4 rounded-2xl border border-slate-500/30 p-5"
            >
              <div>
                <label
                  htmlFor="journey-origin"
                  className="mb-2 block font-medium"
                >
                  From
                </label>
                <select
                  id="journey-origin"
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value)}
                  className="w-full rounded-xl border border-slate-500/40 bg-slate-900 px-4 py-3 text-white"
                >
                  {locations.map((p) => (
                    <option key={p.name} value={p.name}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="journey-destination"
                  className="mb-2 block font-medium"
                >
                  To
                </label>
                <select
                  id="journey-destination"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  className="w-full rounded-xl border border-slate-500/40 bg-slate-900 px-4 py-3 text-white"
                >
                  {locations.map((p) => (
                    <option key={p.name} value={p.name}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-3 font-semibold text-slate-950 disabled:opacity-60"
              >
                {loading ? "Comparing..." : "Compare journeys"}
                {!loading && <ChevronRight size={18} />}
              </button>
            </form>

            {error && (
              <div
                role="alert"
                className="rounded-xl border border-red-500/30 p-4 text-sm text-red-400"
              >
                {error}
              </div>
            )}

            {result && (
              <section aria-live="polite">
                <h2 className="mb-3 text-xl font-semibold">
                  Journey options
                </h2>

                {result.options.length === 0 ? (
                  <div className="km-surface rounded-xl border p-5">
                    No journey options were found for this pair.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {result.options.map((option) => (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => setSelectedId(option.id)}
                        aria-pressed={selectedId === option.id}
                        className={`km-surface w-full rounded-xl border p-4 text-left ${
                          selectedId === option.id
                            ? "border-emerald-500"
                            : "border-slate-500/30"
                        }`}
                      >
                        <div className="mb-2 flex flex-wrap gap-2">
                          {option.tags.map((tag) => (
                            <span
                              key={tag}
                              className="rounded-full bg-emerald-500/15 px-2 py-1 text-xs text-emerald-400"
                            >
                              {tag}
                            </span>
                          ))}
                          <span className="rounded-full bg-amber-500/15 px-2 py-1 text-xs text-amber-400">
                            {option.display_label}
                          </span>
                        </div>

                        <div className="flex items-center justify-between gap-3">
                          <strong className="text-xl">
                            {option.total_minutes} min
                          </strong>
                          <strong className="text-sm">
                            {fareLabel(option.fare_ngn)}
                          </strong>
                        </div>

                        <p className="mt-2 capitalize">
                          {option.modes.join(" + ")}
                        </p>

                        <p className="km-muted mt-2 text-xs">
                          {option.transfers} transfers ·{" "}
                          {option.walk_meters} m walking ·{" "}
                          {option.distance_km} km
                        </p>
                      </button>
                    ))}
                  </div>
                )}

                {result.notes.length > 0 && (
                  <div className="mt-4 rounded-xl border border-amber-500/30 p-4 text-sm">
                    <strong>Data limitations</strong>
                    {result.notes.map((note, i) => (
                      <p key={i} className="km-muted mt-2">
                        {note}
                      </p>
                    ))}
                  </div>
                )}
              </section>
            )}
          </section>

          <section className="min-w-0 space-y-4">
            <div className="km-surface rounded-2xl border border-slate-500/30 p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="flex items-center gap-2 font-semibold">
                  <MapPin size={18} />
                  Lagos map
                </span>
                <span className="text-xs text-amber-400">
                  Demonstration
                </span>
              </div>

              <MapPanel />
            </div>

            {selected && (
              <section className="km-surface rounded-2xl border border-slate-500/30 p-5">
                <h2 className="mb-4 text-xl font-semibold">
                  Route instructions
                </h2>

                <ol className="space-y-3">
                  {selected.steps.map((step, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-xs text-slate-950">
                        {i + 1}
                      </span>
                      <span className="text-sm">{step}</span>
                    </li>
                  ))}
                </ol>

                {selected.notes.map((note, i) => (
                  <p key={i} className="mt-3 text-xs text-amber-400">
                    {note}
                  </p>
                ))}

                <p className="mt-4 text-xs text-amber-400">
                  This is an estimated journey, not live
                  turn-by-turn navigation.
                </p>
              </section>
            )}

            <nav className="flex flex-wrap gap-5 text-sm text-emerald-400">
              <Link href="/" className="flex items-center gap-2">
                <ArrowLeft size={16} />
                Home
              </Link>
              <Link
                href="/explore"
                className="flex items-center gap-2"
              >
                <Navigation size={16} />
                Explore
              </Link>
            </nav>
          </section>
        </div>
      </div>
    </main>
  );
}
