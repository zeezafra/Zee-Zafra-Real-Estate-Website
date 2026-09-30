// Keep these in sync with backend/prisma/schema.prisma.

export type PropertyType =
  | "HOUSE_AND_LOT"
  | "CONDO"
  | "TOWNHOUSE"
  | "COMMERCIAL"
  | "VACANT_LOT";

export type ListingType = "FOR_SALE" | "FOR_RENT";

export type PropertyStatus = "AVAILABLE" | "SOLD" | "RESERVED" | "DRAFT";

export type Property = {
  id: string;
  // Phase 12: sequential, human-facing reference number — format with
  // formatRefNo() from lib/format.ts rather than displaying the raw int.
  refNo: number;
  title: string;
  type: PropertyType;
  listingType: ListingType;
  status: PropertyStatus;
  price: number;
  // Phase 12: set by the admin when this listing's price was cut. Only
  // treat it as an actual reduction when it's greater than `price` — use
  // isPriceReduced() from lib/format.ts rather than comparing inline.
  originalPrice: number | null;
  rentPeriod: string | null;
  location: string;
  beds: number | null;
  baths: number | null;
  carSpaces: number | null;
  sqm: number;
  description: string;
  images: string[];
  featured: boolean;
  // Phase 23: running all-time counter, incremented server-side on each
  // GET /api/properties/:id — see the schema comment for why this is a
  // plain counter rather than a events table.
  viewCount: number;
  // Phase 24: running all-time counter, incremented/decremented client-side
  // by the heart button (see useSavedListings.toggleSaved) — same shape as
  // viewCount, since favorites themselves are localStorage-only.
  favoriteCount: number;
  // Phase 25: optional map pin (both set or both null) and optional
  // video/virtual-tour link — see lib/video.ts for how the URL is embedded.
  latitude: number | null;
  longitude: number | null;
  videoUrl: string | null;
  // Phase 27: scheduled auto-publish time, meaningful only while status is DRAFT.
  publishAt: string | null;
  // Trust & polish: ISO date the deal closed (SOLD listings only). Set
  // automatically when status becomes SOLD, or by hand in the admin form.
  soldAt: string | null;
  createdAt: string;
  updatedAt: string;
};

// Trust & polish: the trimmed shape GET /api/properties/sold returns for the
// Recently Sold / Rented track record (no description, no view counters).
export type SoldProperty = Pick<
  Property,
  | "id"
  | "refNo"
  | "title"
  | "type"
  | "listingType"
  | "status"
  | "price"
  | "rentPeriod"
  | "location"
  | "beds"
  | "baths"
  | "carSpaces"
  | "sqm"
  | "images"
  | "soldAt"
  | "updatedAt"
>;

export const PROPERTY_TYPES: { value: PropertyType; label: string }[] = [
  { value: "HOUSE_AND_LOT", label: "House & Lot" },
  { value: "CONDO", label: "Condo" },
  { value: "TOWNHOUSE", label: "Townhouse" },
  { value: "COMMERCIAL", label: "Commercial" },
  { value: "VACANT_LOT", label: "Vacant Lot" },
];

export const LISTING_TYPES: { value: ListingType; label: string }[] = [
  { value: "FOR_SALE", label: "For Sale" },
  { value: "FOR_RENT", label: "For Rent" },
];

export const PROPERTY_STATUSES: { value: PropertyStatus; label: string }[] = [
  { value: "AVAILABLE", label: "Available" },
  { value: "SOLD", label: "Sold" },
  { value: "RESERVED", label: "Reserved" },
  // Phase 27. Admin-only — never returned by the public API.
  { value: "DRAFT", label: "Draft" },
];

// UI/UX Phase 3. Bedroom/bathroom filters are minimums ("3+"), not exact
// counts — that's how a buyer thinks about it, and it matches the backend's
// `gte` treatment of ?minBeds= / ?minBaths=. Shared by the /properties
// filter panel so the labels and the values can't drift apart.
export const MIN_ROOM_OPTIONS: { value: string; label: string }[] = [
  { value: "1", label: "1+" },
  { value: "2", label: "2+" },
  { value: "3", label: "3+" },
  { value: "4", label: "4+" },
  { value: "5", label: "5+" },
];

// UI/UX Phase 3. What a visitor may set `status` to on the public grid.
// The empty value means "leave it to the default", which lib/api.ts
// resolves to AVAILABLE — so an unfiltered /properties keeps behaving
// exactly as it has since Phase 7. "ANY" is the explicit opt-in to seeing
// sold/reserved listings too (useful as social proof; a visitor who wants
// it has to ask for it).
export const PUBLIC_STATUS_FILTERS: { value: string; label: string }[] = [
  { value: "", label: "Available only" },
  { value: "RESERVED", label: "Reserved" },
  { value: "SOLD", label: "Sold" },
  { value: "ANY", label: "Any status" },
];

