"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  UserRound,
  ArrowRight,
  Route,
  LogOut,
} from "lucide-react";

type User = {
  id: string | number;
  email: string;
  first_name?: string;
  last_name?: string;
};

type Session = {
  authenticated: boolean;
  user: User | null;
};

export default function ProfilePage() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    async function loadSession() {
      try {
        const response = await fetch("/api/auth/session", {
          cache: "no-store",
          credentials: "same-origin",
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(
            "Unable to verify your account session."
          );
        }

        const session = (await response.json()) as Session;

        if (!controller.signal.aborted) {
          setUser(
            session.authenticated ? session.user : null
          );
        }
      } catch {
        if (!controller.signal.aborted) {
          setError(
            "Unable to load your profile. Please retry."
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void loadSession();

    return () => controller.abort();
  }, []);

  async function handleLogout() {
    setSigningOut(true);
    setError("");

    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "same-origin",
      });

      if (!response.ok) {
        throw new Error("Sign out failed.");
      }

      setUser(null);
      router.replace("/login");
      router.refresh();
    } catch {
      setError("Unable to sign out. Please retry.");
    } finally {
      setSigningOut(false);
    }
  }

  const name = user
    ? [user.first_name, user.last_name]
        .filter(Boolean)
        .join(" ") || "KILOMETER Member"
    : "";

  return (
    <main className="km-background min-h-screen px-5 py-10">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-3xl font-bold">Profile</h1>

        <div className="km-surface mt-8 rounded-2xl border p-7">
          <div className="mb-5 flex size-14 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400">
            <UserRound size={28} />
          </div>

          {loading ? (
            <p className="km-muted">Loading your profile...</p>
          ) : error ? (
            <div>
              <h2 className="text-xl font-semibold">
                Profile unavailable
              </h2>
              <p role="alert" className="mt-3 text-red-400">
                {error}
              </p>
              <button
                onClick={() => window.location.reload()}
                className="mt-5 rounded-xl bg-emerald-500 px-5 py-3 font-semibold text-slate-950"
              >
                Retry
              </button>
            </div>
          ) : user ? (
            <>
              <h2 className="text-xl font-semibold">
                Welcome, {name}
              </h2>

              <p className="km-muted mt-3">
                You are signed in to KILOMETER.
              </p>

              <div className="mt-6 rounded-xl border border-slate-500/20 p-4">
                <p className="km-muted text-xs">
                  Email address
                </p>
                <p className="mt-1 break-all font-medium">
                  {user.email}
                </p>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href="/journeys"
                  className="rounded-xl bg-emerald-500 px-5 py-3 font-semibold text-slate-950"
                >
                  Plan a journey
                </Link>

                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={signingOut}
                  className="flex items-center gap-2 rounded-xl border border-slate-500/30 px-5 py-3 font-semibold disabled:opacity-60"
                >
                  <LogOut size={18} />
                  {signingOut ? "Signing out..." : "Sign out"}
                </button>
              </div>
            </>
          ) : (
            <>
              <h2 className="text-xl font-semibold">
                Exploring as a guest
              </h2>

              <p className="km-muted mt-3 text-sm leading-6">
                You can explore Lagos, compare journeys and
                view road information without an account.
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
            </>
          )}
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
