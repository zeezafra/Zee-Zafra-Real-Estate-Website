import type { Area, Post, Property, SoldProperty } from "./types";

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

// GET /api/properties?status=AVAILABLE[&type=&listingType=&location=&minPrice=&maxPrice=&minBeds=&minBaths=&sort=&q=]
// /properties grid (Phase 7) + its filters/sort/search (Phase 8), extended
// with bed/bath minimums and a visitor-facing status filter in UI/UX Phase
// 3. AVAILABLE is still the *default* scope — an unfiltered call behaves
// exactly as it did before — but it's no longer hardcoded: a visitor can
// now opt into seeing RESERVED/SOLD listings, or `status: "ANY"` to drop
// the filter entirely. Same 60s revalidate window as the other list helpers
// so admin edits show up without a redeploy.
export type PropertyFilters = {
  type?: string;
  listingType?: string;
  location?: string;
  minPrice?: string;
  maxPrice?: string;
  // UI/UX Phase 3 — minimums, not exact counts (see MIN_ROOM_OPTIONS).
  minBeds?: string;
  minBaths?: string;
  // UI/UX Phase 3 — "" (or absent) means AVAILABLE; "ANY" means no filter.
  status?: string;
  sort?: string;
  q?: string;
};

export async function getProperties(filters: PropertyFilters = {}): Promise<Property[]> {
  if (!apiUrl) {
    return [];
  }

  const params = new URLSearchParams();

  // Resolved before the generic loop below so an empty/absent `status`
  // still lands on AVAILABLE rather than falling through as "no filter".
  const status = filters.status || "AVAILABLE";
  if (status !== "ANY") params.set("status", status);

  for (const [key, value] of Object.entries(filters)) {
    if (key === "status") continue;
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

// GET /api/properties?ids=a,b,c — /compare (Phase 26). Uses the list endpoint,
// not GET /:id, so comparing doesn't bump each listing's viewCount. Result is
// returned in the order the ids were requested, and silently omits any that
// no longer exist.
export async function getPropertiesByIds(ids: string[]): Promise<Property[]> {
  if (!apiUrl || ids.length === 0) {
    return [];
  }

  try {
    const res = await fetch(`${apiUrl}/api/properties?ids=${encodeURIComponent(ids.join(","))}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return [];
    const rows = (await res.json()) as Property[];
    return ids.map((id) => rows.find((p) => p.id === id)).filter((p): p is Property => Boolean(p));
  } catch {
    return [];
  }
}

// GET /api/properties/areas — homepage "Popular Areas" section and the
// /areas / /areas/[slug] neighborhood pages (Phase 15). Same 60s revalidate
// window as the other list helpers, so a newly-added listing's location
// shows up (or a location's count changes) without a redeploy.
export async function getAreas(): Promise<Area[]> {
  if (!apiUrl) {
    return [];
  }

  try {
    const res = await fetch(`${apiUrl}/api/properties/areas`, {
      next: { revalidate: 60 },
    });

    if (!res.ok) {
      return [];
    }

    return (await res.json()) as Area[];
  } catch {
    return [];
  }
}

// GET /api/properties/sold — the Recently Sold / Rented track record
// (homepage strip + /sold). Most recently closed first. Same 60s revalidate
// window as the other list helpers, so marking a listing sold in the admin
// shows up without a redeploy. Returns [] if the API is down so the page
// (and the homepage) still render, just without the section.
export async function getSoldProperties(limit = 60): Promise<SoldProperty[]> {
  if (!apiUrl) {
    return [];
  }

  try {
    const res = await fetch(`${apiUrl}/api/properties/sold?limit=${limit}`, {
      next: { revalidate: 60 },
    });

    if (!res.ok) {
      return [];
    }

    return (await res.json()) as SoldProperty[];
  } catch {
    return [];
  }
}

// GET /api/posts — /blog index and the homepage's LatestArticles section
// (Phase 16). Always published-only (see backend/src/routes/posts.js) —
// same "public endpoint enforces its own scope" contract as
// getFeaturedProperties/getProperties above. Same 60s revalidate window.
export async function getPosts(): Promise<Post[]> {
  if (!apiUrl) {
    return [];
  }

  try {
    const res = await fetch(`${apiUrl}/api/posts`, {
      next: { revalidate: 60 },
    });

    if (!res.ok) {
      return [];
    }

    return (await res.json()) as Post[];
  } catch {
    return [];
  }
}

// GET /api/posts/:slug — /blog/[slug] detail page (Phase 16). Same
// never-throw contract as getPropertyById: the caller decides what a null
// means (the page route calls notFound()).
export async function getPostBySlug(slug: string): Promise<Post | null> {
  if (!apiUrl) {
    return null;
  }

  try {
    const res = await fetch(`${apiUrl}/api/posts/${slug}`, {
      next: { revalidate: 60 },
    });

    if (!res.ok) {
      return null;
    }

    return (await res.json()) as Post;
  } catch {
    return null;
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
