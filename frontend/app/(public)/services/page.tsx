import type { Metadata } from "next";
import Link from "next/link";
import { Search, Tag, TrendingUp, Check } from "lucide-react";
import { SERVICES } from "@/lib/siteConfig";
import CTABanner from "@/components/site/CTABanner";

export const metadata: Metadata = {
  title: "Services",
  description:
    "Buying, selling, and investing guidance from Zee Zafra Properties.",
};

const SERVICE_ICONS = {
  search: Search,
  tag: Tag,
  "trending-up": TrendingUp,
};

export default function ServicesPage() {
  return (
    <main>
      <div className="mx-auto max-w-6xl px-6 py-16 lg:px-10">
        <p className="text-sm font-semibold uppercase tracking-wide text-gold">
          Services
        </p>
        <h1 className="mt-1 text-3xl font-bold text-navy dark:text-offwhite sm:text-4xl">
          How I Can Help
        </h1>
        <p className="mt-3 max-w-2xl text-navy/60 dark:text-offwhite/60">
          I help clients buy, sell, and invest in properties that fit their
          lifestyle and goals — from dream homes to smart investments.
        </p>

        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
          {SERVICES.map((service) => {
            const Icon = SERVICE_ICONS[service.icon];
            return (
              <div
                key={service.title}
                className="flex flex-col rounded-2xl border border-navy/10 bg-white p-6 dark:border-offwhite/10 dark:bg-navy-light"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-navy text-gold dark:bg-gold/10">
                  <Icon size={22} />
                </span>
                <h2 className="mt-5 text-xl font-semibold text-navy dark:text-offwhite">
                  {service.title}
                </h2>
                <p className="mt-2 text-navy/60 dark:text-offwhite/60">
                  {service.description}
                </p>
                <ul className="mt-5 space-y-2.5">
                  {service.bullets.map((bullet) => (
                    <li
                      key={bullet}
                      className="flex items-start gap-2.5 text-sm text-navy/70 dark:text-offwhite/70"
                    >
                      <Check size={16} className="mt-0.5 shrink-0 text-gold" />
                      {bullet}
                    </li>
                  ))}
                </ul>
                <Link
                  href={service.href}
                  className="mt-6 text-sm font-semibold text-navy transition hover:text-gold dark:text-offwhite dark:hover:text-gold"
                >
                  {service.href === "/sell"
                    ? "Get a property valuation →"
                    : "Start the conversation →"}
                </Link>
              </div>
            );
          })}
        </div>
      </div>

      <CTABanner />
    </main>
  );
}
