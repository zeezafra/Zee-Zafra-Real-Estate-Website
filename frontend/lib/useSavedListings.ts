"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "zee-zafra-saved-properties";

// localStorage's own "storage" event only fires in *other* tabs, never the
// tab that made the change — so every write also dispatches this custom
// event, and every hook instance listens for it. That's what keeps, say, a
// PropertyCard's heart and the sidebar's saved-count badge in sync on the
// same page without wiring up a React context for something this small.
const SAVED_EVENT = "zee-zafra-saved-properties-change";

// Phase 24 (UI/UX Phase 7, most-favorited analytics). Same
// NEXT_PUBLIC_API_URL used by lib/api.ts's server-side fetch helpers — this
// is the one place a *client* component calls the backend directly, since
// the counter only has something to increment/decrement at the exact
// moment the heart button flips the local list.
const apiUrl = process.env.NEXT_PUBLIC_API_URL;

// Fire-and-forget: this counter is a nice-to-have for the admin analytics
// page, never a condition the save/unsave action itself depends on. A
// failed or slow request here must never delay or roll back the
// localStorage write, so this isn't awaited by the caller and any error is
// swallowed rather than surfaced.
function reportFavoriteChange(id: string, saved: boolean) {
  if (!apiUrl) return;
  fetch(`${apiUrl}/api/properties/${id}/favorite`, {
    method: saved ? "POST" : "DELETE",
  }).catch(() => {
    // Same tolerance as readSavedIds/writeSavedIds below — a missed
    // analytics tick isn't worth surfacing to the visitor.
  });
}

function readSavedIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((id) => typeof id === "string") : [];
  } catch {
    // Corrupt/foreign JSON in that key, or localStorage unavailable
    // (private browsing in some browsers) — treat as "nothing saved"
    // rather than throwing and breaking the page.
    return [];
  }
}

function writeSavedIds(ids: string[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
    window.dispatchEvent(new Event(SAVED_EVENT));
  } catch {
    // Same tolerance as the read side — a save that silently doesn't
    // persist is better than a thrown error taking down the click handler.
  }
}

// Starts at an empty array on every render (server and first client
// render) so SSR/client markup match — localStorage doesn't exist yet at
// that point. The real value hydrates in the effect below, which is also
// why `hydrated` is exposed: callers that render something saved-state-
// dependent (a filled-in heart, a count badge) should gate on it to avoid
// flashing a wrong "not saved" state for a frame.
export function useSavedListings() {
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setSavedIds(readSavedIds());
    setHydrated(true);

    function handleChange() {
      setSavedIds(readSavedIds());
    }

    window.addEventListener(SAVED_EVENT, handleChange);
    window.addEventListener("storage", handleChange);
    return () => {
      window.removeEventListener(SAVED_EVENT, handleChange);
      window.removeEventListener("storage", handleChange);
    };
  }, []);

  const isSaved = useCallback((id: string) => savedIds.includes(id), [savedIds]);

  const toggleSaved = useCallback((id: string) => {
    const current = readSavedIds();
    const willBeSaved = !current.includes(id);
    const next = willBeSaved ? [...current, id] : current.filter((savedId) => savedId !== id);
    writeSavedIds(next);
    setSavedIds(next);
    reportFavoriteChange(id, willBeSaved);
  }, []);

  return { savedIds, isSaved, toggleSaved, hydrated };
}
