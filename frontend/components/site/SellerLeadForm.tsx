"use client";

import { useState } from "react";
import Link from "next/link";
import { PROPERTY_TYPES, type PropertyType } from "@/lib/types";
import { TURNSTILE_SITE_KEY } from "@/lib/siteConfig";
import HoneypotField from "./HoneypotField";
import TurnstileWidget from "./TurnstileWidget";

const inputClass =
  "mt-1 w-full rounded-lg border border-navy/15 bg-white px-3.5 py-2.5 text-sm text-navy placeholder:text-navy/40 focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold dark:border-offwhite/15 dark:bg-navy-light dark:text-offwhite dark:placeholder:text-offwhite/40";
const labelClass = "block text-sm font-medium text-navy dark:text-offwhite";

// Phase 13. A dedicated page-level form rather than a variant of the
// shared InquiryModal (InquiryModal.tsx) — a seller lead needs fields a
// buyer inquiry never asks for (what they're selling, where), and this
// isn't a "click anywhere, pop up over whatever page you're on" action
// the way "Inquire Now"/"Get in Touch" are, so a real /sell route fits
// better than a modal.
//
// The Inquiry table itself only grew a `type` column this phase (see the
// schema comment) — no new columns for property type/location. Rather
// than add columns for a single-admin inbox that's still low-volume,
// those two fields are folded into a clearly labeled `message` before
// POSTing, same call as Phase 10 made for rentPeriod/originalPrice-style
// one-off fields elsewhere: real structure in the UI, plain text in the
// one column that already exists for it. If Zee's seller volume grows
// enough that filtering by property type/location becomes worth it, that
// most likely points to promoting these into real Inquiry columns later.
export default function SellerLeadForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [propertyType, setPropertyType] = useState(PROPERTY_TYPES[0].value);
  const [location, setLocation] = useState("");
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  // Phase 20 spam protection — see the matching block in InquiryModal.
  const [honeypot, setHoneypot] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const [turnstileReset, setTurnstileReset] = useState(0);
  const [duplicate, setDuplicate] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!name.trim() || !location.trim()) {
      setError("Name and property location are required.");
      return;
    }
    if (!email.trim() && !phone.trim()) {
      setError("Add an email or phone number so I can get back to you.");
      return;
    }
    if (TURNSTILE_SITE_KEY && !turnstileToken) {
      setError("Please complete the human-verification check below.");
      return;
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!apiUrl) {
      setError("Something's misconfigured — please try again later.");
      return;
    }

    const propertyTypeLabel =
      PROPERTY_TYPES.find((t) => t.value === propertyType)?.label ?? propertyType;

    // Structured fields folded into one message — see file-level note.
    const message = [
      `Property type: ${propertyTypeLabel}`,
      `Location: ${location.trim()}`,
      details.trim() ? `\n${details.trim()}` : null,
    ]
      .filter(Boolean)
      .join("\n");

    setSubmitting(true);
    try {
      const res = await fetch(`${apiUrl}/api/inquiries`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "SELLER",
          name: name.trim(),
          email: email.trim() || undefined,
          phone: phone.trim() || undefined,
          message,
          source: "SELL_PAGE",
          turnstileToken: turnstileToken || undefined,
          website: honeypot,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setTurnstileReset((n) => n + 1);
        throw new Error(data.error || "Failed to send your details");
      }

      const result = await res.json().catch(() => ({}));
      setDuplicate(Boolean(result.duplicate));
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send your details");
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="rounded-2xl border border-navy/10 bg-white p-8 text-center dark:border-offwhite/10 dark:bg-navy-light">
        <h2 className="text-xl font-bold text-navy dark:text-offwhite">
          {duplicate ? "Already got your details" : "Thanks \u2014 got your details!"}
        </h2>
        <p className="mt-2 text-sm text-navy/60 dark:text-offwhite/60">
          {duplicate
            ? "You sent this through earlier today \u2014 anything new has been added to it. I\u2019ll get back to you about next steps for listing your property."
            : "I\u2019ll take a look and get back to you about next steps for listing your property."}
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="relative space-y-5 rounded-2xl border border-navy/10 bg-white p-6 dark:border-offwhite/10 dark:bg-navy-light sm:p-8"
    >
      <HoneypotField value={honeypot} onChange={setHoneypot} />

      <label className={labelClass}>
        Name
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={inputClass}
          maxLength={120}
          required
        />
      </label>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className={labelClass}>
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
            maxLength={200}
          />
        </label>
        <label className={labelClass}>
          Phone
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className={inputClass}
            maxLength={40}
          />
        </label>
      </div>
      <p className="-mt-2 text-xs text-navy/50 dark:text-offwhite/50">
        Add at least one of email or phone.
      </p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className={labelClass}>
          Property Type
          <select
            value={propertyType}
            onChange={(e) => setPropertyType(e.target.value as PropertyType)}
            className={inputClass}
          >
            {PROPERTY_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </label>
        <label className={labelClass}>
          Location
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className={inputClass}
            maxLength={120}
            placeholder="e.g. Talisay City"
            required
          />
        </label>
      </div>

      <label className={labelClass}>
        Tell me more (optional)
        <textarea
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          className={`${inputClass} min-h-[110px] resize-y`}
          maxLength={1800}
          placeholder="Asking price, size, condition, timeline — whatever's useful."
        />
      </label>

      <TurnstileWidget onToken={setTurnstileToken} resetSignal={turnstileReset} />

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-400">
          {error}
        </p>
      )}

      <p className="text-xs text-navy/50 dark:text-offwhite/50">
        By submitting, you agree to our{" "}
        <Link href="/privacy" className="font-medium text-gold hover:underline">
          Privacy Policy
        </Link>
        .
      </p>

      <button
        type="submit"
        disabled={submitting}
        className="flex w-full items-center justify-center rounded-full bg-gold px-6 py-3 font-semibold text-navy transition hover:bg-gold-light disabled:opacity-60 sm:w-auto"
      >
        {submitting ? "Sending…" : "Submit Property Details"}
      </button>
    </form>
  );
}
