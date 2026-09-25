"use client";

import { useEffect, useId, useRef } from "react";
import { TURNSTILE_SITE_KEY } from "@/lib/siteConfig";

declare global {
  interface Window {
    turnstile?: {
      render: (
        el: HTMLElement,
        options: {
          sitekey: string;
          callback: (token: string) => void;
          "expired-callback"?: () => void;
          "error-callback"?: () => void;
          theme?: "light" | "dark" | "auto";
          size?: "normal" | "flexible" | "compact";
        }
      ) => string;
      remove: (widgetId: string) => void;
      reset: (widgetId?: string) => void;
    };
  }
}

const SCRIPT_SRC =
  "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

// Loads the Turnstile script once for the whole page, no matter how many
// widgets mount. next/script isn't used here because these widgets live
// inside modals that mount and unmount repeatedly — a plain promise
// cached at module scope is simpler to reason about and never re-injects
// the tag.
let scriptPromise: Promise<void> | null = null;

function loadTurnstileScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.turnstile) return Promise.resolve();
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${SCRIPT_SRC}"]`
    );
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("turnstile-load-failed")));
      return;
    }

    const script = document.createElement("script");
    script.src = SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("turnstile-load-failed"));
    document.head.appendChild(script);
  });

  return scriptPromise;
}

type Props = {
  onToken: (token: string) => void;
  // Bump this to force a fresh challenge — the forms increment it after a
  // failed submit, since a Turnstile token is single-use and the backend
  // will reject the same one twice.
  resetSignal?: number;
};

// Phase 20. Cloudflare Turnstile, rendered on all three public lead
// forms (InquiryModal, ViewingModal, SellerLeadForm).
//
// Renders NOTHING when NEXT_PUBLIC_TURNSTILE_SITE_KEY isn't set, and the
// forms treat a missing key as "no token required" — so local dev and the
// current deploy keep working unchanged until Zee creates the widget in
// Cloudflare. The backend makes the matching call (see lib/turnstile.js):
// no secret key, no verification.
//
// Explicit rendering (?render=explicit) rather than the automatic
// class-based mode, because these mount inside modals that don't exist at
// page load — automatic mode only scans the DOM once.
export default function TurnstileWidget({ onToken, resetSignal = 0 }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const onTokenRef = useRef(onToken);
  const instanceId = useId();

  // Kept in a ref so the render effect below doesn't re-run (and re-render
  // the widget) every time the parent form re-renders with a new inline
  // callback.
  useEffect(() => {
    onTokenRef.current = onToken;
  }, [onToken]);

  useEffect(() => {
    if (!TURNSTILE_SITE_KEY) return;

    let cancelled = false;

    loadTurnstileScript()
      .then(() => {
        if (cancelled || !containerRef.current || !window.turnstile) return;

        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey: TURNSTILE_SITE_KEY,
          callback: (token) => onTokenRef.current(token),
          // A token expires after ~5 minutes. Clearing it locally means
          // the form asks for a fresh challenge instead of submitting one
          // the backend would reject.
          "expired-callback": () => onTokenRef.current(""),
          "error-callback": () => onTokenRef.current(""),
          theme: "auto",
          size: "flexible",
        });
      })
      .catch(() => {
        // Script blocked (ad blocker, offline, Cloudflare down). The form
        // submits without a token; the backend's own fail-open path on an
        // unreachable Cloudflare keeps a genuine lead from being lost.
        if (!cancelled) onTokenRef.current("");
      });

    return () => {
      cancelled = true;
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
  }, [instanceId]);

  useEffect(() => {
    if (resetSignal === 0) return;
    if (widgetIdRef.current && window.turnstile) {
      window.turnstile.reset(widgetIdRef.current);
      onTokenRef.current("");
    }
  }, [resetSignal]);

  if (!TURNSTILE_SITE_KEY) return null;

  return <div ref={containerRef} className="mt-1" />;
}
