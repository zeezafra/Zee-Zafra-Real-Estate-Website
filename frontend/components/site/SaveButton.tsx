"use client";

import { Heart } from "lucide-react";
import { useSavedListings } from "@/lib/useSavedListings";

type Props = {
  propertyId: string;
  variant?: "icon" | "button";
  className?: string;
};

// variant="icon" is the compact circle used as an overlay on PropertyCard —
// always a *sibling* of that card's <Link>, never nested inside it (a
// <button> inside an <a> is invalid HTML), so no click-propagation
// handling is needed here. variant="button" is the labeled version used
// next to "Inquire Now" on the property detail page.
export default function SaveButton({ propertyId, variant = "icon", className }: Props) {
  const { isSaved, toggleSaved, hydrated } = useSavedListings();
  // Gate on `hydrated` so this renders "not saved" for the first paint on
  // both server and client, then updates once localStorage has been read —
  // see useSavedListings for why.
  const saved = hydrated && isSaved(propertyId);

  const defaultClass =
    variant === "button"
      ? "flex items-center justify-center gap-2 rounded-full border border-navy/20 px-6 py-3 font-semibold text-navy transition hover:border-gold hover:text-gold dark:border-offwhite/20 dark:text-offwhite"
      : "flex h-8 w-8 items-center justify-center rounded-full bg-navy/60 text-offwhite backdrop-blur transition hover:bg-navy/80";

  return (
    <button
      type="button"
      onClick={() => toggleSaved(propertyId)}
      aria-pressed={saved}
      aria-label={saved ? "Remove from saved properties" : "Save this property"}
      className={className ?? defaultClass}
    >
      <Heart size={variant === "button" ? 18 : 15} className={saved ? "fill-gold text-gold" : ""} />
      {variant === "button" && (saved ? "Saved" : "Save Listing")}
    </button>
  );
}
