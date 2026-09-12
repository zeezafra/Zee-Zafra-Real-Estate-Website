import type { Property } from "./types";

// Server-only fetch helpers for the public properties API. No cookies
// involved (unlike lib/adminAuth.ts), so these are safe to call from plain
// server components and can lean on Next's fetch cache/revalidation instead
// of "no-store".
const apiUrl = process.env.NEXT_PUBLIC_API_URL;

// GET /api/properties?featured=true — homepage featured grid (Phase 6).
// Revalidates every 60s so toggling `featured` in the admin panel shows up
// on the homepage without a redeploy, per the roadmap's Phase 6 test.
export async function getFeaturedProperties(): Promise<Property[]> {
  if (!apiUrl) {
    return [];
  }

  try {
    const res = await fetch(`${apiUrl}/api/properties?featured=true`, {
      next: { revalidate: 60 },
    });

    if (!res.ok) {
      return [];
    }

    return (await res.json()) as Property[];
  } catch {
    // Homepage should still render (minus the grid) if the API is down,
    // rather than throwing and taking the whole page with it.
    return [];
  }
}

// GET /api/properties?status=AVAILABLE[&type=&listingType=&location=&minPrice=&maxPrice=&sort=&q=]
// /properties grid (Phase 7) + its filters/sort/search (Phase 8). Always
// scoped to AVAILABLE — that's the public grid's contract, not something a
// filter should be able to override. Same 60s revalidate window as the
// other list helpers so admin edits show up without a redeploy.
export type PropertyFilters = {
  type?: string;
  listingType?: string;
  location?: string;
  minPrice?: string;
  maxPrice?: string;
  sort?: string;
  q?: string;
};

export async function getProperties(filters: PropertyFilters = {}): Promise<Property[]> {
  if (!apiUrl) {
    return [];
  }

  const params = new URLSearchParams({ status: "AVAILABLE" });
  for (const [key, value] of Object.entries(filters)) {
    if (value) params.set(key, value);
  }

  try {
    const res = await fetch(`${apiUrl}/api/properties?${params.toString()}`, {
      next: { revalidate: 60 },
    });

    if (!res.ok) {
      return [];
    }

    return (await res.json()) as Property[];
  } catch {
    return [];
  }
}

// GET /api/properties/:id — /properties/[id] detail page (Phase 7). Used
// both for rendering the page body and for generateMetadata, so callers get
// null (never throw) on a 404/network failure and decide what to do with it
// (the page route calls next/navigation's notFound()).
export async function getPropertyById(id: string): Promise<Property | null> {
  if (!apiUrl) {
    return null;
  }

  try {
    const res = await fetch(`${apiUrl}/api/properties/${id}`, {
      next: { revalidate: 60 },
    });

    if (!res.ok) {
      return null;
    }

    return (await res.json()) as Property;
  } catch {
    return null;
  }
}
