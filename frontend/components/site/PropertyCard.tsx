import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Bath, Bed, Car, MapPin, Ruler } from "lucide-react";
import type { Property } from "@/lib/types";

// Points at a real route even though /properties/[id] doesn't exist until
// Phase 7 — same forward-reference pattern Phase 5 used for "Browse
// Properties" -> /properties. Next.js just 404s on it until then.
export default function PropertyCard({ property }: { property: Property }) {
  const cover = property.images[0] ?? "https://placehold.co/600x400/0B1F3A/12305C?text=Property";

  const stats = [
    property.beds !== null && { icon: Bed, value: `${property.beds}` },
    property.baths !== null && { icon: Bath, value: `${property.baths}` },
    property.carSpaces !== null && { icon: Car, value: `${property.carSpaces}` },
    { icon: Ruler, value: `${property.sqm} sqm` },
  ].filter(Boolean) as { icon: typeof Bed; value: string }[];

  return (
    <Link
      href={`/properties/${property.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-navy/10 bg-white transition hover:-translate-y-0.5 hover:shadow-xl dark:border-offwhite/10 dark:bg-navy-light"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden">
        <Image
          src={cover}
          alt={property.title}
          fill
          className="object-cover transition duration-300 group-hover:scale-105"
        />
        <span className="absolute left-3 top-3 rounded-full bg-navy/90 px-3 py-1 text-xs font-semibold text-gold">
          {property.listingType === "FOR_SALE" ? "For Sale" : "For Rent"}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <div>
          <h3 className="font-semibold text-navy dark:text-offwhite">{property.title}</h3>
          <p className="mt-1 flex items-center gap-1 text-sm text-navy/60 dark:text-offwhite/60">
            <MapPin size={14} className="shrink-0" />
            {property.location}
          </p>
        </div>

        <p className="text-lg font-bold text-navy dark:text-gold">
          ₱{property.price.toLocaleString()}
          {property.listingType === "FOR_RENT" && property.rentPeriod && (
            <span className="text-sm font-normal text-navy/60 dark:text-offwhite/60">
              {" "}
              / {property.rentPeriod}
            </span>
          )}
        </p>

        <div className="mt-auto flex items-center justify-between border-t border-navy/10 pt-3 dark:border-offwhite/10">
          <div className="flex items-center gap-3 text-sm text-navy/70 dark:text-offwhite/70">
            {stats.map((stat, i) => (
              <span key={i} className="flex items-center gap-1">
                <stat.icon size={14} />
                {stat.value}
              </span>
            ))}
          </div>
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-navy text-gold transition group-hover:bg-gold group-hover:text-navy dark:bg-gold/10 dark:group-hover:bg-gold">
            <ArrowUpRight size={16} />
          </span>
        </div>
      </div>
    </Link>
  );
}
