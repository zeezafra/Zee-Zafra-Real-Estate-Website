import Link from "next/link";
import { Search, Tag, TrendingUp, ArrowRight } from "lucide-react";
import { SERVICES } from "@/lib/siteConfig";

// UI/UX Phase 4. Reads SERVICES from siteConfig — the same source the full
// /services page (Build Phase 9) renders from — so this is a preview that
// links out, not a second copy of the content (per the roadmap's
// implementation note). Condensed vs. the full page: description only, no
// bullet list, so this stays a quick scan rather than duplicating the
// whole page inline.
const SERVICE_ICONS = {
  search: Search,
  tag: Tag,
  "trending-up": TrendingUp,
};

export default function ServicesPreview() {
  return (
    <section className="bg-navy/[0.03] py-16 dark:bg-white/[0.02]">
      <div className="mx-auto max-w-6xl px-6 lg:px-10">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-gold">
              Services
            </p>
            <h2 className="mt-1 text-2xl font-bold text-navy dark:text-offwhite sm:text-3xl">
              How I Can Help
            </h2>
          </div>
          <Link
            href="/services"
            className="hidden shrink-0 items-center gap-1.5 text-sm font-semibold text-navy transition hover:text-gold dark:text-offwhite dark:hover:text-gold sm:flex"
          >
            View All Services
            <ArrowRight size={16} />
          </Link>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
          {SERVICES.map((service) => {
            const Icon = SERVICE_ICONS[service.icon];
            return (
              <Link
                key={service.title}
                href="/services"
                className="group flex flex-col rounded-2xl border border-navy/10 bg-white p-6 transition hover:-translate-y-0.5 hover:border-gold hover:shadow-lg dark:border-offwhite/10 dark:bg-navy-light"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-navy text-gold transition group-hover:bg-gold group-hover:text-navy dark:bg-gold/10 dark:group-hover:bg-gold">
                  <Icon size={22} />
                </span>
                <h3 className="mt-5 text-lg font-semibold text-navy dark:text-offwhite">
                  {service.title}
                </h3>
                <p className="mt-2 text-sm text-navy/60 dark:text-offwhite/60">
                  {service.description}
                </p>
              </Link>
            );
          })}
        </div>

        <Link
          href="/services"
          className="mt-8 flex items-center justify-center gap-1.5 text-sm font-semibold text-navy transition hover:text-gold dark:text-offwhite dark:hover:text-gold sm:hidden"
        >
          View All Services
          <ArrowRight size={16} />
        </Link>
      </div>
    </section>
  );
}
