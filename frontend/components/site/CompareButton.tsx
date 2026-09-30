"use client";

import { ArrowLeftRight, Check } from "lucide-react";
import { useCompare } from "@/lib/useCompare";

// Phase 26. Small toggle sitting under the heart on each card. Outside the
// card's <Link> for the same nested-interactive-element reason as SaveButton.
export default function CompareButton({ propertyId, className }: { propertyId: string; className?: string }) {
  const { hydrated, isSelected, isFull, toggle } = useCompare();
  const selected = hydrated && isSelected(propertyId);
  const disabled = hydrated && !selected && isFull;

  return (
    <button
      type="button"
      onClick={() => toggle(propertyId)}
      disabled={disabled}
      aria-pressed={selected}
      aria-label={selected ? "Remove from comparison" : "Add to comparison"}
      title={disabled ? "You can compare up to 3 properties" : selected ? "Remove from comparison" : "Compare"}
      className={
        className ??
        `absolute right-3 top-14 flex h-8 w-8 items-center justify-center rounded-full backdrop-blur transition disabled:cursor-not-allowed disabled:opacity-40 ${
          selected ? "bg-gold text-navy" : "bg-navy/60 text-offwhite hover:bg-navy/80"
        }`
      }
    >
      {selected ? <Check size={15} /> : <ArrowLeftRight size={15} />}
    </button>
  );
}
