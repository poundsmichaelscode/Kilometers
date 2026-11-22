"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useState } from "react";

import {
  AlertTriangle,
  CheckCircle2,
  MapPin,
  Plus,
  ChevronRight,
} from "lucide-react";

import {
  incidentTypes,
  sampleReports,
} from "@/features/traffic/data";

const TrafficMap = dynamic(
  () => import("@/components/traffic/TrafficMap"),
  { ssr: false }
);

export default function ReportsPage() {
  const [selectedId, setSelectedId] =
    useState<string | null>(null);

  const [filter, setFilter] = useState("all");

  const [votes, setVotes] = useState<
    Record<string, "still" | "cleared">
  >({});

  const reports = sampleReports.filter(
    (report) => filter === "all" || report.type === filter
  );

  return (
    <main className="km-background flex min-h-[calc(100dvh-56px)] flex-col lg:flex-row">
      <section className="w-full shrink-0 border-r border-slate-500/20 p-4 lg:w-[380px] xl:w-[400px]">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">
              Live reports
            </h1>

            <p className="km-muted mt-1 text-xs">
              Sample road conditions around Lagos
            </p>
          </div>

          <AlertTriangle
            size={25}
            className="text-emerald-500"
          />
        </div>

        <Link
          href="/reports/new"
          className="mb-5 flex items-center justify-center gap-2 rounded-xl bg-[#16c47f] p-4 text-sm font-bold text-[#101b30]"
        >
          <Plus size={19} />
          Report an incident
        </Link>

        <div className="km-surface mb-4 rounded-xl border p-4">
          <p className="text-sm font-semibold">
            Community traffic reports
          </p>

          <p className="km-muted mt-2 text-xs">
            {sampleReports.length} demonstration incidents
          </p>
        </div>

        <label
          htmlFor="incident-filter"
          className="mb-2 block text-xs font-medium"
        >
          Filter incidents
        </label>

        <select
          id="incident-filter"
          value={filter}
          onChange={(event) =>
            setFilter(event.target.value)
          }
          className="km-surface mb-5 w-full rounded-xl border p-3 text-sm"
        >
          <option value="all">All incidents</option>

          {incidentTypes.map((item) => (
            <option key={item.id} value={item.id}>
              {item.label}
            </option>
          ))}
        </select>

        <div className="space-y-3">
          {reports.map((report) => {
            const incident = incidentTypes.find(
              (item) => item.id === report.type
            );

            return (
              <article
                key={report.id}
                className={`km-surface rounded-xl border p-4 ${
                  selectedId === report.id
                    ? "!border-emerald-500"
                    : ""
                }`}
              >
                <button
                  type="button"
                  onClick={() => setSelectedId(report.id)}
                  className="flex w-full items-start gap-3 text-left"
                >
                  <div
                    className="rounded-xl p-3"
                    style={{
                      backgroundColor: `${incident?.color}20`,
                      color: incident?.color,
                    }}
                  >
                    <AlertTriangle size={20} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <h2 className="text-sm font-bold">
                      {incident?.label}
                    </h2>

                    <p className="km-muted mt-2 flex items-start gap-1 text-xs">
                      <MapPin
                        size={14}
                        className="shrink-0"
                      />
                      {report.location}
                    </p>

                    <p className="km-muted mt-2 text-xs">
                      {report.description}
                    </p>
                  </div>

                  <ChevronRight
                    size={17}
                    className="km-muted shrink-0"
                  />
                </button>

                <div className="mt-4 flex items-center justify-between">
                  <span className="km-muted text-xs">
                    {report.confirmations} sample confirmations
                  </span>

                  <span className="rounded-full bg-amber-500/10 px-2 py-1 text-[10px] font-semibold text-amber-600">
                    Demo
                  </span>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    aria-pressed={votes[report.id] === "still"}
                    onClick={() =>
                      setVotes((previous) => ({
                        ...previous,
                        [report.id]: "still",
                      }))
                    }
                    className={`rounded-lg border p-2.5 text-xs font-medium ${
                      votes[report.id] === "still"
                        ? "border-emerald-500 text-emerald-500"
                        : "border-slate-500/30"
                    }`}
                  >
                    Still there
                  </button>

                  <button
                    type="button"
                    aria-pressed={votes[report.id] === "cleared"}
                    onClick={() =>
                      setVotes((previous) => ({
                        ...previous,
                        [report.id]: "cleared",
                      }))
                    }
                    className={`flex items-center justify-center gap-1 rounded-lg border p-2.5 text-xs font-medium ${
                      votes[report.id] === "cleared"
                        ? "border-emerald-500 text-emerald-500"
                        : "border-slate-500/30"
                    }`}
                  >
                    <CheckCircle2 size={14} />
                    Cleared
                  </button>
                </div>
              </article>
            );
          })}

          {reports.length === 0 && (
            <div className="km-surface rounded-xl border p-5 text-center">
              <p className="text-sm font-medium">
                No sample incidents in this category
              </p>
            </div>
          )}
        </div>

        <p className="km-muted mt-5 text-xs leading-5">
          Demo reports only. Confirmations are not sent
          to the server. The map displays approximate
          demonstration locations.
        </p>
      </section>

      <section className="min-w-0 flex-1 p-3">
        <TrafficMap selectedId={selectedId} />
      </section>
    </main>
  );
}
