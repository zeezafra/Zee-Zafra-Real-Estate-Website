import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Bath, Bed, Car, MapPin, Ruler } from "lucide-react";
import type { Property } from "@/lib/types";
import { formatPrice, formatRefNo, isPriceOnRequest, isPriceReduced } from "@/lib/format";
import SaveButton from "./SaveButton";
import CompareButton from "./CompareButton";

// Points at a real route even though /properties/[id] doesn't exist until
// Phase 7 — same forward-reference pattern Phase 5 used for "Browse
// Properties" -> /properties. Next.js just 404s on it until then.
export default function PropertyCard({ property }: { property: Property }) {
  const cover = property.images[0] ?? "https://placehold.co/600x400/0B1F3A/12305C?text=Property";
  const priceReduced = isPriceReduced(property);

  // UI/UX Phase 3 adds a `label` to each stat — the icons alone were
  // ambiguous ("2" next to a bed outline reads fine to someone who already
  // knows the convention, less so otherwise). Rendered as a title/aria-label
  // rather than visible text so the row stays compact at card width.
  const stats = [
    property.beds !== null && {
      icon: Bed,
      value: `${property.beds}`,
      label: `${property.beds} bedroom${property.beds === 1 ? "" : "s"}`,
    },
    property.baths !== null && {
      icon: Bath,
      value: `${property.baths}`,
      label: `${property.baths} bathroom${property.baths === 1 ? "" : "s"}`,
    },
    property.carSpaces !== null && {
      icon: Car,
      value: `${property.carSpaces}`,
      label: `${property.carSpaces} car space${property.carSpaces === 1 ? "" : "s"}`,
    },
    { icon: Ruler, value: `${property.sqm} sqm`, label: `${property.sqm} square metres` },
  ].filter(Boolean) as { icon: typeof Bed; value: string; label: string }[];

  return (
    // Phase 12: the whole card used to just be a <Link>. SaveButton needs
    // to sit somewhere a click on it doesn't also navigate, and a <button>
    // nested inside an <a> is invalid HTML — so this outer <div> carries
    // the hover/lift styling and relative positioning, the <Link> wraps
    // everything that should navigate with display:contents (no box of its
    // own, so it doesn't affect layout), and SaveButton is a sibling
    // absolutely positioned over the image corner.
    <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-navy/10 bg-white transition hover:-translate-y-0.5 hover:shadow-xl dark:border-offwhite/10 dark:bg-navy-light">
      <Link href={`/properties/${property.id}`} className="contents">
        <div className="relative aspect-[4/3] w-full overflow-hidden">
          <Image
            src={cover}
            alt={property.title}
            fill
            className="object-cover transition duration-300 group-hover:scale-105"
          />
          <div className="absolute left-3 top-3 flex flex-col items-start gap-1.5">
            <span className="rounded-full bg-navy/90 px-3 py-1 text-xs font-semibold text-gold">
              {property.listingType === "FOR_SALE" ? "For Sale" : "For Rent"}
            </span>
            {priceReduced && (
              <span className="rounded-full bg-emerald-600/90 px-3 py-1 text-xs font-semibold text-white">
                Price Reduced
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-3 p-5">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-semibold text-navy dark:text-offwhite">{property.title}</h3>
              <p className="mt-1 flex items-center gap-1 text-sm text-navy/60 dark:text-offwhite/60">
                <MapPin size={14} className="shrink-0" />
                {property.location}
              </p>
            </div>
            {/* Phase 12 reference number — see lib/format.ts */}
            <span className="shrink-0 text-[11px] font-medium uppercase tracking-wide text-navy/35 dark:text-offwhite/35">
              {formatRefNo(property.refNo)}
            </span>
          </div>

          <div>
            {priceReduced && (
              <p className="text-sm font-medium text-navy/40 line-through dark:text-offwhite/40">
                ₱{property.originalPrice!.toLocaleString()}
              </p>
            )}
            <p className="text-lg font-bold text-navy dark:text-gold">
              {formatPrice(property)}
              {!isPriceOnRequest(property) &&
                property.listingType === "FOR_RENT" &&
                property.rentPeriod && (
                  <span className="text-sm font-normal text-navy/60 dark:text-offwhite/60">
                    {" "}
                    / {property.rentPeriod}
                  </span>
                )}
            </p>
          </div>

          <div className="mt-auto border-t border-navy/10 pt-3 dark:border-offwhite/10">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-navy/70 dark:text-offwhite/70">
              {stats.map((stat, i) => (
                <span
                  key={i}
                  className="flex items-center gap-1"
                  title={stat.label}
                  aria-label={stat.label}
                >
                  <stat.icon size={14} aria-hidden="true" />
                  {stat.value}
                </span>
              ))}
            </div>

            {/* UI/UX Phase 3: the circular arrow that used to sit here was
                the card's only "go" affordance — legible as a hover hint,
                but not an obvious call to action, and invisible on touch
                where there's no hover. This is a <span>, not an <a>: the
                whole card is already wrapped in a <Link>, and nesting an
                anchor inside one is invalid HTML (same constraint
                SaveButton works around by sitting outside it). */}
            <span className="mt-3 flex w-full items-center justify-center gap-2 rounded-full bg-navy px-4 py-2.5 text-sm font-semibold text-gold transition group-hover:bg-gold group-hover:text-navy dark:bg-gold/10 dark:group-hover:bg-gold">
              View Property
              <ArrowUpRight size={16} aria-hidden="true" />
            </span>
          </div>
        </div>
      </Link>

      <SaveButton propertyId={property.id} className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-navy/60 text-offwhite backdrop-blur transition hover:bg-navy/80" />
      {/* Phase 26 */}
      <CompareButton propertyId={property.id} />
    </div>
  );
}
