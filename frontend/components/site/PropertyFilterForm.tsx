import {
  LISTING_TYPES,
  MIN_ROOM_OPTIONS,
  PRICE_RANGES,
  PROPERTY_TYPES,
  PUBLIC_STATUS_FILTERS,
  SORT_OPTIONS,
  toPriceRangeValue,
} from "@/lib/types";
import type { PropertyFilters } from "@/lib/api";

// Deliberately not a client component: a native GET form means submitting
// re-navigates to /properties?type=...&sort=..., which is exactly the
// "server-side query params, not client-side array filtering" behavior the
// roadmap asks for, and needs zero JS to work. Current values come from the
// URL (via the page's searchParams), so the form always reflects what's
// actually being shown, including on a fresh page load or shared link.
//
// Submitting this form replaces the whole query string with just these
// fields, so a `q` search from the nav search box is intentionally cleared
// once someone refines results with the filter panel below — the search box
// is a coarse starting point, this form is the precise one. The homepage
// search bar (UI/UX Phase 3) doesn't have that problem: it submits
// location/type/priceRange, all of which this form carries forward as real
// values, because the page expands priceRange into Min/Max before rendering.
//
// UI/UX Phase 3 adds three controls the roadmap calls for and Phase 8 never
// had — Beds, Baths, and Status — and regroups the panel into two labelled
// rows (what/where on top, how-big/how-much below) instead of one six-across
// line, which had started to read as an undifferentiated wall of inputs.
const fieldClass =
  "rounded-lg border border-navy/15 bg-white px-3 py-2 text-navy placeholder:text-navy/40 focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold dark:border-offwhite/15 dark:bg-navy-light dark:text-offwhite dark:placeholder:text-offwhite/40";

const labelClass = "flex flex-col gap-1 text-sm";

const legendClass =
  "text-xs font-semibold uppercase tracking-wide text-navy/40 dark:text-offwhite/40";

const captionClass = "font-medium text-navy/70 dark:text-offwhite/70";

export default function PropertyFilterForm({ filters }: { filters: PropertyFilters }) {
  return (
    <form action="/properties" method="GET" className="flex flex-col gap-5">
      <fieldset className="flex flex-col gap-3">
        <legend className={legendClass}>Property</legend>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <label className={`${labelClass} col-span-2 lg:col-span-1`}>
            <span className={captionClass}>Location</span>
            <input
              type="text"
              name="location"
              defaultValue={filters.location ?? ""}
              placeholder="e.g. Cebu City"
              className={fieldClass}
            />
          </label>

          <label className={labelClass}>
            <span className={captionClass}>Type</span>
            <select name="type" defaultValue={filters.type ?? ""} className={fieldClass}>
              <option value="">Any</option>
              {PROPERTY_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </label>

          <label className={labelClass}>
            <span className={captionClass}>Listing</span>
            <select
              name="listingType"
              defaultValue={filters.listingType ?? ""}
              className={fieldClass}
            >
              <option value="">Any</option>
              {LISTING_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </label>

          {/* UI/UX Phase 3. Defaults to "" = Available only, which is what
              /properties has always shown — the other options are an
              explicit opt-in to seeing reserved/sold listings. */}
          <label className={labelClass}>
            <span className={captionClass}>Status</span>
            <select name="status" defaultValue={filters.status ?? ""} className={fieldClass}>
              {PUBLIC_STATUS_FILTERS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-3">
        <legend className={legendClass}>Size &amp; budget</legend>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {/* Zee's 4 price bands (below ₱6M / ₱6M–₱10M / ₱10M–₱20M / ₱20M+),
              same PRICE_RANGES list and `priceRange` param the homepage
              search bar uses — see the file-level comment above. Replaces
              the old separate Min/Max number inputs with one select, since
              a buyer thinks in bands, not exact pesos. toPriceRangeValue
              reconstructs which band (if any) the current minPrice/maxPrice
              already match, so the right option is pre-selected on reload. */}
          <label className={`${labelClass} col-span-2`}>
            <span className={captionClass}>Price Range</span>
            <select
              name="priceRange"
              defaultValue={toPriceRangeValue(filters.minPrice, filters.maxPrice)}
              className={fieldClass}
            >
              {PRICE_RANGES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </label>

          {/* Minimums, not exact counts — "3+ beds" is how a buyer searches.
              Listings with no bed/bath count at all (vacant lots, some
              commercial units) drop out once either is set, which is the
              right behavior: they can't satisfy the requirement. */}
          <label className={labelClass}>
            <span className={captionClass}>Beds</span>
            <select name="minBeds" defaultValue={filters.minBeds ?? ""} className={fieldClass}>
              <option value="">Any</option>
              {MIN_ROOM_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>

          <label className={labelClass}>
            <span className={captionClass}>Baths</span>
            <select name="minBaths" defaultValue={filters.minBaths ?? ""} className={fieldClass}>
              <option value="">Any</option>
              {MIN_ROOM_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </fieldset>

      <div className="flex flex-wrap items-end justify-between gap-4 border-t border-navy/10 pt-4 dark:border-offwhite/10">
        <label className={`${labelClass} w-full sm:w-52`}>
          <span className={captionClass}>Sort by</span>
          <select name="sort" defaultValue={filters.sort ?? "newest"} className={fieldClass}>
            {SORT_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </label>

        <div className="flex items-center gap-4">
          <button
            type="submit"
            className="rounded-full bg-gold px-6 py-2.5 text-sm font-semibold text-navy transition hover:bg-gold-light"
          >
            Apply Filters
          </button>
          <a
            href="/properties"
            className="text-sm font-medium text-navy/60 transition hover:text-gold dark:text-offwhite/60"
          >
            Clear
          </a>
        </div>
      </div>
    </form>
  );
}
