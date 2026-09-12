import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getFeaturedProperties } from "@/lib/api";
import PropertyCard from "./PropertyCard";

export default async function FeaturedListings() {
  const properties = await getFeaturedProperties();

  return (
    <section className="bg-navy/[0.03] py-16 dark:bg-white/[0.02]">
      <div className="mx-auto max-w-6xl px-6 lg:px-10">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-gold">
              Featured Listings
            </p>
            <h2 className="mt-1 text-2xl font-bold text-navy dark:text-offwhite sm:text-3xl">
              Handpicked Properties
            </h2>
          </div>
          <Link
            href="/properties"
            className="hidden shrink-0 items-center gap-1.5 text-sm font-semibold text-navy transition hover:text-gold dark:text-offwhite dark:hover:text-gold sm:flex"
          >
            View All Properties
            <ArrowRight size={16} />
          </Link>
        </div>

        {properties.length > 0 ? (
          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {properties.map((property) => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>
        ) : (
          <p className="mt-10 text-navy/60 dark:text-offwhite/60">
            No featured listings yet — mark a property as featured in the admin
            panel to have it show up here.
          </p>
        )}

        <Link
          href="/properties"
          className="mt-8 flex items-center justify-center gap-1.5 text-sm font-semibold text-navy transition hover:text-gold dark:text-offwhite dark:hover:text-gold sm:hidden"
        >
          View All Properties
          <ArrowRight size={16} />
        </Link>
      </div>
    </section>
  );
}