// UI/UX Phase 3, later narrowed to 4 bands at Zee's request. Coarse price
// buckets shared by the homepage search bar (HomeSearch) and the
// /properties filter panel (PropertyFilterForm), where a single <select>
// stands in for two number inputs. Encoded as "min-max" (an empty half
// means unbounded) so the whole thing rides in one query param,
// `?priceRange=`, which /properties then expands back into
// minPrice/maxPrice — see parsePriceRange below. Peso figures, matching
// the rest of the site.
export const PRICE_RANGES: { value: string; label: string }[] = [
  { value: "", label: "Any price" },
  { value: "-6000000", label: "Below \u20B16M" },
  { value: "6000000-10000000", label: "\u20B16M \u2013 \u20B110M" },
  { value: "10000000-20000000", label: "\u20B110M \u2013 \u20B120M" },
  { value: "20000000-", label: "\u20B120M+" },
];

// Turns a `?priceRange=6000000-12000000` value back into the minPrice /
// maxPrice pair the API actually takes. Anything malformed resolves to an
// empty object, so a hand-edited URL degrades to "no price filter" rather
// than erroring.
export function parsePriceRange(range: string | undefined): {
  minPrice?: string;
  maxPrice?: string;
} {
  if (!range || !range.includes("-")) return {};
  const [min, max] = range.split("-");
  const out: { minPrice?: string; maxPrice?: string } = {};
  if (/^\d+$/.test(min)) out.minPrice = min;
  if (/^\d+$/.test(max)) out.maxPrice = max;
  return out;
}

// The reverse of parsePriceRange — used to pick the right <option> in the
// /properties filter panel's Price Range select when the page loads with
// minPrice/maxPrice already resolved (either from a `priceRange` bucket the
// homepage search bar sent, or from an old bookmarked/shared link that still
// has explicit minPrice/maxPrice in it). Falls back to "" (Any price) for
// anything that isn't an exact match to one of PRICE_RANGES' bands, rather
// than inventing a new option for it.
export function toPriceRangeValue(minPrice?: string, maxPrice?: string): string {
  if (!minPrice && !maxPrice) return "";
  const candidate = `${minPrice ?? ""}-${maxPrice ?? ""}`;
  return PRICE_RANGES.some((r) => r.value === candidate) ? candidate : "";
}

