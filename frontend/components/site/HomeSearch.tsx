import { Search } from "lucide-react";
import { getAreas } from "@/lib/api";
import { PRICE_RANGES, PROPERTY_TYPES } from "@/lib/types";

// UI/UX Phase 3 — the homepage entry point into /properties.
//
// Deliberately a plain native GET form, same call made for
// PropertyFilterForm back in Phase 8: submitting navigates to
// /properties?location=...&type=...&priceRange=..., which is a real,
// shareable, server-rendered URL and needs zero JavaScript. This is the
// *coarse* entry point — three fields, matching the roadmap's
// "[ Location ] [ Property Type ] [ Price Range ] [ Search ]" — and the
// filter panel already on /properties is where a visitor refines from
// there. It does not reimplement any filtering logic; the page it links to
// owns all of that.
//
// `priceRange` is one param instead of the minPrice/maxPrice pair the API
// takes, because a single <select> can only submit one name/value. The
// /properties page expands it (see parsePriceRange in lib/types.ts), so the
// filter panel below still shows real numbers in its Min/Max inputs.
//
// Async server component: the location <datalist> is built from the same
// GET /api/properties/areas the Phase 15 Popular Areas section uses, so the
// suggestions are always real locations that will actually return results.
// getAreas() never throws (returns [] on failure), so an API outage costs
// the autocomplete, not the search box.
export default async function HomeSearch() {
  const areas = await getAreas();

  return (
    <section className="mx-auto max-w-6xl px-6 pt-14 lg:px-10">
      <div className="rounded-3xl border border-navy/10 bg-white p-6 shadow-xl shadow-navy/5 dark:border-offwhite/10 dark:bg-navy-light dark:shadow-black/20 sm:p-8">
        <h2 className="text-2xl font-bold text-navy dark:text-offwhite">
          What are you looking for?
        </h2>
        <p className="mt-1 text-sm text-navy/60 dark:text-offwhite/60">
          Start broad here — you can narrow by beds, baths, and listing type on
          the results page.
        </p>

        <form
          action="/properties"
          method="GET"
          className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_auto]"
        >
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-navy/70 dark:text-offwhite/70">
              Location
            </span>
            <input
              type="text"
              name="location"
              list="home-search-areas"
              placeholder="City, town, or area"
              className="rounded-xl border border-navy/15 bg-white px-4 py-3 text-navy placeholder:text-navy/40 focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold dark:border-offwhite/15 dark:bg-navy dark:text-offwhite dark:placeholder:text-offwhite/40"
            />
            {areas.length > 0 && (
              <datalist id="home-search-areas">
                {areas.map((area) => (
                  <option key={area.location} value={area.location} />
                ))}
              </datalist>
            )}
          </label>

          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-navy/70 dark:text-offwhite/70">
              Property Type
            </span>
            <select
              name="type"
              defaultValue=""
              className="rounded-xl border border-navy/15 bg-white px-4 py-3 text-navy focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold dark:border-offwhite/15 dark:bg-navy dark:text-offwhite"
            >
              <option value="">Any type</option>
              {PROPERTY_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-navy/70 dark:text-offwhite/70">
              Price Range
            </span>
            <select
              name="priceRange"
              defaultValue=""
              className="rounded-xl border border-navy/15 bg-white px-4 py-3 text-navy focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold dark:border-offwhite/15 dark:bg-navy dark:text-offwhite"
            >
              {PRICE_RANGES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </label>

          <div className="flex items-end">
            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gold px-8 py-3 font-semibold text-navy shadow-sm transition hover:bg-gold-light lg:w-auto"
            >
              <Search size={18} />
              Search
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
