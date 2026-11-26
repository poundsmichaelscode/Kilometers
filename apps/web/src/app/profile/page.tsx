import Link from "next/link";
import { UserRound, ArrowRight, Route } from "lucide-react";

export default function ProfilePage() {
  return (
    <main className="km-background min-h-screen px-5 py-10">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-3xl font-bold">Profile</h1>

        <div className="km-surface mt-8 rounded-2xl border p-7">
          <div className="mb-5 flex size-14 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400">
            <UserRound size={28} />
          </div>

          <h2 className="text-xl font-semibold">
            Exploring as a guest
          </h2>

          <p className="km-muted mt-3 text-sm leading-6">
            You can explore Lagos, compare journeys and view
            road information without creating an account.
          </p>

          <p className="km-muted mt-3 text-sm">
            Create an account when you want to save
            your preferences and personal journeys.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/login"
              className="rounded-xl bg-emerald-500 px-5 py-3 font-semibold text-slate-950"
            >
              Sign in
            </Link>

            <Link
              href="/register"
              className="rounded-xl border border-slate-500/30 px-5 py-3 font-semibold"
            >
              Create account
            </Link>
          </div>
        </div>

        <Link
          href="/journeys"
          className="mt-6 inline-flex items-center gap-2 text-emerald-400"
        >
          <Route size={18} />
          Continue planning journeys
          <ArrowRight size={18} />
        </Link>
      </div>
    </main>
  );
}
