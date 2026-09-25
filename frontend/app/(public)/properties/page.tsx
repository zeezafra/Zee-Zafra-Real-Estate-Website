import type { Metadata } from "next";
import { getProperties, type PropertyFilters } from "@/lib/api";
import { parsePriceRange } from "@/lib/types";
import PropertyCard from "@/components/site/PropertyCard";
import PropertyFilterForm from "@/components/site/PropertyFilterForm";

export const metadata: Metadata = {
  title: "Properties",
  description:
    "Browse available houses, condos, and commercial spaces from Zee Zafra Properties.",
};

type SearchParams = { [key: string]: string | string[] | undefined };

// Next passes multi-value params as string[] for repeated keys; this app
// never repeats a filter key, so collapse to the first value defensively.
function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function toFilters(searchParams: SearchParams): PropertyFilters {
  // UI/UX Phase 3: the homepage search bar submits one coarse `priceRange`
  // bucket because a single <select> can only carry one value. Expand it
  // here into the minPrice/maxPrice the API takes, so the filter panel
  // below renders real numbers in its inputs and a visitor can adjust them
  // directly. An explicit minPrice/maxPrice always wins — that's someone
  // who has already refined past the bucket.
  const range = parsePriceRange(first(searchParams.priceRange));

  return {
    type: first(searchParams.type),
    listingType: first(searchParams.listingType),
    location: first(searchParams.location),
    minPrice: first(searchParams.minPrice) ?? range.minPrice,
    maxPrice: first(searchParams.maxPrice) ?? range.maxPrice,
    minBeds: first(searchParams.minBeds),
    minBaths: first(searchParams.minBaths),
    status: first(searchParams.status),
    sort: first(searchParams.sort),
    q: first(searchParams.q),
  };
}

// No pagination yet — the roadmap flags this as needed "if the seed set
// grows"; today's seed data is small enough that a single page is fine.
// Filters/sort/search (Phase 8) all resolve to query params here, which
// PropertyFilterForm's native GET submission and the nav search box both
// write to directly — this page just reads them and asks the API.
export default async function PropertiesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const filters = toFilters(searchParams);
  const properties = await getProperties(filters);
  const q = first(searchParams.q);
  // The grid still defaults to available-only, so the count line can keep
  // saying "currently available" — but not once someone has opted into
  // reserved/sold listings via the Phase 3 status filter.
  const availableOnly = !filters.status;

  return (
    <main className="mx-auto max-w-6xl px-6 py-16 lg:px-10">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-gold">
          Listings
        </p>
        <h1 className="mt-1 text-3xl font-bold text-navy dark:text-offwhite">
          Available Properties
        </h1>
        <p className="mt-2 text-navy/60 dark:text-offwhite/60">
          {q ? (
            <>
              {properties.length} {properties.length === 1 ? "result" : "results"} for
              &ldquo;{q}&rdquo; —{" "}
              <a href="/properties" className="font-medium underline hover:text-gold">
                clear search
              </a>
            </>
          ) : (
            <>
              {properties.length} {properties.length === 1 ? "property" : "properties"}{" "}
              {availableOnly ? "currently available." : "matching your filters."}
            </>
          )}
        </p>
      </div>

      <div className="mt-8 rounded-2xl border border-navy/10 bg-white/60 p-5 dark:border-offwhite/10 dark:bg-white/5">
        <PropertyFilterForm filters={filters} />
      </div>

      {properties.length > 0 ? (
        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {properties.map((property) => (
            <PropertyCard key={property.id} property={property} />
          ))}
        </div>
      ) : (
        <p className="mt-10 text-navy/60 dark:text-offwhite/60">
          No properties match those filters — try widening your search.
        </p>
      )}
    </main>
  );
}
