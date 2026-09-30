"use client";

import { FormEvent, useState } from "react";
import { BellRing } from "lucide-react";
import { PROPERTY_TYPES } from "@/lib/types";
import HoneypotField from "./HoneypotField";
import TurnstileWidget from "./TurnstileWidget";

const apiUrl = process.env.NEXT_PUBLIC_API_URL;

export type AlertCriteria = {
  location?: string;
  type?: string;
  listingType?: string;
  minPrice?: string;
  maxPrice?: string;
  minBeds?: string;
};

function describe(c: AlertCriteria): string {
  const parts: string[] = [];
  if (c.listingType) parts.push(c.listingType === "FOR_RENT" ? "for rent" : "for sale");
  if (c.type) parts.push((PROPERTY_TYPES.find((t) => t.value === c.type)?.label ?? c.type).toLowerCase());
  if (c.location) parts.push(`in ${c.location}`);
  if (c.minBeds) parts.push(`${c.minBeds}+ beds`);
  if (c.minPrice && c.maxPrice) parts.push(`₱${Number(c.minPrice).toLocaleString()}–₱${Number(c.maxPrice).toLocaleString()}`);
  else if (c.minPrice) parts.push(`from ₱${Number(c.minPrice).toLocaleString()}`);
  else if (c.maxPrice) parts.push(`up to ₱${Number(c.maxPrice).toLocaleString()}`);
  return parts.length ? parts.join(", ") : "every new listing";
}

// Phase 26. Sits on /properties and saves whatever filters are currently
// applied. Double opt-in: the visitor must click the emailed link before
// anything is sent (see backend/src/routes/alerts.js).
export default function AlertSignup({ criteria }: { criteria: AlertCriteria }) {
  const [email, setEmail] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const [turnstileReset, setTurnstileReset] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!apiUrl) {
      setError("Alerts aren't available right now.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`${apiUrl}/api/alerts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          location: criteria.location || undefined,
          type: criteria.type || undefined,
          listingType: criteria.listingType || undefined,
          minPrice: criteria.minPrice || undefined,
          maxPrice: criteria.maxPrice || undefined,
          minBeds: criteria.minBeds || undefined,
          turnstileToken: turnstileToken || undefined,
          website: honeypot,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setTurnstileReset((n) => n + 1);
        throw new Error(data.error || "Couldn't save your alert");
      }
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save your alert");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section
      aria-labelledby="alert-heading"
      className="relative mt-10 rounded-2xl border border-gold/30 bg-gold/5 p-6"
    >
      <h2 id="alert-heading" className="flex items-center gap-2 text-lg font-semibold text-navy dark:text-offwhite">
        <BellRing size={18} className="text-gold" />
        Get email alerts for this search
      </h2>

      {done ? (
        <p className="mt-3 text-sm text-navy/80 dark:text-offwhite/80" role="status">
          Almost done — we&rsquo;ve sent a confirmation link to <strong>{email}</strong>. Click it and
          you&rsquo;ll be emailed when a new listing matches. (Check spam if you don&rsquo;t see it.)
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="mt-3">
          <p className="text-sm text-navy/70 dark:text-offwhite/70">
            Email me when a new listing matches: <strong>{describe(criteria)}</strong>. One email per new
            listing, unsubscribe any time.
          </p>
          <HoneypotField value={honeypot} onChange={setHoneypot} />
          <div className="mt-3 flex flex-wrap gap-3">
            <label className="sr-only" htmlFor="alert-email">Your email address</label>
            <input
              id="alert-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full max-w-xs rounded-lg border border-navy/20 bg-white px-3 py-2 text-navy focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold dark:border-offwhite/20 dark:bg-navy-light dark:text-offwhite"
            />
            <button
              type="submit"
              disabled={submitting}
              className="rounded-full bg-gold px-5 py-2 font-semibold text-navy transition hover:bg-gold-light disabled:opacity-60"
            >
              {submitting ? "Saving…" : "Alert me"}
            </button>
          </div>
          <div className="mt-3">
            <TurnstileWidget onToken={setTurnstileToken} resetSignal={turnstileReset} />
          </div>
          {error && <p className="mt-3 text-sm font-medium text-red-600" role="alert">{error}</p>}
        </form>
      )}
    </section>
  );
}
