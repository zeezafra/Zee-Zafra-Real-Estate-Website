import { LISTING_TYPES, PROPERTY_TYPES, SORT_OPTIONS } from "@/lib/types";
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
// is a coarse starting point, this form is the precise one.
export default function PropertyFilterForm({ filters }: { filters: PropertyFilters }) {
  return (
    <form action="/properties" method="GET" className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
      <label className="col-span-2 flex flex-col gap-1 text-sm sm:col-span-1">
        <span className="font-medium text-navy/70 dark:text-offwhite/70">Type</span>
        <select
          name="type"
          defaultValue={filters.type ?? ""}
          className="rounded-lg border border-navy/15 bg-white px-3 py-2 text-navy dark:border-offwhite/15 dark:bg-navy-light dark:text-offwhite"
        >
          <option value="">Any</option>
          {PROPERTY_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </label>

      <label className="col-span-2 flex flex-col gap-1 text-sm sm:col-span-1">
        <span className="font-medium text-navy/70 dark:text-offwhite/70">Listing</span>
        <select
          name="listingType"
          defaultValue={filters.listingType ?? ""}
          className="rounded-lg border border-navy/15 bg-white px-3 py-2 text-navy dark:border-offwhite/15 dark:bg-navy-light dark:text-offwhite"
        >
          <option value="">Any</option>
          {LISTING_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </label>

      <label className="col-span-2 flex flex-col gap-1 text-sm sm:col-span-1">
        <span className="font-medium text-navy/70 dark:text-offwhite/70">Location</span>
        <input
          type="text"
          name="location"
          defaultValue={filters.location ?? ""}
          placeholder="e.g. Cebu City"
          className="rounded-lg border border-navy/15 bg-white px-3 py-2 text-navy placeholder:text-navy/40 dark:border-offwhite/15 dark:bg-navy-light dark:text-offwhite dark:placeholder:text-offwhite/40"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-navy/70 dark:text-offwhite/70">Min Price</span>
        <input
          type="number"
          name="minPrice"
          min={0}
          defaultValue={filters.minPrice ?? ""}
          placeholder="₱0"
          className="rounded-lg border border-navy/15 bg-white px-3 py-2 text-navy placeholder:text-navy/40 dark:border-offwhite/15 dark:bg-navy-light dark:text-offwhite dark:placeholder:text-offwhite/40"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-navy/70 dark:text-offwhite/70">Max Price</span>
        <input
          type="number"
          name="maxPrice"
          min={0}
          defaultValue={filters.maxPrice ?? ""}
          placeholder="No limit"
          className="rounded-lg border border-navy/15 bg-white px-3 py-2 text-navy placeholder:text-navy/40 dark:border-offwhite/15 dark:bg-navy-light dark:text-offwhite dark:placeholder:text-offwhite/40"
        />
      </label>

      <label className="col-span-2 flex flex-col gap-1 text-sm sm:col-span-1">
        <span className="font-medium text-navy/70 dark:text-offwhite/70">Sort</span>
        <select
          name="sort"
          defaultValue={filters.sort ?? "newest"}
          className="rounded-lg border border-navy/15 bg-white px-3 py-2 text-navy dark:border-offwhite/15 dark:bg-navy-light dark:text-offwhite"
        >
          {SORT_OPTIONS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </label>

      <div className="col-span-2 flex items-end gap-3 sm:col-span-3 lg:col-span-6">
        <button
          type="submit"
          className="rounded-full bg-gold px-6 py-2 text-sm font-semibold text-navy transition hover:bg-gold-light"
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
    </form>
  );
}
