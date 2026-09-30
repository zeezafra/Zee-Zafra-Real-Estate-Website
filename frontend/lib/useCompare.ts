"use client";

import { useCallback, useEffect, useState } from "react";

// Phase 26. Same pattern as useSavedListings: localStorage plus a custom
// event so every hook instance on the page (each card's button and the
// floating bar) stays in sync within one tab.
const STORAGE_KEY = "zee-zafra-compare-properties";
const COMPARE_EVENT = "zee-zafra-compare-change";
export const MAX_COMPARE = 3;

function read(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(parsed)
      ? parsed.filter((v) => typeof v === "string").slice(0, MAX_COMPARE)
      : [];
  } catch {
    return [];
  }
}

function write(ids: string[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
    window.dispatchEvent(new Event(COMPARE_EVENT));
  } catch {
    // Storage unavailable — comparing just won't persist.
  }
}

export function useCompare() {
  const [ids, setIds] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const sync = () => setIds(read());
    sync();
    setHydrated(true);
    window.addEventListener(COMPARE_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(COMPARE_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const isSelected = useCallback((id: string) => ids.includes(id), [ids]);
  const isFull = ids.length >= MAX_COMPARE;

  const toggle = useCallback((id: string) => {
    const current = read();
    if (current.includes(id)) {
      write(current.filter((v) => v !== id));
    } else if (current.length < MAX_COMPARE) {
      write([...current, id]);
    }
  }, []);

  const clear = useCallback(() => write([]), []);

  return { ids, hydrated, isSelected, isFull, toggle, clear };
}
