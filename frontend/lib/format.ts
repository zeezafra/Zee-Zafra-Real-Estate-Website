import type { Property } from "./types";

// Human-facing reference number for a listing — e.g. "ZZ-0001" — distinct
// from the cuid `id` used in URLs/the database. Used wherever a listing
// needs to be referenced in conversation (phone, social media DM) rather
// than clicked as a link: the property card, the detail page, and the
// admin listings table. `refNo` itself is a Postgres SERIAL column (see
// prisma/schema.prisma) — this just formats it for display.
export function formatRefNo(refNo: number): string {
  return `ZZ-${String(refNo).padStart(4, "0")}`;
}

// `Property.price` is a required Int (no separate priceOnRequest flag/
// migration) — 0 is the admin's sentinel for "Price Upon Request" listings,
// so every surface that reads price should go through this instead of
// rendering the raw number, or a POA listing shows a broken-looking "₱0".
export function isPriceOnRequest(property: Pick<Property, "price">): boolean {
  return property.price === 0;
}

// The one function every surface (card, detail page, admin table, SEO
// metadata) should call to display a listing's price — resolves the
// Price Upon Request sentinel above instead of each caller re-checking it.
export function formatPrice(property: Pick<Property, "price">): string {
  return isPriceOnRequest(property) ? "Price Upon Request" : `₱${property.price.toLocaleString()}`;
}

// A listing counts as "price reduced" only once originalPrice is actually
// higher than the current price — an admin entry that's equal or lower
// (or null, the default) doesn't show the badge, and a Price Upon Request
// listing never does either, even if it happens to carry a stray
// originalPrice. Shared by PropertyCard, the detail page, and the admin
// table so the three can't drift.
export function isPriceReduced(
  property: Pick<Property, "price" | "originalPrice">
): boolean {
  return (
    !isPriceOnRequest(property) &&
    property.originalPrice !== null &&
    property.originalPrice > property.price
  );
}

// Phase 14: formats an Inquiry's raw "YYYY-MM-DD" preferredDate for
// display in the admin inbox. Parses the parts into a local Date
// explicitly (new Date("YYYY-MM-DD") parses as UTC midnight, which can
// display as the previous day in timezones behind UTC) rather than
// handing the string straight to the Date constructor.
export function formatPreferredDate(preferredDate: string): string {
  const [year, month, day] = preferredDate.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// Formats a raw "HH:MM" (24-hour) preferredTime as e.g. "2:30 PM".
export function formatPreferredTime(preferredTime: string): string {
  const [hours, minutes] = preferredTime.split(":").map(Number);
  const period = hours >= 12 ? "PM" : "AM";
  const hour12 = hours % 12 === 0 ? 12 : hours % 12;
  return `${hour12}:${String(minutes).padStart(2, "0")} ${period}`;
}

// Phase 19: nextFollowUpDate is stored as the same raw "YYYY-MM-DD" shape
// as preferredDate above, for the same reason (an admin-picked target
// date, not a timezone-aware timestamp) — so it reuses the exact same
// local-parts parsing to avoid the same UTC-midnight off-by-one-day bug.
export function formatFollowUpDate(nextFollowUpDate: string): string {
  return formatPreferredDate(nextFollowUpDate);
}

// True once a still-open inquiry's follow-up date has passed (compared
// as plain "YYYY-MM-DD" strings, which sort the same lexicographically
// as chronologically — see inquiries.js's todayManilaISODate for the
// same trick used server-side). Used to give overdue follow-ups a
// distinct visual treatment in the inbox and on the detail page.
export function isFollowUpOverdue(nextFollowUpDate: string | null): boolean {
  if (!nextFollowUpDate) return false;
  const todayManila = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Manila" }).format(
    new Date()
  );
  return nextFollowUpDate < todayManila;
}

// Phase 19: lastContactedAt IS a full ISO timestamp (unlike the
// YYYY-MM-DD fields above) since it records something that actually
// happened, not a planned date — no local-parts workaround needed.
export function formatLastContacted(lastContactedAt: string): string {
  return new Date(lastContactedAt).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

// Phase 16: formats a Post's `createdAt` (also its display date — see the
// schema comment on Post) for /blog, /blog/[slug], and the homepage
// LatestArticles section. A plain ISO timestamp handed straight to
// `new Date()` is fine here, unlike formatPreferredDate above — that one
// needed the local-parts workaround because "YYYY-MM-DD" alone parses as
// UTC midnight; a full ISO timestamp with a time component doesn't have
// that ambiguity.
export function formatPostDate(createdAt: string): string {
  return new Date(createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// Phase 20: formats a "YYYY-MM" bucket from GET /api/admin/analytics'
// byMonth (a raw date_trunc query — see the schema comment there) as
// "Jan 2026". Parsed as local-parts, same UTC-midnight-off-by-one
// avoidance as formatPreferredDate above — day is pinned to 1 since only
// month/year are ever displayed.
export function formatMonthLabel(month: string): string {
  const [year, monthNum] = month.split("-").map(Number);
  const date = new Date(year, monthNum - 1, 1);
  return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

// Phase 20: a 0..1 fraction (conversionRate, winRate) as "42.3%". Used only
// on the analytics page, where every rate is already that shape.
export function formatPercent(fraction: number): string {
  return `${(fraction * 100).toFixed(1)}%`;
}
