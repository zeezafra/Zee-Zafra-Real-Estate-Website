import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getSoldProperties } from "@/lib/api";
import { isRentedDeal } from "@/lib/format";
import SoldCard from "./SoldCard";
import T from "@/components/i18n/T";

// Trust & polish. Homepage track-record strip: the three most recently
// closed deals plus a sold/rented tally. Renders nothing at all until at
// least one listing has been marked SOLD — an empty "Recently Sold" heading
// would advertise the opposite of a track record. Reads the same
// GET /api/properties/sold as /sold, so there's one source of truth.
const SHOWN = 3;

export default async function RecentlySold() {
  const deals = await getSoldProperties(60);
  if (deals.length === 0) return null;

  const rented = deals.filter(isRentedDeal).length;
  const sold = deals.length - rented;

  return (
    <section className="mx-auto max-w-6xl px-6 py-16 lg:px-10">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-gold">
            <T id="sold.eyebrow">Track Record</T>
          </p>
          <h2 className="mt-1 text-2xl font-bold text-navy dark:text-offwhite sm:text-3xl">
            <T id="sold.heading">Recently Sold &amp; Rented</T>
          </h2>
          <p className="mt-2 text-sm text-navy/60 dark:text-offwhite/60">
            {sold > 0 && (
              <>
                <strong className="text-navy dark:text-offwhite">{sold}</strong>{" "}
                <T id="sold.soldCount">sold</T>
              </>
            )}
            {sold > 0 && rented > 0 && " · "}
            {rented > 0 && (
              <>
                <strong className="text-navy dark:text-offwhite">{rented}</strong>{" "}
                <T id="sold.rentedCount">rented</T>
              </>
            )}
          </p>
        </div>
        <Link
          href="/sold"
          className="hidden shrink-0 items-center gap-1.5 text-sm font-semibold text-navy transition hover:text-gold dark:text-offwhite dark:hover:text-gold sm:flex"
        >
          <T id="sold.viewAll">View all closed deals</T>
          <ArrowRight size={16} />
        </Link>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {deals.slice(0, SHOWN).map((property) => (
          <SoldCard key={property.id} property={property} />
        ))}
      </div>

      <Link
        href="/sold"
        className="mt-6 flex items-center gap-1.5 text-sm font-semibold text-navy transition hover:text-gold dark:text-offwhite dark:hover:text-gold sm:hidden"
      >
        <T id="sold.viewAll">View all closed deals</T>
        <ArrowRight size={16} />
      </Link>
    </section>
  );
}
