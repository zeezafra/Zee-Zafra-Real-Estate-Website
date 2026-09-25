"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import type { InquiryContext } from "./InquiryModalProvider";
import { useFocusTrap } from "@/lib/useFocusTrap";
import { TURNSTILE_SITE_KEY } from "@/lib/siteConfig";
import HoneypotField from "./HoneypotField";
import TurnstileWidget from "./TurnstileWidget";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  context?: InquiryContext;
};

const inputClass =
  "mt-1 w-full rounded-lg border border-navy/15 bg-white px-3.5 py-2.5 text-sm text-navy placeholder:text-navy/40 focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold dark:border-offwhite/15 dark:bg-navy-light dark:text-offwhite dark:placeholder:text-offwhite/40";

// The one modal instance for the whole public site — see
// InquiryModalProvider for why this is centralized rather than one copy
// per trigger. Mirrors validateInquiryPayload on the backend closely
// enough to catch obvious mistakes client-side, but the backend is still
// the source of truth (e.g. the 2000-char message cap is enforced there
// too, this is just maxLength for UX).
export default function InquiryModal({ isOpen, onClose, context }: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  // Phase 20 spam protection: honeypot (never filled by a human), the
  // Turnstile token, and a counter that forces a fresh challenge after a
  // failed submit — a Turnstile token is single-use.
  const [honeypot, setHoneypot] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const [turnstileReset, setTurnstileReset] = useState(0);
  // Phase 20: true when the backend recognized this as a repeat of an
  // inquiry sent in the last 24h, so the success screen can say so
  // instead of implying a second message went out.
  const [duplicate, setDuplicate] = useState(false);
  const firstFieldRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  useFocusTrap(panelRef, isOpen);

  // Fresh form on every open, and lock page scroll while it's up. Also
  // remembers whatever had focus before opening (the "Inquire Now"/"Get in
  // Touch" button that triggered this) so closing can return focus there
  // instead of dropping it back to <body>.
  useEffect(() => {
    if (!isOpen) return;

    triggerRef.current = document.activeElement as HTMLElement;
    setName("");
    setEmail("");
    setPhone("");
    setMessage("");
    setError(null);
    setSuccess(false);
    setHoneypot("");
    setTurnstileToken("");
    setDuplicate(false);
    document.body.classList.add("overflow-hidden");
    const focusTimer = setTimeout(() => firstFieldRef.current?.focus(), 0);

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

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!name.trim() || !message.trim()) {
      setError("Name and message are required.");
      return;
    }
    if (!email.trim() && !phone.trim()) {
      setError("Add an email or phone number so I can get back to you.");
      return;
    }
    // Only gate on the token when Turnstile is actually configured —
    // TurnstileWidget renders nothing without a site key, so there'd be
    // no way for the visitor to satisfy this check.
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
          message: message.trim(),
          propertyId: context?.propertyId,
          // Phase 20. Every current InquireButton call site (CTABanner,
          // the property detail page) passes source explicitly now — this
          // fallback is just a safety net against a future call site that
          // forgets to, so it still reports something truthful rather than
          // silently sending nothing and having the backend default to
          // DIRECT.
          source: context?.source ?? (context?.propertyId ? "PROPERTY_PAGE" : "DIRECT"),
          turnstileToken: turnstileToken || undefined,
          website: honeypot,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        // The token is spent either way — force a fresh challenge so a
        // retry after a validation error isn't rejected for reuse.
        setTurnstileReset((n) => n + 1);
        throw new Error(data.error || "Failed to send your inquiry");
      }

      const result = await res.json().catch(() => ({}));
      setDuplicate(Boolean(result.duplicate));
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send your inquiry");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="inquiry-modal-title"
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
              {duplicate ? "Already got this one" : "Thanks \u2014 message sent!"}
            </h2>
            <p className="mt-2 text-sm text-navy/60 dark:text-offwhite/60">
              {duplicate
                ? "Your earlier message is already in my inbox \u2014 anything new you added has been attached to it. I\u2019ll get back to you as soon as I can."
                : "I\u2019ll get back to you as soon as I can."}
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
              id="inquiry-modal-title"
              className="pr-8 text-xl font-bold text-navy dark:text-offwhite"
            >
              Send an Inquiry
            </h2>
            {context?.propertyTitle && (
              <p className="mt-1 text-sm text-navy/60 dark:text-offwhite/60">
                Regarding: <span className="font-medium">{context.propertyTitle}</span>
              </p>
            )}

            <form onSubmit={handleSubmit} className="relative mt-5 space-y-4">
              <HoneypotField value={honeypot} onChange={setHoneypot} />

              <label className="block text-sm font-medium text-navy dark:text-offwhite">
                Name
                <input
                  ref={firstFieldRef}
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

              <label className="block text-sm font-medium text-navy dark:text-offwhite">
                Message
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className={`${inputClass} min-h-[100px] resize-y`}
                  maxLength={2000}
                  required
                />
              </label>

              <TurnstileWidget onToken={setTurnstileToken} resetSignal={turnstileReset} />

              {error && (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-400">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="flex w-full items-center justify-center rounded-full bg-gold px-6 py-3 font-semibold text-navy transition hover:bg-gold-light disabled:opacity-60"
              >
                {submitting ? "Sending…" : "Send Inquiry"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
