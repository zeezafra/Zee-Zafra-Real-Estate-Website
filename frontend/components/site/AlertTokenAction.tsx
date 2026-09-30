"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

const apiUrl = process.env.NEXT_PUBLIC_API_URL;

type State = "idle" | "working" | "done" | "error";

// Phase 26. Confirm runs automatically on load (harmless and idempotent).
// Unsubscribe waits for a click — email security scanners often open every
// link in a message, and a scanner must not be able to unsubscribe someone.
export default function AlertTokenAction({ action, token }: { action: "confirm" | "unsubscribe"; token: string }) {
  const [state, setState] = useState<State>(action === "confirm" && token ? "working" : "idle");
  const [message, setMessage] = useState("");
  const ran = useRef(false);

  async function run() {
    if (!apiUrl || !token) {
      setState("error");
      setMessage("This link looks incomplete. Try opening it again from the email.");
      return;
    }
    setState("working");
    try {
      const res = await fetch(`${apiUrl}/api/alerts/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Something went wrong");
      }
      setState("done");
    } catch (err) {
      setState("error");
      setMessage(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  useEffect(() => {
    if (action === "confirm" && !ran.current) {
      ran.current = true;
      if (!token) {
        setState("error");
        setMessage("This link looks incomplete. Try opening it again from the email.");
      } else {
        void run();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const title = action === "confirm" ? "Confirming your alert" : "Unsubscribe from alerts";

  return (
    <div className="mt-6 rounded-2xl border border-navy/10 p-8 dark:border-offwhite/10">
      <h1 className="text-2xl font-bold text-navy dark:text-offwhite">{title}</h1>

      {state === "working" && <p className="mt-3 text-navy/70 dark:text-offwhite/70">One moment…</p>}

      {state === "idle" && action === "unsubscribe" && (
        <>
          <p className="mt-3 text-navy/70 dark:text-offwhite/70">
            Stop emails for this saved search? You can always set up a new alert later.
          </p>
          <button
            type="button"
            onClick={run}
            className="mt-5 rounded-full bg-navy px-6 py-2.5 font-semibold text-gold transition hover:bg-navy/90 dark:bg-gold dark:text-navy"
          >
            Yes, unsubscribe me
          </button>
        </>
      )}

      {state === "done" && (
        <p className="mt-3 text-navy/80 dark:text-offwhite/80" role="status">
          {action === "confirm"
            ? "You're all set — we'll email you when a new listing matches."
            : "Done — you won't get any more emails for that alert."}
        </p>
      )}

      {state === "error" && (
        <p className="mt-3 font-medium text-red-600" role="alert">{message}</p>
      )}

      {(state === "done" || state === "error") && (
        <Link
          href="/properties"
          className="mt-5 inline-block rounded-full bg-gold px-6 py-2.5 font-semibold text-navy transition hover:bg-gold-light"
        >
          Browse Properties
        </Link>
      )}
    </div>
  );
}
