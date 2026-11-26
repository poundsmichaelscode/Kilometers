"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { ArrowRight, UserPlus } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ email, password }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.detail ?? "Registration failed.");
      }

      router.push("/login?registered=1");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to create your account."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="km-background flex min-h-[calc(100dvh-3.5rem)] items-center justify-center px-4 py-10">
      <div className="km-surface w-full max-w-md rounded-2xl border border-slate-500/20 p-7 shadow-xl">
        <div className="mb-6 flex size-12 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400">
          <UserPlus size={25} />
        </div>

        <h1 className="text-3xl font-bold">
          Join KILOMETER
        </h1>

        <p className="km-muted mt-2 text-sm">
          Create an account to access journey planning across Lagos.
        </p>

        <form onSubmit={handleSubmit} className="mt-7 space-y-5">
          <div>
            <label htmlFor="register-email" className="mb-2 block text-sm font-medium">
              Email address
            </label>
            <input
              id="register-email"
              type="email"
              autoComplete="email"
              required
              maxLength={254}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-xl border border-slate-500/40 bg-transparent px-4 py-3 outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label htmlFor="register-password" className="mb-2 block text-sm font-medium">
              Password
            </label>
            <input
              id="register-password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              maxLength={128}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Create a strong password"
              className="w-full rounded-xl border border-slate-500/40 bg-transparent px-4 py-3 outline-none focus:border-emerald-500"
            />
            <p className="km-muted mt-2 text-xs">
              Use a strong, unique password. Common passwords may be rejected.
            </p>
          </div>

          <div>
            <label htmlFor="register-confirm" className="mb-2 block text-sm font-medium">
              Confirm password
            </label>
            <input
              id="register-confirm"
              type="password"
              autoComplete="new-password"
              required
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="Repeat your password"
              className="w-full rounded-xl border border-slate-500/40 bg-transparent px-4 py-3 outline-none focus:border-emerald-500"
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
            {loading ? "Creating account..." : "Create account"}
            {!loading && <ArrowRight size={18} />}
          </button>
        </form>

        <p className="km-muted mt-6 text-center text-sm">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-emerald-400">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
