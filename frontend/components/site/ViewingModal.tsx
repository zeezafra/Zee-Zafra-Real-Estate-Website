"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import type { ViewingContext } from "./ViewingModalProvider";
import { useFocusTrap } from "@/lib/useFocusTrap";
import { getProperties } from "@/lib/api";
import type { Property } from "@/lib/types";
import { TURNSTILE_SITE_KEY } from "@/lib/siteConfig";
import HoneypotField from "./HoneypotField";
import TurnstileWidget from "./TurnstileWidget";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  context?: ViewingContext;
};

const inputClass =
  "mt-1 w-full rounded-lg border border-navy/15 bg-white px-3.5 py-2.5 text-sm text-navy placeholder:text-navy/40 focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold dark:border-offwhite/15 dark:bg-navy-light dark:text-offwhite dark:placeholder:text-offwhite/40";

// Today's date as "YYYY-MM-DD" in the visitor's local timezone, computed
// fresh on each render rather than once at module load, so the min
// attribute (below) doesn't go stale if the modal is left open across
// midnight. toISOString() is deliberately avoided here — it converts to
// UTC first, which can shift the date by one in timezones ahead of UTC.
function todayLocalISODate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// Phase 14. Separate from InquiryModal (same visual chrome, deliberately
// different form) — see the file-level note on ViewingModalProvider for
// why. Sends type: "BUYER" implicitly (the backend already defaults to
// it) plus preferredDate/preferredTime, which InquiryModal never sends.
// The optional "notes" field folds into the required `message` column
// with a sensible default when left blank, the same pattern
// SellerLeadForm uses for its own optional fields.
//
// Phase 14 follow-up: `context` is now optional. When it carries a
// propertyId (opened from the property detail page's BookViewingButton),
// that property is locked in and shown as "For: <title>". When it
// doesn't (opened from the global "Book a Viewing" trigger in TopNav/
// Hero), the form shows a property search instead — the backend still
// requires a propertyId to submit, so the visitor has to pick one, just
// inside the modal rather than before opening it.
export default function ViewingModal({ isOpen, onClose, context }: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [preferredDate, setPreferredDate] = useState("");
  const [preferredTime, setPreferredTime] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  // Phase 20 spam protection — see the matching block in InquiryModal.
  const [honeypot, setHoneypot] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const [turnstileReset, setTurnstileReset] = useState(0);
  const [duplicate, setDuplicate] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<{ id: string; title: string } | null>(
    null
  );
  const [propertyQuery, setPropertyQuery] = useState("");
  const [propertyResults, setPropertyResults] = useState<Property[]>([]);
  const nameFieldRef = useRef<HTMLInputElement>(null);
  const propertyFieldRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  const lockedProperty = context?.propertyId
    ? { id: context.propertyId, title: context.propertyTitle ?? "" }
    : null;

  useFocusTrap(panelRef, isOpen);

  useEffect(() => {
    if (!isOpen) return;

    triggerRef.current = document.activeElement as HTMLElement;
    setName("");
    setEmail("");
    setPhone("");
    setPreferredDate("");
    setPreferredTime("");
    setNotes("");
    setError(null);
    setSuccess(false);
    setHoneypot("");
    setTurnstileToken("");
    setDuplicate(false);
    setSelectedProperty(null);
    setPropertyQuery("");
    setPropertyResults([]);
    document.body.classList.add("overflow-hidden");
    const focusTimer = setTimeout(
      () => (lockedProperty ? nameFieldRef : propertyFieldRef).current?.focus(),
      0
    );

    return () => {
      clearTimeout(focusTimer);
      document.body.classList.remove("overflow-hidden");
      triggerRef.current?.focus();
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  // Debounced property search, only relevant when no property is locked
  // in via context — reuses the same public GET /api/properties?q= the
  // Phase 8 filters already use, so this needs no new backend endpoint.
  useEffect(() => {
    if (lockedProperty) return;
    if (!propertyQuery.trim()) {
      setPropertyResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      const results = await getProperties({ q: propertyQuery.trim() });
      setPropertyResults(results.slice(0, 6));
    }, 300);
    return () => clearTimeout(timer);
  }, [propertyQuery, lockedProperty]);

  if (!isOpen) return null;

  const chosenProperty = lockedProperty ?? selectedProperty;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!chosenProperty) {
      setError("Please select which property you'd like to view.");
      return;
    }
    if (!name.trim()) {
      setError("Name is required.");
      return;
    }
    if (!email.trim() && !phone.trim()) {
      setError("Add an email or phone number so I can confirm the viewing.");
      return;
    }
    if (!preferredDate || !preferredTime) {
      setError("Pick a preferred date and time.");
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

    setSubmitting(true);
    try {
      const res = await fetch(`${apiUrl}/api/inquiries`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim() || undefined,
          phone: phone.trim() || undefined,
          message: notes.trim() || "Requested a property viewing.",
          propertyId: chosenProperty.id,
          preferredDate,
          preferredTime,
          // Phase 20: always VIEWING_FORM, whether this opened from the
          // property page or the global TopNav/Hero trigger — what's
          // worth measuring is that the viewing form converted, not which
          // button opened it.
          source: "VIEWING_FORM",
          turnstileToken: turnstileToken || undefined,
          website: honeypot,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setTurnstileReset((n) => n + 1);
        throw new Error(data.error || "Failed to send your viewing request");
      }

      const result = await res.json().catch(() => ({}));
      setDuplicate(Boolean(result.duplicate));
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send your viewing request");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="viewing-modal-title"
    >
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-navy/60 backdrop-blur-sm"
      />

      <div
        ref={panelRef}
        className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-navy-light"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-navy/50 transition hover:bg-navy/5 hover:text-navy dark:text-offwhite/50 dark:hover:bg-white/5 dark:hover:text-offwhite"
        >
          <X size={18} />
        </button>

        {success ? (
          <div className="py-6 text-center">
            <h2 className="text-xl font-bold text-navy dark:text-offwhite">
              {duplicate ? "Already on my list" : "Viewing requested!"}
            </h2>
            <p className="mt-2 text-sm text-navy/60 dark:text-offwhite/60">
              {duplicate
                ? "You already asked about this property today \u2014 your latest note has been added to that request. I\u2019ll confirm a time as soon as I can."
                : "I\u2019ll confirm your preferred time as soon as I can."}
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-6 rounded-full bg-gold px-6 py-2.5 text-sm font-semibold text-navy transition hover:bg-gold-light"
            >
              Close
            </button>
          </div>
        ) : (
          <>
            <h2
              id="viewing-modal-title"
              className="pr-8 text-xl font-bold text-navy dark:text-offwhite"
            >
              Book a Viewing
            </h2>
            {lockedProperty && (
              <p className="mt-1 text-sm text-navy/60 dark:text-offwhite/60">
                For: <span className="font-medium">{lockedProperty.title}</span>
              </p>
            )}

            <form onSubmit={handleSubmit} className="relative mt-5 space-y-4">
              <HoneypotField value={honeypot} onChange={setHoneypot} />

              {!lockedProperty && (
                <label className="block text-sm font-medium text-navy dark:text-offwhite">
                  Property
                  {selectedProperty ? (
                    <div className="mt-1 flex items-center justify-between gap-2 rounded-lg border border-navy/15 bg-navy/5 px-3.5 py-2.5 text-sm dark:border-offwhite/15 dark:bg-white/5">
                      <span className="truncate font-medium text-navy dark:text-offwhite">
                        {selectedProperty.title}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedProperty(null);
                          setPropertyQuery("");
                        }}
                        aria-label="Change property"
                        className="shrink-0 text-navy/50 transition hover:text-navy dark:text-offwhite/50 dark:hover:text-offwhite"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <div className="relative">
                      <input
                        ref={propertyFieldRef}
                        type="text"
                        value={propertyQuery}
                        onChange={(e) => setPropertyQuery(e.target.value)}
                        placeholder="Search by title or location…"
                        className={inputClass}
                      />
                      {propertyResults.length > 0 && (
                        <ul className="absolute z-10 mt-1 max-h-48 w-full overflow-auto rounded-lg border border-navy/15 bg-white shadow-lg dark:border-offwhite/15 dark:bg-navy-light">
                          {propertyResults.map((p) => (
                            <li key={p.id}>
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedProperty({ id: p.id, title: p.title });
                                  setPropertyResults([]);
                                }}
                                className="block w-full px-3.5 py-2 text-left text-sm transition hover:bg-navy/5 dark:hover:bg-white/5"
                              >
                                <span className="block font-medium text-navy dark:text-offwhite">
                                  {p.title}
                                </span>
                                <span className="block text-xs text-navy/50 dark:text-offwhite/50">
                                  {p.location}
                                </span>
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </label>
              )}

              <label className="block text-sm font-medium text-navy dark:text-offwhite">
                Name
                <input
                  ref={nameFieldRef}
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={inputClass}
                  maxLength={120}
                  required
                />
              </label>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className="block text-sm font-medium text-navy dark:text-offwhite">
                  Email
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={inputClass}
                    maxLength={200}
                  />
                </label>
                <label className="block text-sm font-medium text-navy dark:text-offwhite">
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
                <label className="block text-sm font-medium text-navy dark:text-offwhite">
                  Preferred Date
                  <input
                    type="date"
                    value={preferredDate}
                    min={todayLocalISODate()}
                    onChange={(e) => setPreferredDate(e.target.value)}
                    className={inputClass}
                    required
                  />
                </label>
                <label className="block text-sm font-medium text-navy dark:text-offwhite">
                  Preferred Time
                  <input
                    type="time"
                    value={preferredTime}
                    onChange={(e) => setPreferredTime(e.target.value)}
                    className={inputClass}
                    required
                  />
                </label>
              </div>

              <label className="block text-sm font-medium text-navy dark:text-offwhite">
                Anything I should know? (optional)
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className={`${inputClass} min-h-[80px] resize-y`}
                  maxLength={2000}
                  placeholder="Alternate times, who's coming along, questions before the visit…"
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
                className="flex w-full items-center justify-center rounded-full bg-gold px-6 py-3 font-semibold text-navy transition hover:bg-gold-light disabled:opacity-60"
              >
                {submitting ? "Sending…" : "Request Viewing"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
