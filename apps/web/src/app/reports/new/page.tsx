"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, MapPin } from "lucide-react";
import {
  incidentTypes,
  type IncidentType,
} from "@/features/traffic/data";

export default function NewReportPage() {
  const [selected, setSelected] =
    useState<IncidentType>("accident");

  const [description, setDescription] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const selectedType = incidentTypes.find(
    (item) => item.id === selected
  );

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
  }

  return (
    <main className="min-h-screen km-background px-4 py-10">
      <div className="mx-auto max-w-2xl">
        <div className="mb-6 flex items-center gap-4">
          <Link
            href="/reports"
            aria-label="Back to reports"
            className="rounded-full border border-slate-200 km-surface p-3"
          >
            <ArrowLeft size={20} />
          </Link>

          <h1 className="text-2xl font-bold">
            Report an incident
          </h1>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-6 flex items-center gap-3 rounded-xl border border-slate-200 km-surface p-4">
            <div className="rounded-lg bg-emerald-100 p-3 text-emerald-600">
              <MapPin size={19} />
            </div>

            <div>
              <p className="font-semibold">
                Lekki–Epe Expressway
              </p>
              <p className="text-xs km-muted">
                Demonstration location — GPS not enabled
              </p>
            </div>
          </div>

          <h2 className="mb-4 font-semibold">
            What do you see?
          </h2>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {incidentTypes.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setSelected(item.id);
                  setSubmitted(false);
                }}
                className={`flex min-h-16 items-center gap-2 rounded-xl border p-3 text-left text-sm font-semibold ${
                  selected === item.id
                    ? "border-emerald-500 bg-emerald-50"
                    : "border-slate-200 km-surface"
                }`}
              >
                <span
                  className="size-3 shrink-0 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                {item.label}
              </button>
            ))}
          </div>

          <label
            htmlFor="report-detail"
            className="mb-2 mt-6 block text-sm font-semibold"
          >
            Add a detail (optional)
          </label>

          <input
            id="report-detail"
            value={description}
            onChange={(event) => {
              setDescription(event.target.value);
              setSubmitted(false);
            }}
            maxLength={300}
            placeholder="For example: right lane blocked"
            className="w-full rounded-xl border border-slate-300 km-surface px-4 py-4 outline-none focus:border-emerald-500"
          />

          <div className="mt-5 rounded-xl bg-amber-50 p-4 text-sm text-amber-900">
            <strong>How your report is used</strong>
            <p className="mt-1">
              Reports will be checked for duplicate or
              misleading information and community confirmation.
            </p>
          </div>

          <button
            type="submit"
            className="mt-5 w-full rounded-xl bg-emerald-500 px-5 py-4 font-bold text-slate-950"
          >
            Preview report: {selectedType?.label}
          </button>

          {submitted && (
            <div
              role="status"
              className="mt-4 rounded-xl border border-emerald-300 bg-emerald-50 p-4 text-sm"
            >
              <strong>Report preview created</strong>
              <p className="mt-2">
                Type: {selectedType?.label}
              </p>
              <p className="mt-1">
                Detail: {description || "None provided"}
              </p>
              <p className="mt-2 text-amber-800">
                Not submitted. The traffic API is not connected.
              </p>
            </div>
          )}

          <p className="mt-4 text-center text-xs km-muted">
            Do not report while driving.
          </p>
        </form>
      </div>
    </main>
  );
}
