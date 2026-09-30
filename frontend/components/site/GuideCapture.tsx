"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { Download, FileText } from "lucide-react";
import type { Guide } from "@/lib/guides";
import { TURNSTILE_SITE_KEY } from "@/lib/siteConfig";
import HoneypotField from "./HoneypotField";
import TurnstileWidget from "./TurnstileWidget";
import T from "@/components/i18n/T";
import { useT } from "@/components/i18n/LanguageProvider";

const apiUrl = process.env.NEXT_PUBLIC_API_URL;

const inputClass =
  "w-full rounded-lg border border-navy/20 bg-white px-3 py-2 text-navy focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold dark:border-offwhite/20 dark:bg-navy-light dark:text-offwhite";

// Trust & polish. Email-gated download for one guide. After a successful
// POST /api/guides the PDF link is revealed (and remembered in
// localStorage per guide, so a returning visitor isn't asked again). It's a
// soft gate: the value is the captured email, not access control.
export default function GuideCapture({ guide }: { guide: Guide }) {
  const t = useT();
  const storageKey = `zz-guide-${guide.slug}`;

  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const [turnstileReset, setTurnstileReset] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Always starts false so the server render and the first client render
  // match (the server can't see localStorage). A returning visitor who
  // already unlocked this guide is switched over right after hydration.
  const [unlocked, setUnlocked] = useState(false);

  useEffect(() => {
    try {
      if (window.localStorage.getItem(storageKey) === "1") setUnlocked(true);
    } catch {
      /* storage blocked — they'll just see the form again */
    }
  }, [storageKey]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!apiUrl) {
      setError("This isn't available right now. Please try again later.");
      return;
    }
    if (TURNSTILE_SITE_KEY && !turnstileToken) {
      setError("Please complete the human-verification check below.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`${apiUrl}/api/guides`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          name: name.trim() || undefined,
          guide: guide.slug,
          turnstileToken: turnstileToken || undefined,
          website: honeypot,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setTurnstileReset((n) => n + 1);
        throw new Error(data.error || "Something went wrong. Please try again.");
      }
      try {
        window.localStorage.setItem(storageKey, "1");
      } catch {
        /* ignore */
      }
      setUnlocked(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <article className="relative flex flex-col rounded-2xl border border-navy/10 bg-white p-6 dark:border-offwhite/10 dark:bg-navy-light">
      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-navy text-gold dark:bg-gold/10">
        <FileText size={20} aria-hidden="true" />
      </span>
      <h3 className="mt-4 text-lg font-semibold text-navy dark:text-offwhite">{guide.title}</h3>
      <p className="mt-2 flex-1 text-sm text-navy/70 dark:text-offwhite/70">{guide.blurb}</p>
      <p className="mt-2 text-xs text-navy/50 dark:text-offwhite/50">
        PDF · {guide.pages} pages · <T id="guides.english">The guides are written in English.</T>
      </p>

      {unlocked ? (
        <div className="mt-5" role="status">
          <p className="text-sm font-medium text-navy dark:text-offwhite">
            <T id="guides.ready">Your guide is ready.</T>
          </p>
          <a
            href={guide.file}
            download
            className="mt-3 inline-flex items-center gap-2 rounded-full bg-gold px-6 py-2.5 text-sm font-semibold text-navy transition hover:bg-gold-light"
          >
            <Download size={16} aria-hidden="true" />
            <T id="guides.download">Download the PDF</T>
          </a>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="relative mt-5 space-y-3">
          <HoneypotField value={honeypot} onChange={setHoneypot} />
          <div>
            <label className="sr-only" htmlFor={`guide-name-${guide.slug}`}>
              {t("guides.name", "Name (optional)")}
            </label>
            <input
              id={`guide-name-${guide.slug}`}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={80}
              autoComplete="name"
              placeholder={t("guides.name", "Name (optional)")}
              className={inputClass}
            />
          </div>
          <div>
            <label className="sr-only" htmlFor={`guide-email-${guide.slug}`}>
              {t("guides.email", "Email address")}
            </label>
            <input
              id={`guide-email-${guide.slug}`}
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              maxLength={200}
              autoComplete="email"
              placeholder={t("guides.email", "Email address")}
              className={inputClass}
            />
          </div>
          <TurnstileWidget onToken={setTurnstileToken} resetSignal={turnstileReset} />
          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-400" role="alert">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={submitting}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-gold px-6 py-2.5 text-sm font-semibold text-navy transition hover:bg-gold-light disabled:opacity-60"
          >
            <Download size={16} aria-hidden="true" />
            {submitting ? <T id="guides.getting">One moment…</T> : <T id="guides.get">Get the checklist</T>}
          </button>
          <p className="text-xs text-navy/50 dark:text-offwhite/50">
            <T id="guides.consent">
              I&apos;ll only use your email to send you this guide and, if needed, answer your questions. See our
            </T>{" "}
            <Link href="/privacy" className="underline hover:text-gold">
              <T id="guides.privacy">Privacy Policy</T>
            </Link>
            .
          </p>
        </form>
      )}
    </article>
  );
}
