import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getAreas, getProperties } from "@/lib/api";
import { slugify } from "@/lib/slug";
import PropertyCard from "@/components/site/PropertyCard";

type Props = { params: { slug: string } };

// Every distinct location becomes a statically-generated route at build
// time, same reasoning as sitemap.ts pre-listing every property: this is a
// small, slow-changing set (new listings show up far more often than
// genuinely new locations), so paying the fetch at build time beats an
// on-demand render for every visit.
export async function generateStaticParams() {
  const areas = await getAreas();
  return areas.map((area) => ({ slug: slugify(area.location) }));
}

// Slug -> Area lookup shared by generateMetadata and the page body, so
// neither re-implements "which area does this slug belong to". Returns
// undefined for an unknown slug; both callers turn that into a 404.
async function findArea(slug: string) {
  const areas = await getAreas();
  return areas.find((area) => slugify(area.location) === slug);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const area = await findArea(params.slug);

  if (!area) {
    return { title: "Area Not Found" };
  }

  return {
    title: `Properties in ${area.location}`,
    description: `Browse available houses, condos, and commercial listings in ${area.location} from Zee Zafra Properties.`,
  };
}

export default async function AreaDetailPage({ params }: Props) {
  const area = await findArea(params.slug);

  if (!area) {
    notFound();
  }

  // getProperties()'s `location` filter matches with Postgres `contains`,
  // not exact equality (see backend/src/routes/properties.js) — passing
  // the area's full location string as the filter already narrows to the
  // right rows in every real case today, but the exact-match filter below
  // is a cheap belt-and-suspenders guard against a location string that
  // happens to be a substring of a different one.
  const allMatches = await getProperties({ location: area.location });
  const properties = allMatches.filter((p) => p.location === area.location);

  return (
    <main className="mx-auto max-w-6xl px-6 py-16 lg:px-10">
      <Link
        href="/areas"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-navy/60 transition hover:text-gold dark:text-offwhite/60"
      >
        <ArrowLeft size={14} />
        All Areas
      </Link>

      <p className="mt-4 text-sm font-semibold uppercase tracking-wide text-gold">
        Neighborhood
      </p>
      <h1 className="mt-1 text-3xl font-bold text-navy dark:text-offwhite">
        Properties in {area.location}
      </h1>
      <p className="mt-2 text-navy/60 dark:text-offwhite/60">
        {properties.length} {properties.length === 1 ? "property" : "properties"}{" "}
        currently available.
      </p>

      {properties.length > 0 ? (
        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {properties.map((property) => (
            <PropertyCard key={property.id} property={property} />
          ))}
        </div>
      ) : (
        <p className="mt-10 text-navy/60 dark:text-offwhite/60">
          No available listings in {area.location} right now —{" "}
          <Link href="/properties" className="font-medium underline hover:text-gold">
            browse all properties
          </Link>{" "}
          instead.
        </p>
      )}
    </main>
  );
}
