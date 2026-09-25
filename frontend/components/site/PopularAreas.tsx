import Link from "next/link";
import { ArrowRight, MapPin } from "lucide-react";
import { getAreas } from "@/lib/api";
import { slugify } from "@/lib/slug";

// Phase 15. Flagged (not silently skipped) back in the Phase 14 README as
// overlapping this phase — Zee's updated reference screenshot shows a
// "Popular Areas" section on the homepage, between the featured grid and
// the closing CTA banner. Same card-grid shape as CategoryStrip, but
// data-driven off GET /api/properties/areas instead of the static
// CATEGORIES list, since "areas" are just distinct `location` values on
// real listings, not a fixed taxonomy.
//
// Async server component, same pattern as FeaturedListings — no client
// state needed, just a fetch at render time.
const AREAS_SHOWN = 6;

export default async function PopularAreas() {
  const areas = await getAreas();

  // Nothing to show yet (no listings, or the API is unreachable) — this is
  // a secondary section, so it disappears rather than rendering an empty
  // state the way FeaturedListings does for its primary content.
  if (areas.length === 0) {
    return null;
  }

  const topAreas = areas.slice(0, AREAS_SHOWN);

  return (
    <section className="mx-auto max-w-6xl px-6 py-16 lg:px-10">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-gold">
            Popular Areas
          </p>
          <h2 className="mt-1 text-2xl font-bold text-navy dark:text-offwhite sm:text-3xl">
            Explore by Neighborhood
          </h2>
        </div>
        <Link
          href="/areas"
          className="hidden shrink-0 items-center gap-1.5 text-sm font-semibold text-navy transition hover:text-gold dark:text-offwhite dark:hover:text-gold sm:flex"
        >
          View All Areas
          <ArrowRight size={16} />
        </Link>
      </div>

      <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3">
        {topAreas.map((area) => (
          <Link
            key={area.location}
            href={`/areas/${slugify(area.location)}`}
            className="group flex flex-col items-start gap-3 rounded-2xl border border-navy/10 bg-white p-5 transition hover:-translate-y-0.5 hover:border-gold hover:shadow-lg dark:border-offwhite/10 dark:bg-navy-light"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-navy text-gold transition group-hover:bg-gold group-hover:text-navy dark:bg-gold/10 dark:group-hover:bg-gold">
              <MapPin size={20} />
            </span>
            <span>
              <span className="block font-semibold text-navy dark:text-offwhite">
                {area.location}
              </span>
              <span className="mt-1 block text-sm text-navy/60 dark:text-offwhite/60">
                {area.count} {area.count === 1 ? "listing" : "listings"}
              </span>
            </span>
          </Link>
        ))}
      </div>

      <Link
        href="/areas"
        className="mt-8 flex items-center justify-center gap-1.5 text-sm font-semibold text-navy transition hover:text-gold dark:text-offwhite dark:hover:text-gold sm:hidden"
      >
        View All Areas
        <ArrowRight size={16} />
      </Link>
    </section>
  );
}
