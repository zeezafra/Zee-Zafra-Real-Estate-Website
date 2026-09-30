import Image from "next/image";
import { Bath, Bed, MapPin, Ruler } from "lucide-react";
import type { SoldProperty } from "@/lib/types";
import { formatPrice, formatSoldMonth, isPriceOnRequest, isRentedDeal } from "@/lib/format";
import { PROPERTY_TYPES } from "@/lib/types";
import { SHOW_SOLD_PRICES } from "@/lib/siteConfig";
import T from "@/components/i18n/T";

// Trust & polish. One closed deal in the track record. Deliberately NOT a
// link and has no Save/Compare buttons: the listing is gone, so there's
// nothing to act on — the card is proof, not inventory. The closing price
// only shows when SHOW_SOLD_PRICES is on (see siteConfig.ts).
export default function SoldCard({ property }: { property: SoldProperty }) {
  const rented = isRentedDeal(property);
  const month = formatSoldMonth(property.soldAt);
  const cover = property.images[0] ?? "https://placehold.co/600x400/0B1F3A/12305C?text=Property";
  const typeLabel = PROPERTY_TYPES.find((t) => t.value === property.type)?.label ?? property.type;

  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-navy/10 bg-white dark:border-offwhite/10 dark:bg-navy-light">
      <div className="relative aspect-[4/3] w-full overflow-hidden">
        <Image
          src={cover}
          alt={property.title}
          fill
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-navy/20" />
        <span className="absolute left-3 top-3 rounded-full bg-gold px-3 py-1 text-xs font-semibold text-navy">
          {rented ? <T id="sold.rented">Rented</T> : <T id="sold.sold">Sold</T>}
          {month ? <span className="font-normal"> · {month}</span> : null}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-5">
        <h3 className="font-semibold text-navy dark:text-offwhite">{property.title}</h3>
        <p className="flex items-center gap-1 text-sm text-navy/60 dark:text-offwhite/60">
          <MapPin size={14} className="shrink-0" aria-hidden="true" />
          {property.location}
        </p>
        <p className="text-xs font-medium uppercase tracking-wide text-navy/40 dark:text-offwhite/40">
          {typeLabel}
        </p>

        {SHOW_SOLD_PRICES && !isPriceOnRequest(property) && (
          <p className="text-lg font-bold text-navy dark:text-gold">
            {formatPrice(property)}
            {rented && property.rentPeriod ? (
              <span className="text-sm font-normal text-navy/60 dark:text-offwhite/60">
                {" "}
                / {property.rentPeriod}
              </span>
            ) : null}
          </p>
        )}

        <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-navy/10 pt-3 text-sm text-navy/70 dark:border-offwhite/10 dark:text-offwhite/70">
          {property.beds !== null && (
            <span className="flex items-center gap-1" title={`${property.beds} bedrooms`}>
              <Bed size={14} aria-hidden="true" />
              {property.beds}
            </span>
          )}
          {property.baths !== null && (
            <span className="flex items-center gap-1" title={`${property.baths} bathrooms`}>
              <Bath size={14} aria-hidden="true" />
              {property.baths}
            </span>
          )}
          <span className="flex items-center gap-1" title={`${property.sqm} square metres`}>
            <Ruler size={14} aria-hidden="true" />
            {property.sqm} sqm
          </span>
        </div>
      </div>
    </article>
  );
}
