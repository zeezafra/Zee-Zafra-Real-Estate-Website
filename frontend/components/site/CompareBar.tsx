"use client";

import Link from "next/link";
import { X } from "lucide-react";
import { useCompare, MAX_COMPARE } from "@/lib/useCompare";

// Phase 26. Floating tray, visible only once at least one property is
// picked. Sits bottom-left of the content area (the chat button owns the
// bottom-right corner; on lg+ it's nudged right of the fixed 288px sidebar).
export default function CompareBar() {
  const { ids, hydrated, clear } = useCompare();
  if (!hydrated || ids.length === 0) return null;

  const ready = ids.length >= 2;

  return (
    <div
      role="region"
      aria-label="Property comparison"
      className="fixed bottom-4 left-4 right-20 z-30 flex items-center justify-between gap-3 rounded-full border border-gold/40 bg-navy px-4 py-2.5 text-offwhite shadow-xl sm:left-1/2 sm:right-auto sm:w-auto sm:-translate-x-1/2 lg:left-[calc(50%+9rem)]"
    >
      <span className="text-sm">
        <strong className="text-gold">{ids.length}</strong>/{MAX_COMPARE} selected
        {!ready && <span className="hidden text-offwhite/60 sm:inline"> — pick at least 2</span>}
      </span>
      <div className="flex items-center gap-2">
        {ready ? (
          <Link
            href={`/compare?ids=${ids.join(",")}`}
            className="rounded-full bg-gold px-4 py-1.5 text-sm font-semibold text-navy transition hover:bg-gold-light"
          >
            Compare
          </Link>
        ) : (
          <span className="rounded-full bg-white/10 px-4 py-1.5 text-sm font-semibold text-offwhite/50">Compare</span>
        )}
        <button
          type="button"
          onClick={clear}
          aria-label="Clear comparison"
          className="rounded-full p-1.5 text-offwhite/70 transition hover:bg-white/10 hover:text-offwhite"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