// Mirrors SORT_OPTIONS in backend/src/routes/properties.js — keep in sync.
export const SORT_OPTIONS: { value: string; label: string }[] = [
  { value: "newest", label: "Newest" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
];

// Phase 13. BUYER covers every inquiry the site already created before
// this phase (nav "Inquire Now", CTA banner, property detail page) — the
// backend defaults to it, so those call sites never need to send this.
// SELLER is new, sent only by SellerLeadForm on /sell.
export type InquiryType = "BUYER" | "SELLER";

export const INQUIRY_TYPES: { value: InquiryType; label: string }[] = [
  { value: "BUYER", label: "Buyer" },
  { value: "SELLER", label: "Seller" },
];

// Phase 18. A small sales-pipeline funnel — see the schema comment on
// Inquiry.status for why CLOSED_WON/CLOSED_LOST are kept separate rather
// than a single CLOSED value.
export type InquiryStatus =
  | "NEW"
  | "CONTACTED"
  | "FOLLOW_UP"
  | "VIEWING_SCHEDULED"
  | "NEGOTIATING"
  | "CLOSED_WON"
  | "CLOSED_LOST";

export const INQUIRY_STATUSES: { value: InquiryStatus; label: string }[] = [
  { value: "NEW", label: "New" },
  { value: "CONTACTED", label: "Contacted" },
  { value: "FOLLOW_UP", label: "Follow-up" },
  { value: "VIEWING_SCHEDULED", label: "Viewing Scheduled" },
  { value: "NEGOTIATING", label: "Negotiating" },
  { value: "CLOSED_WON", label: "Closed — Won" },
  { value: "CLOSED_LOST", label: "Closed — Lost" },
];

// Tailwind class pairs per status, shared by the list badge and the
// detail page's status control so they never drift out of sync.
export const INQUIRY_STATUS_STYLES: Record<InquiryStatus, string> = {
  NEW: "bg-blue-500/15 text-blue-700 dark:text-blue-400",
  CONTACTED: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  FOLLOW_UP: "bg-purple-500/15 text-purple-700 dark:text-purple-400",
  VIEWING_SCHEDULED: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  NEGOTIATING: "bg-orange-500/15 text-orange-700 dark:text-orange-400",
  CLOSED_WON: "bg-green-600/15 text-green-700 dark:text-green-400",
  CLOSED_LOST: "bg-navy/10 text-navy/50 dark:bg-offwhite/10 dark:text-offwhite/50",
};

// Phase 19. A note is either something the admin typed (a call log, an
// SMS follow-up) or auto-generated by the backend whenever status,
// follow-up date, or archive state changes via PATCH — see the schema
// comment on InquiryNote. Both render in the same timeline, styled
// differently.
export type InquiryNoteType = "MANUAL" | "SYSTEM";

export type InquiryNote = {
  id: string;
  type: InquiryNoteType;
  content: string;
  createdAt: string;
};

// Phase 19. Mirrors GET /api/admin/inquiries/stats — always computed over
// the whole (non-archived) inbox, independent of whatever filters the
// list view currently has applied.
export type InquiryStats = {
  total: number;
  new: number;
  followUp: number;
  closed: number;
  overdueFollowUps: number;
  // Phase 20. All-time count of flagged submissions — the only figure
  // here that isn't scoped to the active (non-archived, non-spam) inbox,
  // since it's what the Spam view's badge counts.
  spam: number;
  byStatus: Record<InquiryStatus, number>;
};

// Phase 20. Where a lead came in from — set per call site by the
// frontend, not inferred on the backend (the nav CTA and the closing CTA
// banner submit byte-identical payloads otherwise). Mirrors the
// InquirySource enum in backend/prisma/schema.prisma.
export type InquirySource =
  | "NAV_CTA"
  | "PROPERTY_PAGE"
  | "CTA_BANNER"
  | "VIEWING_FORM"
  | "SELL_PAGE"
  | "DIRECT";

export const INQUIRY_SOURCE_LABELS: Record<InquirySource, string> = {
  NAV_CTA: "Nav \u201cInquire Now\u201d",
  PROPERTY_PAGE: "Property detail page",
  CTA_BANNER: "Homepage CTA banner",
  VIEWING_FORM: "Book a Viewing form",
  SELL_PAGE: "Sell Your Property page",
  DIRECT: "Unknown / direct",
};

// Phase 20. Mirrors GET /api/admin/analytics. `avgDaysToClose` is null
// until at least one lead has actually closed — rendered as an em dash
// rather than 0, which would read as "closes same day".
export type InquiryAnalytics = {
  range: { days: number };
  totals: {
    allTime: number;
    inRange: number;
    buyers: number;
    sellers: number;
    viewingRequests: number;
    spamBlocked: number;
    open: number;
  };
  byStatus: Record<InquiryStatus, number>;
  conversion: {
    closedWon: number;
    closedLost: number;
    closedTotal: number;
    // Of everything that came in. Drags down while leads are in progress.
    conversionRate: number;
    // Of everything that reached a decision. Ignores work in progress.
    winRate: number;
    avgDaysToClose: number | null;
  };
  bySource: { source: InquirySource; count: number; won: number }[];
  topProperties: {
    id: string;
    refNo: number;
    title: string;
    location: string;
    status: PropertyStatus;
    inquiries: number;
    won: number;
  }[];
  // Phase 23. All-time (not scoped to `range.days` — see the backend
  // comment on why viewCount can't respect a date range yet).
  topViewedProperties: {
    id: string;
    refNo: number;
    title: string;
    location: string;
    status: PropertyStatus;
    viewCount: number;
  }[];
  // Phase 24. Same all-time framing as topViewedProperties above.
  topFavoritedProperties: {
    id: string;
    refNo: number;
    title: string;
    location: string;
    status: PropertyStatus;
    favoriteCount: number;
  }[];
  byMonth: { month: string; count: number; won: number }[];
};

// Phase 15: one distinct `Property.location` value with how many AVAILABLE
// listings share it. Returned by GET /api/properties/areas — see
// lib/slug.ts for how a location turns into an /areas/[slug] URL.
export type Area = {
  location: string;
  count: number;
};

// Phase 16: a market-insights blog post. `slug` is chosen at creation (see
// the schema comment on Post) rather than always derived from `title`, so
// editing the title later can't break a link someone already shared.
// `createdAt` is also the post's display date — see the schema comment on
// why there's no separate `publishedAt`.
export type Post = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  coverImage: string | null;
  published: boolean;
  // Phase 27: scheduled auto-publish time, meaningful only while published is false.
  publishAt: string | null;
  createdAt: string;
  updatedAt: string;
};

// Phase 26: row shape for GET /api/admin/alerts (the subscriber's token is
// deliberately never sent to the admin UI).
// Trust & polish: a row in /admin/guide-leads.
export type GuideLeadRow = {
  id: string;
  email: string;
  name: string | null;
  guide: string;
  createdAt: string;
};

export type SavedSearchRow = {
  id: string;
  email: string;
  name: string | null;
  location: string | null;
  type: PropertyType | null;
  listingType: ListingType | null;
  minPrice: number | null;
  maxPrice: number | null;
  minBeds: number | null;
  confirmedAt: string | null;
  lastNotifiedAt: string | null;
  createdAt: string;
};
