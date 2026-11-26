"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { ArrowRight, LockKeyhole } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        credentials: "same-origin",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.detail ?? "Login failed.");
      }

      router.replace("/journeys");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to sign in."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="km-background flex min-h-[calc(100dvh-3.5rem)] items-center justify-center px-4 py-10">
      <div className="km-surface w-full max-w-md rounded-2xl border border-slate-500/20 p-7 shadow-xl">
        <div className="mb-6 flex size-12 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400">
          <LockKeyhole size={25} />
        </div>

        <h1 className="text-3xl font-bold">Welcome back</h1>
        <p className="km-muted mt-2 text-sm">
          Sign in to your KILOMETER account to plan your journeys.
        </p>

        <form onSubmit={handleSubmit} className="mt-7 space-y-5">
          <div>
            <label htmlFor="email" className="mb-2 block text-sm font-medium">
              Email address
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-xl border border-slate-500/40 bg-transparent px-4 py-3 outline-none focus:border-emerald-500"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-2 block text-sm font-medium">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-xl border border-slate-500/40 bg-transparent px-4 py-3 outline-none focus:border-emerald-500"
              placeholder="Enter your password"
            />
          </div>

          {error && (
            <p role="alert" className="text-sm text-red-400">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-3 font-semibold text-slate-950 disabled:opacity-60"
          >
            {loading ? "Signing in..." : "Sign in"}
            {!loading && <ArrowRight size={18} />}
          </button>
        </form>


        <div className="mt-5">
          <Link
            href="/"
            className="km-surface flex w-full items-center justify-center rounded-xl border border-slate-500/30 px-4 py-3 font-semibold transition hover:border-emerald-500"
          >
            Continue as Guest
          </Link>

          <p className="km-muted mt-3 text-center text-xs">
            Explore KILOMETER without signing in.
          </p>
        </div>

        <p className="km-muted mt-6 text-center text-sm">
          New to KILOMETER?{" "}
          <Link href="/register" className="font-semibold text-emerald-400">
            Create an account
          </Link>
        </p>
      </div>
    </main>
  );
}
