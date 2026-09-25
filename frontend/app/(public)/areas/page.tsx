import type { Metadata } from "next";
import Link from "next/link";
import { MapPin } from "lucide-react";
import { getAreas } from "@/lib/api";
import { slugify } from "@/lib/slug";

export const metadata: Metadata = {
  title: "Areas",
  description:
    "Browse Zee Zafra Properties listings by neighborhood and location.",
};

// Phase 15. Full directory version of the homepage's PopularAreas section
// (which only shows the top 6) — every distinct AVAILABLE `location`, each
// linking to its own /areas/[slug] page. Same data source
// (GET /api/properties/areas), just unsliced and sorted alphabetically
// instead of by listing count, since this page's job is "find your area",
// not "show what's popular".
export default async function AreasPage() {
  const areas = await getAreas();
  const sorted = [...areas].sort((a, b) => a.location.localeCompare(b.location));

  return (
    <main className="mx-auto max-w-6xl px-6 py-16 lg:px-10">
      <p className="text-sm font-semibold uppercase tracking-wide text-gold">
        Neighborhoods
      </p>
      <h1 className="mt-1 text-3xl font-bold text-navy dark:text-offwhite">
        Browse by Area
      </h1>
      <p className="mt-2 text-navy/60 dark:text-offwhite/60">
        {sorted.length > 0
          ? `${sorted.length} ${sorted.length === 1 ? "area" : "areas"} with available listings.`
          : "No areas with available listings yet."}
      </p>

      {sorted.length > 0 ? (
        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sorted.map((area) => (
            <Link
              key={area.location}
              href={`/areas/${slugify(area.location)}`}
              className="group flex items-center gap-3 rounded-2xl border border-navy/10 bg-white p-5 transition hover:-translate-y-0.5 hover:border-gold hover:shadow-lg dark:border-offwhite/10 dark:bg-navy-light"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-navy text-gold transition group-hover:bg-gold group-hover:text-navy dark:bg-gold/10 dark:group-hover:bg-gold">
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
      ) : (
        <p className="mt-10 text-navy/60 dark:text-offwhite/60">
          Check back soon, or{" "}
          <Link href="/properties" className="font-medium underline hover:text-gold">
            browse all properties
          </Link>{" "}
          in the meantime.
        </p>
      )}
    </main>
  );
}
