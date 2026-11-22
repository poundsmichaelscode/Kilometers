"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import {
  ArrowLeft,
  Globe,
  Mic,
  Send,
  X,
} from "lucide-react";

import {
  journeyOptions,
  formatDuration,
  formatFare,
} from "@/features/journeys/data";




const waveform = [14, 24, 38, 22, 48, 32, 18, 40, 27, 13, 34, 19];

export default function AssistantPage() {

  const [input, setInput] = useState("");
  const [question, setQuestion] = useState(
    "I need to get to Ikeja from Lekki. I don't want to spend too much."
  );
  const [origin, setOrigin] = useState("Lekki Phase 1");
  const [editingOrigin, setEditingOrigin] = useState(false);
  const [voiceNotice, setVoiceNotice] = useState(false);

  const isJourneyQuestion =
    /lekki|ikeja|route|journey|cheap|fare|transport/i.test(question);

  const recommended = journeyOptions.find(
    (item) => item.id === "danfo-brt"
  )!;

  const fastest = [...journeyOptions].sort(
    (a, b) => a.durationMinutes - b.durationMinutes
  )[0];

  const showJourneyCards =
    isJourneyQuestion && origin.trim().toLowerCase() === "lekki phase 1";

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!input.trim()) return;

    setQuestion(input.trim());
    setInput("");
    setVoiceNotice(false);
  }

  return (
    <div className="km-assistant min-h-screen">




      <main className="px-4 pb-10 pt-6">
        <div className="mx-auto max-w-[690px]">
          <div className="mb-5 flex items-center justify-between">
            <Link
              href="/journeys"
              aria-label="Back to journeys"
              className="km-surface flex size-11 items-center justify-center rounded-full border"
            >
              <ArrowLeft size={20} />
            </Link>

            <span className="km-muted-surface flex items-center gap-2 rounded-full px-4 py-3 text-xs font-semibold">
              <Globe size={16} />
              English
            </span>
          </div>

          <div className="mb-5 flex justify-end">
            <div className="km-muted-surface max-w-[85%] rounded-2xl rounded-br-sm px-4 py-3 text-sm leading-6 sm:max-w-[340px]">
              {question}
            </div>
          </div>

          <section aria-live="polite">
            <p className="mb-3 text-xs font-bold tracking-wider text-emerald-600">
              KILOMETER AI
            </p>

            {showJourneyCards ? (
              <>
                <h1 className="text-xl font-bold leading-7">
                  Explore four illustrative ways to travel from
                  Lekki Phase 1 to Ikeja. Danfo and BRT is the
                  lowest-cost demonstration option, around{" "}
                  {formatDuration(recommended.durationMinutes)}.
                </h1>

                <p className="km-muted mt-3 text-sm leading-6">
                  These fares and travel times are sample estimates.
                  Routes and connections have not been verified.
                </p>

                <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {[recommended, fastest].map((journey, index) => (
                    <Link
                      href="/journeys"
                      key={journey.id}
                      className={`km-surface rounded-2xl border-2 p-4 ${
                        index === 0
                          ? "!border-emerald-500"
                          : ""
                      }`}
                    >
                      <div className="mb-3 flex items-center justify-between gap-2">
                        <span className="rounded-full bg-emerald-500/15 px-2 py-1 text-[11px] font-bold text-emerald-600">
                          {index === 0 ? "Recommended" : "Fastest"}
                        </span>

                        <span className="km-muted-surface rounded-full px-2 py-1 text-[10px]">
                          Demo estimate
                        </span>
                      </div>

                      <h2 className="text-xl font-bold">
                        {formatDuration(journey.durationMinutes)}
                      </h2>

                      <p className="km-muted mt-2 text-sm">
                        {journey.mode}, {journey.transfers} transfer(s)
                      </p>

                      <p className="mt-3 text-sm font-semibold">
                        {formatFare(journey.fareMin)} to{" "}
                        {formatFare(journey.fareMax)}
                      </p>
                    </Link>
                  ))}
                </div>
              </>
            ) : (
              <div>
                <h1 className="text-xl font-semibold leading-7">
                  {showJourneyCards === false && isJourneyQuestion
                    ? "A verified journey from this starting point is not available yet."
                    : /traffic|report|accident/i.test(question)
                      ? "Open Traffic Reports to explore sample incidents or preview a report."
                      : "I can help you explore the KILOMETER journey planner and traffic reporting features."}
                </h1>

                <p className="km-muted mt-3 text-sm">
                  This is a local assistant demonstration.
                  The AI and live routing APIs are not connected.
                </p>
              </div>
            )}

            <div className="mt-5 grid grid-cols-2 gap-3">
              <Link
                href="/journeys"
                className="rounded-xl bg-[#16c47f] px-4 py-3.5 text-center text-sm font-bold text-[#101b30]"
              >
                Compare journeys
              </Link>

              <button
                type="button"
                onClick={() => setEditingOrigin(!editingOrigin)}
                className="km-surface rounded-xl border px-4 py-3.5 text-sm font-semibold"
              >
                Change start
              </button>
            </div>

            {editingOrigin && (
              <div className="km-surface mt-4 rounded-xl border p-4">
                <label
                  htmlFor="assistant-origin"
                  className="mb-2 block text-sm font-medium"
                >
                  Starting location
                </label>

                <input
                  id="assistant-origin"
                  value={origin}
                  onChange={(event) => setOrigin(event.target.value)}
                  className="km-muted-surface w-full rounded-xl border p-3 text-sm outline-none"
                />

                <button
                  type="button"
                  onClick={() => setEditingOrigin(false)}
                  className="mt-3 rounded-xl bg-[#16c47f] px-5 py-2 text-sm font-semibold text-[#101b30]"
                >
                  Confirm start
                </button>

                <p className="km-muted mt-2 text-xs">
                  Changing the start updates this preview only.
                </p>
              </div>
            )}
          </section>

          <div className="mt-10 flex flex-col items-center">
            <p className="mb-4 text-sm font-semibold text-emerald-600">
              Voice assistant preview
            </p>

            <div
              aria-hidden="true"
              className="flex h-14 items-center gap-1.5"
            >
              {waveform.map((height, index) => (
                <span
                  key={index}
                  style={{ height }}
                  className="w-1 rounded-full bg-[#16c47f]"
                />
              ))}
            </div>

            {voiceNotice && (
              <p
                role="status"
                className="km-muted mt-4 text-center text-xs"
              >
                Microphone input is not connected yet.
                Please type your question instead.
              </p>
            )}
          </div>

          <form
            onSubmit={handleSubmit}
            className="mt-6 flex items-center gap-3"
          >
            <div className="km-surface flex min-w-0 flex-1 items-center rounded-full border px-4 py-2">
              <input
                value={input}
                onChange={(event) => setInput(event.target.value)}
                maxLength={500}
                aria-label="Ask KILOMETER"
                placeholder="Type instead"
                className="min-w-0 flex-1 bg-transparent py-3 text-sm outline-none"
              />

              {input.trim() && (
                <button
                  type="submit"
                  aria-label="Send question"
                  className="p-2 text-emerald-600"
                >
                  <Send size={19} />
                </button>
              )}
            </div>

            <button
              type="button"
              aria-label="Voice input preview"
              onClick={() => setVoiceNotice(!voiceNotice)}
              className="flex size-16 shrink-0 items-center justify-center rounded-full bg-[#16c47f] text-[#101b30] ring-8 ring-emerald-500/15"
            >
              <Mic size={28} />
            </button>

            <Link
              href="/journeys"
              aria-label="Close assistant"
              className="km-surface flex size-12 shrink-0 items-center justify-center rounded-full border"
            >
              <X size={22} />
            </Link>
          </form>

          <p className="km-muted mt-6 text-center text-xs">
            Demo assistant · No live AI or microphone processing.
            Do not interact with the screen while driving.
          </p>
        </div>
      </main>


    </div>
  );
}
