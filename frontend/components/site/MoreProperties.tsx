import { getProperties } from "@/lib/api";
import PropertyCard from "./PropertyCard";

const COUNT = 3;

// Fisher-Yates — unbiased and doesn't mutate the array in place beyond its
// own copy, unlike Array.sort(() => Math.random() - 0.5).
function shuffle<T>(items: T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// Bottom-of-page "Check more properties" on the property detail page.
// Server component, so the shuffle runs fresh on every request — nothing
// here is cached beyond getProperties' own 60s data revalidation window
// (the same window every other listings section uses), and that window
// only affects which properties are eligible, not which 3 get picked.
// Reuses PropertyCard/the same grid shape as FeaturedListings rather than
// a bespoke card design.
export default async function MoreProperties({ excludeId }: { excludeId: string }) {
  const properties = await getProperties();
  const others = properties.filter((p) => p.id !== excludeId);

  if (others.length === 0) {
    return null;
  }

  const picks = shuffle(others).slice(0, COUNT);

  return (
    <section className="bg-navy/[0.03] py-16 dark:bg-white/[0.02]">
      <div className="mx-auto max-w-6xl px-6 lg:px-10">
        <p className="text-sm font-semibold uppercase tracking-wide text-gold">
          Keep Browsing
        </p>
        <h2 className="mt-1 text-2xl font-bold text-navy dark:text-offwhite sm:text-3xl">
          Check More Properties
        </h2>

        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {picks.map((property) => (
            <PropertyCard key={property.id} property={property} />
          ))}
        </div>
      </div>
    </section>
  );
}
