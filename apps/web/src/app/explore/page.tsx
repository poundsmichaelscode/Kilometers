"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  Compass,
  MapPin,
  Search,
  Route,
  ArrowRight,
} from "lucide-react";

const locations = [
  { name: "Lekki Phase 1", area: "Lekki" },
  { name: "Victoria Island", area: "Lagos Island" },
  { name: "Ikeja", area: "Ikeja" },
  { name: "Yaba", area: "Lagos Mainland" },
  { name: "Surulere", area: "Lagos Mainland" },
  { name: "Ajah", area: "Eti-Osa" },
  { name: "Ikorodu", area: "Ikorodu" },
  { name: "Marina", area: "Lagos Island" },
];

export default function ExplorePage() {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    return locations.filter((location) =>
      `${location.name} ${location.area}`
        .toLowerCase()
        .includes(query)
    );
  }, [search]);

  return (
    <main className="km-background min-h-screen px-5 py-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <div className="mb-3 flex items-center gap-2 text-emerald-400">
            <Compass size={20} />
            Explore Lagos
          </div>

          <h1 className="text-3xl font-bold md:text-4xl">
            Where would you like to go?
          </h1>

          <p className="km-muted mt-3">
            Discover popular areas and explore journey planning.
            No account required.
          </p>
        </div>

        <div className="km-surface rounded-2xl border p-5">
          <label
            htmlFor="location-search"
            className="mb-3 block font-semibold"
          >
            Search locations
          </label>

          <div className="flex items-center gap-3 rounded-xl border border-slate-500/30 px-4">
            <Search size={20} className="text-emerald-400" />

            <input
              id="location-search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search Lekki, Ikeja, Yaba..."
              className="w-full bg-transparent py-4 outline-none"
            />
          </div>
        </div>

        <section className="mt-8">
          <h2 className="mb-5 text-xl font-bold">
            Explore locations
          </h2>

          {filtered.length === 0 ? (
            <div className="km-surface rounded-xl border p-6">
              <p>No matching locations in the current MVP directory.</p>
              <button
                type="button"
                onClick={() => setSearch("")}
                className="mt-3 text-emerald-400"
              >
                Clear search
              </button>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filtered.map((location) => (
                <button
                  key={location.name}
                  type="button"
                  onClick={() => setSelected(location.name)}
                  aria-pressed={selected === location.name}
                  className={`km-surface rounded-2xl border p-5 text-left transition hover:border-emerald-500 ${
                    selected === location.name
                      ? "border-emerald-500"
                      : ""
                  }`}
                >
                  <div className="mb-4 flex size-11 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400">
                    <MapPin size={22} />
                  </div>

                  <h3 className="text-lg font-semibold">
                    {location.name}
                  </h3>

                  <p className="km-muted mt-2 text-sm">
                    {location.area}
                  </p>
                </button>
              ))}
            </div>
          )}
        </section>

        {selected && (
          <section className="km-surface mt-8 rounded-2xl border p-6">
            <h2 className="text-xl font-semibold">{selected}</h2>

            <p className="km-muted mt-2">
              Location selected. Live route planning for arbitrary
              destinations is still being integrated.
            </p>

            <Link
              href="/journeys"
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 font-semibold text-slate-950"
            >
              <Route size={18} />
              View sample journey planner
              <ArrowRight size={18} />
            </Link>
          </section>
        )}

        <p className="km-muted mt-8 text-xs">
          This directory is a demonstration. Live place search,
          transit data and navigation are not yet connected.
        </p>
      </div>
    </main>
  );
}
