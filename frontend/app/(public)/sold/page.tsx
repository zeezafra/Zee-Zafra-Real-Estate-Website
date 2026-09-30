import type { Metadata } from "next";
import Link from "next/link";
import { getSoldProperties } from "@/lib/api";
import { isRentedDeal } from "@/lib/format";
import SoldCard from "@/components/site/SoldCard";
import CTABanner from "@/components/site/CTABanner";
import T from "@/components/i18n/T";

export const metadata: Metadata = {
  title: "Recently Sold & Rented",
  description:
    "A track record of properties Zee Zafra Properties has recently sold and rented in Cebu City and Talisay City.",
};

// Same 60s window as the API helper, so a newly-closed deal appears here
// without a redeploy.
export const revalidate = 60;

// Trust & polish. The full track record — every listing marked SOLD in the
// admin (a sold FOR_RENT listing reads as "Rented"), newest closing first.
export default async function SoldPage() {
  const deals = await getSoldProperties(100);
  const rented = deals.filter(isRentedDeal).length;
  const sold = deals.length - rented;

  return (
    <main>
      <div className="mx-auto max-w-6xl px-6 py-16 lg:px-10">
        <p className="text-sm font-semibold uppercase tracking-wide text-gold">
          <T id="sold.eyebrow">Track Record</T>
        </p>
        <h1 className="mt-1 text-3xl font-bold text-navy dark:text-offwhite sm:text-4xl">
          <T id="sold.heading">Recently Sold &amp; Rented</T>
        </h1>
        <p className="mt-3 max-w-2xl text-navy/60 dark:text-offwhite/60">
          <T id="sold.sub">A look at some of the deals I&rsquo;ve recently closed.</T>
        </p>

        {deals.length > 0 ? (
          <>
            <p className="mt-4 text-sm text-navy/60 dark:text-offwhite/60">
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
            <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {deals.map((property) => (
                <SoldCard key={property.id} property={property} />
              ))}
            </div>
          </>
        ) : (
          <div className="mt-10 rounded-2xl border border-dashed border-navy/20 p-10 text-center dark:border-offwhite/20">
            <p className="text-navy/70 dark:text-offwhite/70">
              <T id="sold.empty">Closed deals will be listed here soon.</T>
            </p>
            <Link
              href="/properties"
              className="mt-4 inline-block rounded-full bg-gold px-6 py-2.5 text-sm font-semibold text-navy transition hover:bg-gold-light"
            >
              <T id="hero.browse">Browse Properties</T>
            </Link>
          </div>
        )}

        <div className="mt-12 flex flex-wrap items-center gap-4 rounded-2xl bg-navy p-6 text-offwhite sm:p-8">
          <p className="flex-1 text-lg font-semibold">
            <T id="sold.cta">Want your property to be next?</T>
          </p>
          <Link
            href="/sell"
            className="rounded-full bg-gold px-6 py-2.5 text-sm font-semibold text-navy transition hover:bg-gold-light"
          >
            <T id="sold.ctaBtn">Get a free valuation</T>
          </Link>
        </div>
      </div>

      <CTABanner />
    </main>
  );
}
