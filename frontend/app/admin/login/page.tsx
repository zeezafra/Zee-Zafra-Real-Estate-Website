"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!apiUrl) {
      setError("NEXT_PUBLIC_API_URL is not set.");
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch(`${apiUrl}/api/admin/login`, {
        method: "POST",
        credentials: "include", // required for the httpOnly session cookie
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Invalid email or password.");
        setSubmitting(false);
        return;
      }

      // router.refresh() forces the (protected) layout's server-side
      // session check to re-run against the fresh cookie before we land on
      // /admin, rather than relying on a stale client-side render.
      router.push("/admin");
      router.refresh();
    } catch {
      setError("Could not reach the server. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-navy px-6">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-2xl bg-offwhite p-8 shadow-xl"
      >
        <h1 className="text-2xl font-bold text-navy">Admin Login</h1>
        <p className="mt-1 text-sm text-navy/60">Zee Zafra Properties</p>

        <label className="mt-6 block text-sm font-medium text-navy">
          Email
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-lg border border-navy/20 px-3 py-2 text-navy focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
          />
        </label>

        <label className="mt-4 block text-sm font-medium text-navy">
          Password
          <input
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-lg border border-navy/20 px-3 py-2 text-navy focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
          />
        </label>

        {error && (
          <p className="mt-4 rounded-lg bg-red-100 px-3 py-2 text-sm font-medium text-red-700">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="mt-6 w-full rounded-full bg-gold px-4 py-2 font-semibold text-navy transition hover:bg-gold-light disabled:opacity-60"
        >
          {submitting ? "Signing in…" : "Sign In"}
        </button>
      </form>
    </main>
  );
}
