import { cookies } from "next/headers";
import type {
  GuideLeadRow,
  InquiryAnalytics,
  InquiryNote,
  InquirySource,
  InquiryStats,
  InquiryStatus,
  InquiryType,
  Post,
  Property,
  SavedSearchRow,
} from "./types";

// Must match ADMIN_COOKIE_NAME in backend/src/lib/cookieOptions.js.
const ADMIN_COOKIE_NAME = "zzp_admin_token";

export type AdminSession = { email: string };

// Server-only: reads the admin cookie out of the incoming request and asks
// the backend to verify it via GET /api/admin/me. We deliberately don't
// verify the JWT here in the frontend — that would mean sharing JWT_SECRET
// across two separately-deployed apps (Vercel + Render) for no real
// benefit, when the backend can just tell us yes/no.
export async function getAdminSession(): Promise<AdminSession | null> {
  const token = cookies().get(ADMIN_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  const apiUrl = process.env.API_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL;

  if (!apiUrl) {
    return null;
  }

  try {
    const res = await fetch(`${apiUrl}/api/admin/me`, {
      headers: { cookie: `${ADMIN_COOKIE_NAME}=${token}` },
      cache: "no-store",
    });

    if (!res.ok) {
      return null;
    }

    return (await res.json()) as AdminSession;
  } catch {
    return null;
  }
}

export type AdminInquiry = {
  id: string;
  // Phase 13. Always present — the backend column defaults to "BUYER", so
  // every inquiry created before this phase reads as that once the
  // migration runs.
  type: InquiryType;
  // Phase 18. Same "column defaults, so every existing row already has
  // one once the migration runs" story as `type` above.
  status: InquiryStatus;
  name: string;
  email: string | null;
  phone: string | null;
  message: string;
  propertyId: string | null;
  property: {
    id: string;
    title: string;
    location: string;
    refNo: number;
    status: string;
  } | null;
  // Phase 14. Both null for every inquiry except a viewing request
  // submitted via the property detail page's ViewingModal — see the
  // schema comment on Inquiry for why these are plain strings.
  preferredDate: string | null;
  preferredTime: string | null;
  // Phase 19.
  nextFollowUpDate: string | null;
  lastContactedAt: string | null;
  archived: boolean;
  // Phase 20. `spam` is a separate axis from archived/status — see the
  // schema comment. `closedAt` is set when status enters CLOSED_WON/
  // CLOSED_LOST and cleared if it leaves.
  spam: boolean;
  source: InquirySource;
  closedAt: string | null;
  notes?: InquiryNote[];
  createdAt: string;
};

// Phase 18. Every field optional and forwarded as-is to the matching
// backend query param — see adminInquiries.js for how each combines.
export type AdminInquiryFilters = {
  type?: InquiryType;
  status?: InquiryStatus;
  q?: string;
  dateFrom?: string;
  dateTo?: string;
  archived?: boolean;
  // Phase 20. Opt-in, same as `archived` — the default inbox shows
  // neither archived nor spam.
  spam?: boolean;
};

// Phase 10: same cookie-forwarding trick as getAdminSession above, since
// GET /api/admin/inquiries is behind requireAdmin on the backend and a
// server component's fetch doesn't automatically carry the browser's
// cookies. Returns [] on any failure (no session, no apiUrl, network
// error) rather than throwing — the page renders an empty inbox instead
// of crashing, same failure mode as getAllProperties in the dashboard.
//
// Phase 13: optional `type` filter. Phase 18: broadened to the full
// AdminInquiryFilters shape (status/search/date range) — same "forwarded
// as-is to the backend query string" approach, just more of them.
export async function getAdminInquiries(
  filters: AdminInquiryFilters = {}
): Promise<AdminInquiry[]> {
  const token = cookies().get(ADMIN_COOKIE_NAME)?.value;
  const apiUrl = process.env.API_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL;

  if (!token || !apiUrl) {
    return [];
  }

  const params = new URLSearchParams();
  if (filters.type) params.set("type", filters.type);
  if (filters.status) params.set("status", filters.status);
  if (filters.q) params.set("q", filters.q);
  if (filters.dateFrom) params.set("dateFrom", filters.dateFrom);
  if (filters.dateTo) params.set("dateTo", filters.dateTo);
  if (filters.archived) params.set("archived", "true");
  if (filters.spam) params.set("spam", "true");
  const query = params.toString() ? `?${params.toString()}` : "";

  try {
    const res = await fetch(`${apiUrl}/api/admin/inquiries${query}`, {
      headers: { cookie: `${ADMIN_COOKIE_NAME}=${token}` },
      cache: "no-store",
    });

    if (!res.ok) {
      return [];
    }

    return (await res.json()) as AdminInquiry[];
  } catch {
    return [];
  }
}

// Phase 18. Backs /admin/inquiries/[id]. Returns null on any failure
// (no session, no apiUrl, network error, 404) — the page renders a
// "not found" state instead of crashing.
export async function getAdminInquiry(id: string): Promise<AdminInquiry | null> {
  const token = cookies().get(ADMIN_COOKIE_NAME)?.value;
  const apiUrl = process.env.API_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL;

  if (!token || !apiUrl) {
    return null;
  }

  try {
    const res = await fetch(`${apiUrl}/api/admin/inquiries/${id}`, {
      headers: { cookie: `${ADMIN_COOKIE_NAME}=${token}` },
      cache: "no-store",
    });

    if (!res.ok) {
      return null;
    }

    return (await res.json()) as AdminInquiry;
  } catch {
    return null;
  }
}

// Phase 19. Backs the stats bar at the top of /admin/inquiries. Returns
// null on any failure — the page hides the stats bar entirely rather
// than showing zeroes that could be mistaken for a real empty inbox.
export async function getAdminInquiryStats(): Promise<InquiryStats | null> {
  const token = cookies().get(ADMIN_COOKIE_NAME)?.value;
  const apiUrl = process.env.API_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL;

  if (!token || !apiUrl) {
    return null;
  }

  try {
    const res = await fetch(`${apiUrl}/api/admin/inquiries/stats`, {
      headers: { cookie: `${ADMIN_COOKIE_NAME}=${token}` },
      cache: "no-store",
    });

    if (!res.ok) {
      return null;
    }

    return (await res.json()) as InquiryStats;
  } catch {
    return null;
  }
}

// Phase 20. Backs /admin/analytics. `days` is validated server-side
// against a fixed allow-list (7/30/90/365/0-for-all-time), so an
// unexpected value falls back to 30 rather than erroring. Returns null on
// any failure — the page renders an explanatory empty state instead of
// half-populated charts.
export async function getAdminAnalytics(days: number): Promise<InquiryAnalytics | null> {
  const token = cookies().get(ADMIN_COOKIE_NAME)?.value;
  const apiUrl = process.env.API_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL;

  if (!token || !apiUrl) {
    return null;
  }

  try {
    const res = await fetch(`${apiUrl}/api/admin/analytics?days=${days}`, {
      headers: { cookie: `${ADMIN_COOKIE_NAME}=${token}` },
      cache: "no-store",
    });

    if (!res.ok) {
      return null;
    }

    return (await res.json()) as InquiryAnalytics;
  } catch {
    return null;
  }
}

// Phase 16: same cookie-forwarding trick as getAdminInquiries above, for
// GET /api/admin/posts (behind requireAdmin — unlike GET /api/posts,
// which is public and published-only). Feeds the /admin/posts dashboard,
// which — unlike the Listings dashboard's getAllProperties — can't just
// call the public endpoint, since drafts only ever show up here.
export async function getAdminPosts(): Promise<Post[]> {
  const token = cookies().get(ADMIN_COOKIE_NAME)?.value;
  const apiUrl = process.env.API_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL;

  if (!token || !apiUrl) {
    return [];
  }

  try {
    const res = await fetch(`${apiUrl}/api/admin/posts`, {
      headers: { cookie: `${ADMIN_COOKIE_NAME}=${token}` },
      cache: "no-store",
    });

    if (!res.ok) {
      return [];
    }

    return (await res.json()) as Post[];
  } catch {
    return [];
  }
}

// Phase 26. Backs /admin/subscribers. null on failure so the page can say
// "couldn't load" instead of showing an empty list that looks like zero
// subscribers.
export async function getAdminAlerts(): Promise<SavedSearchRow[] | null> {
  const token = cookies().get(ADMIN_COOKIE_NAME)?.value;
  const apiUrl = process.env.API_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL;
  if (!token || !apiUrl) return null;

  try {
    const res = await fetch(`${apiUrl}/api/admin/alerts`, {
      headers: { cookie: `${ADMIN_COOKIE_NAME}=${token}` },
      cache: "no-store",
    });
    if (!res.ok) return null;
    return (await res.json()) as SavedSearchRow[];
  } catch {
    return null;
  }
}

// Trust & polish. Backs /admin/guide-leads. null on failure so the page can
// say "couldn't load" instead of an empty list that reads as zero leads.
export async function getAdminGuideLeads(): Promise<GuideLeadRow[] | null> {
  const token = cookies().get(ADMIN_COOKIE_NAME)?.value;
  const apiUrl = process.env.API_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL;
  if (!token || !apiUrl) return null;

  try {
    const res = await fetch(`${apiUrl}/api/admin/guide-leads`, {
      headers: { cookie: `${ADMIN_COOKIE_NAME}=${token}` },
      cache: "no-store",
    });
    if (!res.ok) return null;
    return (await res.json()) as GuideLeadRow[];
  } catch {
    return null;
  }
}

// Phase 27. Admin-scoped counterpart to lib/api.ts's getProperties() —
// returns every status including DRAFT, which the public route now hard-
// excludes. Backs the admin dashboard table and the edit page.
export async function getAdminProperties(): Promise<Property[]> {
  const token = cookies().get(ADMIN_COOKIE_NAME)?.value;
  const apiUrl = process.env.API_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL;
  if (!token || !apiUrl) return [];

  try {
    const res = await fetch(`${apiUrl}/api/admin/properties`, {
      headers: { cookie: `${ADMIN_COOKIE_NAME}=${token}` },
      cache: "no-store",
    });
    if (!res.ok) return [];
    return (await res.json()) as Property[];
  } catch {
    return [];
  }
}

export async function getAdminProperty(id: string): Promise<Property | null> {
  const token = cookies().get(ADMIN_COOKIE_NAME)?.value;
  const apiUrl = process.env.API_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL;
  if (!token || !apiUrl) return null;

  try {
    const res = await fetch(`${apiUrl}/api/admin/properties/${id}`, {
      headers: { cookie: `${ADMIN_COOKIE_NAME}=${token}` },
      cache: "no-store",
    });
    if (!res.ok) return null;
    return (await res.json()) as Property;
  } catch {
    return null;
  }
}

// Phase 27. Backs /admin/calendar — every inquiry carrying a viewing
// preference, for the admin to see at a glance rather than scanning the
// inbox. null on failure so the page can say so instead of showing an
// empty calendar that looks like there's nothing booked.
export async function getAdminViewings(): Promise<ViewingInquiry[] | null> {
  const token = cookies().get(ADMIN_COOKIE_NAME)?.value;
  const apiUrl = process.env.API_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL;
  if (!token || !apiUrl) return null;

  try {
    const res = await fetch(`${apiUrl}/api/admin/inquiries/viewings`, {
      headers: { cookie: `${ADMIN_COOKIE_NAME}=${token}` },
      cache: "no-store",
    });
    if (!res.ok) return null;
    return (await res.json()) as ViewingInquiry[];
  } catch {
    return null;
  }
}

// Shape returned by GET /api/admin/inquiries/viewings.
export type ViewingInquiry = {
  id: string;
  type: InquiryType;
  status: InquiryStatus;
  name: string;
  email: string | null;
  phone: string | null;
  message: string;
  preferredDate: string;
  preferredTime: string | null;
  property: { id: string; title: string; location: string; refNo: number; status: string } | null;
};
