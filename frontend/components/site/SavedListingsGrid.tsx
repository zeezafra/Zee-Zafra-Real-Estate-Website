"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getPropertyById } from "@/lib/api";
import { useSavedListings } from "@/lib/useSavedListings";
import type { Property } from "@/lib/types";
import PropertyCard from "./PropertyCard";

// Fetches each saved id individually via the same getPropertyById the
// detail page already calls, rather than adding a new "?ids=" batch
// endpoint — the saved list is realistically a handful of properties, and
// this keeps Phase 12 from growing the API surface for a client-only
// feature. Deliberately doesn't filter by status (unlike getProperties,
// which is always AVAILABLE-only) — if a saved listing later sells, it
// should still show up here rather than silently vanish.
export default function SavedListingsGrid() {
  const { savedIds, hydrated } = useSavedListings();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!hydrated) return;

    if (savedIds.length === 0) {
      setProperties([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    Promise.all(savedIds.map((id) => getPropertyById(id))).then((results) => {
      if (cancelled) return;
      // A saved id that 404s (listing deleted since it was saved) is just
      // dropped from the grid — no error state, since there's nothing
      // actionable for the visitor to do about a listing that's gone.
      setProperties(results.filter((p): p is Property => p !== null));
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [savedIds, hydrated]);

  if (!hydrated || loading) {
    return (
      <p className="mt-10 text-navy/60 dark:text-offwhite/60">
        Loading your saved properties…
      </p>
    );
  }

  if (properties.length === 0) {
    return (
      <div className="mt-10 rounded-2xl border border-navy/10 p-8 text-center dark:border-offwhite/10">
        <p className="text-navy/60 dark:text-offwhite/60">
          You haven&rsquo;t saved any properties yet.
        </p>
        <Link
          href="/properties"
          className="mt-4 inline-block rounded-full bg-gold px-6 py-2.5 text-sm font-semibold text-navy transition hover:bg-gold-light"
        >
          Browse Properties
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {properties.map((property) => (
        <PropertyCard key={property.id} property={property} />
      ))}
    </div>
  );
}
