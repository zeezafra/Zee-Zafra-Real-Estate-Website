import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Bath, Bed, Car, MapPin, Ruler } from "lucide-react";
import { getPropertyById } from "@/lib/api";
import { PROPERTY_STATUSES, PROPERTY_TYPES } from "@/lib/types";
import PropertyGallery from "@/components/site/PropertyGallery";

type Props = { params: { id: string } };

// Per-property <title>/description for SEO/shareability, per the roadmap's
// Phase 7 test. Falls back to a generic pair if the id doesn't resolve —
// the page body itself still 404s via notFound() below.
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const property = await getPropertyById(params.id);

  if (!property) {
    return { title: "Property Not Found" };
  }

  return {
    title: property.title,
    description: `${property.title} in ${property.location} — ₱${property.price.toLocaleString()}${
      property.listingType === "FOR_RENT" && property.rentPeriod
        ? ` / ${property.rentPeriod}`
        : ""
    }. ${property.description.slice(0, 140)}`,
    openGraph: {
      title: property.title,
      description: property.description.slice(0, 140),
      images: property.images.length > 0 ? [property.images[0]] : undefined,
    },
  };
}

export default async function PropertyDetailPage({ params }: Props) {
  const property = await getPropertyById(params.id);

  if (!property) {
    notFound();
  }

  const typeLabel = PROPERTY_TYPES.find((t) => t.value === property.type)?.label ?? property.type;
  const statusLabel =
    PROPERTY_STATUSES.find((s) => s.value === property.status)?.label ?? property.status;

  const stats = [
    property.beds !== null && { icon: Bed, label: "Beds", value: `${property.beds}` },
    property.baths !== null && { icon: Bath, label: "Baths", value: `${property.baths}` },
    property.carSpaces !== null && {
      icon: Car,
      label: "Parking",
      value: `${property.carSpaces}`,
    },
    { icon: Ruler, label: "Floor Area", value: `${property.sqm} sqm` },
  ].filter(Boolean) as { icon: typeof Bed; label: string; value: string }[];

  return (
    <main className="mx-auto max-w-6xl px-6 py-16 lg:px-10">
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1.6fr_1fr]">
        <div>
          <PropertyGallery images={property.images} title={property.title} />

          <div className="mt-8 border-t border-navy/10 pt-8 dark:border-offwhite/10">
            <h2 className="text-lg font-semibold text-navy dark:text-offwhite">
              About This Property
            </h2>
            <p className="mt-3 whitespace-pre-line text-navy/70 dark:text-offwhite/70">
              {property.description}
            </p>
          </div>
        </div>

        <aside className="h-fit rounded-2xl border border-navy/10 p-6 dark:border-offwhite/10">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-navy px-3 py-1 text-xs font-semibold text-gold dark:bg-gold/10">
              {property.listingType === "FOR_SALE" ? "For Sale" : "For Rent"}
            </span>
            <span className="rounded-full border border-navy/20 px-3 py-1 text-xs font-medium text-navy/70 dark:border-offwhite/20 dark:text-offwhite/70">
              {typeLabel}
            </span>
            {property.status !== "AVAILABLE" && (
              <span className="rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1 text-xs font-semibold text-red-600 dark:text-red-400">
                {statusLabel}
              </span>
            )}
          </div>

          <h1 className="mt-4 text-2xl font-bold text-navy dark:text-offwhite">
            {property.title}
          </h1>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-navy/60 dark:text-offwhite/60">
            <MapPin size={15} className="shrink-0" />
            {property.location}
          </p>

          <p className="mt-4 text-3xl font-bold text-navy dark:text-gold">
            ₱{property.price.toLocaleString()}
            {property.listingType === "FOR_RENT" && property.rentPeriod && (
              <span className="text-base font-normal text-navy/60 dark:text-offwhite/60">
                {" "}
                / {property.rentPeriod}
              </span>
            )}
          </p>

          <div className="mt-6 grid grid-cols-2 gap-3 border-y border-navy/10 py-5 dark:border-offwhite/10">
            {stats.map((stat) => (
              <div key={stat.label} className="flex items-center gap-2 text-sm">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-navy/5 text-navy dark:bg-white/5 dark:text-offwhite">
                  <stat.icon size={15} />
                </span>
                <div>
                  <p className="font-semibold text-navy dark:text-offwhite">{stat.value}</p>
                  <p className="text-xs text-navy/50 dark:text-offwhite/50">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Real lead-capture form/modal lands in Phase 10 — for now this
              matches TopNav's "Inquire Now" and routes to /contact. */}
          <Link
            href="/contact"
            className="mt-6 flex w-full items-center justify-center rounded-full bg-gold px-6 py-3 font-semibold text-navy transition hover:bg-gold-light"
          >
            Inquire Now
          </Link>
        </aside>
      </div>
    </main>
  );
}
