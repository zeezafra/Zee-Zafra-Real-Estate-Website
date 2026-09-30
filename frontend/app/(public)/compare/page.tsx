import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getPropertiesByIds } from "@/lib/api";
import { PROPERTY_TYPES } from "@/lib/types";
import type { Property } from "@/lib/types";
import { formatPrice, formatRefNo, isPriceOnRequest } from "@/lib/format";

// Phase 26. Read from the URL (?ids=a,b,c) rather than localStorage, so a
// comparison is shareable — send the link to a spouse or a co-buyer.
export const metadata: Metadata = {
  title: "Compare Properties",
  robots: { index: false, follow: true },
};

type Props = { searchParams: { ids?: string | string[] } };

type Row = {
  label: string;
  value: (p: Property) => string;
  // Numeric score used to highlight the best cell; omit for text-only rows.
  score?: (p: Property) => number | null;
  best?: "min" | "max";
};

const pricePerSqm = (p: Property) =>
  isPriceOnRequest(p) || p.sqm <= 0 ? null : Math.round(p.price / p.sqm);

const ROWS: Row[] = [
  {
    label: "Price",
    value: (p) =>
      formatPrice(p) +
      (!isPriceOnRequest(p) && p.listingType === "FOR_RENT" && p.rentPeriod ? ` / ${p.rentPeriod}` : ""),
    score: (p) => (isPriceOnRequest(p) ? null : p.price),
    best: "min",
  },
  {
    label: "Price per sqm",
    value: (p) => {
      const v = pricePerSqm(p);
      return v === null ? "—" : `₱${v.toLocaleString()}`;
    },
    score: pricePerSqm,
    best: "min",
  },
  { label: "Location", value: (p) => p.location },
  { label: "Type", value: (p) => PROPERTY_TYPES.find((t) => t.value === p.type)?.label ?? p.type },
  { label: "Listing", value: (p) => (p.listingType === "FOR_SALE" ? "For Sale" : "For Rent") },
  { label: "Bedrooms", value: (p) => (p.beds === null ? "—" : String(p.beds)), score: (p) => p.beds, best: "max" },
  { label: "Bathrooms", value: (p) => (p.baths === null ? "—" : String(p.baths)), score: (p) => p.baths, best: "max" },
  { label: "Parking", value: (p) => (p.carSpaces === null ? "—" : String(p.carSpaces)), score: (p) => p.carSpaces, best: "max" },
  { label: "Floor / lot area", value: (p) => `${p.sqm} sqm`, score: (p) => p.sqm, best: "max" },
  { label: "Status", value: (p) => p.status.charAt(0) + p.status.slice(1).toLowerCase() },
];

function bestIndexes(row: Row, items: Property[]): Set<number> {
  if (!row.score || !row.best || items.length < 2) return new Set();
  const scores = items.map((p) => row.score!(p));
  const valid = scores.filter((s): s is number => s !== null);
  // No highlight when every value is identical — nothing is "best".
  if (valid.length < 2 || new Set(valid).size === 1) return new Set();
  const target = row.best === "min" ? Math.min(...valid) : Math.max(...valid);
  return new Set(scores.flatMap((s, i) => (s === target ? [i] : [])));
}

export default async function ComparePage({ searchParams }: Props) {
  const raw = Array.isArray(searchParams.ids) ? searchParams.ids[0] : searchParams.ids;
  const ids = (raw ?? "")
    .split(",")
    .map((v) => v.trim())
    .filter((v) => /^[A-Za-z0-9_-]{5,40}$/.test(v))
    .slice(0, 3);

  const items = await getPropertiesByIds(ids);

  return (
    <main className="mx-auto max-w-6xl px-6 py-16 lg:px-10">
      <p className="text-sm font-semibold uppercase tracking-wide text-gold">Compare</p>
      <h1 className="mt-1 text-3xl font-bold text-navy dark:text-offwhite">Compare Properties</h1>

      {items.length < 2 ? (
        <div className="mt-8 rounded-2xl border border-navy/10 p-8 text-navy/70 dark:border-offwhite/10 dark:text-offwhite/70">
          <p>
            Pick at least two properties to compare — use the{" "}
            <span className="font-semibold text-navy dark:text-offwhite">compare</span> button on any listing card.
          </p>
          <Link
            href="/properties"
            className="mt-4 inline-block rounded-full bg-gold px-6 py-2.5 font-semibold text-navy transition hover:bg-gold-light"
          >
            Browse Properties
          </Link>
        </div>
      ) : (
        <>
          <p className="mt-2 text-sm text-navy/60 dark:text-offwhite/60">
            Best values are highlighted in gold. Share this page&rsquo;s link to show someone the same comparison.
          </p>
          <div className="mt-8 overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-left text-sm">
              <thead>
                <tr>
                  <th className="w-36 p-3" />
                  {items.map((p) => (
                    <th key={p.id} className="min-w-[200px] p-3 align-top">
                      <Link href={`/properties/${p.id}`} className="group block">
                        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-navy/5">
                          <Image
                            src={p.images[0] ?? "https://placehold.co/600x400/0B1F3A/12305C?text=Property"}
                            alt={p.title}
                            fill
                            className="object-cover transition group-hover:scale-105"
                          />
                        </div>
                        <p className="mt-3 font-semibold text-navy group-hover:text-gold dark:text-offwhite">{p.title}</p>
                        <p className="text-xs font-normal uppercase tracking-wide text-navy/40 dark:text-offwhite/40">
                          {formatRefNo(p.refNo)}
                        </p>
                      </Link>
                      <Link
                        href={`/compare?ids=${items.filter((x) => x.id !== p.id).map((x) => x.id).join(",")}`}
                        className="mt-1 inline-block text-xs font-normal text-navy/50 underline hover:text-gold dark:text-offwhite/50"
                      >
                        Remove
                      </Link>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ROWS.map((row) => {
                  const best = bestIndexes(row, items);
                  return (
                    <tr key={row.label} className="border-t border-navy/10 dark:border-offwhite/10">
                      <th scope="row" className="p-3 font-medium text-navy/60 dark:text-offwhite/60">
                        {row.label}
                      </th>
                      {items.map((p, i) => (
                        <td
                          key={p.id}
                          className={`p-3 ${
                            best.has(i)
                              ? "font-bold text-gold"
                              : "text-navy dark:text-offwhite"
                          }`}
                        >
                          {row.value(p)}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </main>
  );
}
