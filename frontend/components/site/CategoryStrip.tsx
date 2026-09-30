import Link from "next/link";
import { Building, Construction, Home, Store, TrendingUp } from "lucide-react";
import { CATEGORIES } from "@/lib/siteConfig";
import T from "@/components/i18n/T";

const CATEGORY_ICONS = {
  home: Home,
  building: Building,
  store: Store,
  construction: Construction,
  "trending-up": TrendingUp,
};

// Trust & polish: ids for the language toggle. A category added to
// siteConfig later just renders in English until it's given a key here and
// an entry in lib/i18n/dictionary.ts.
const CATEGORY_KEYS: Record<string, string> = {
  "Houses & Lots": "houses",
  Condos: "condos",
  Commercial: "commercial",
  Preselling: "preselling",
  Investment: "investment",
};

export default function CategoryStrip() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-16 lg:px-10">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {CATEGORIES.map((category) => {
          const Icon = CATEGORY_ICONS[category.icon];
          return (
            <Link
              key={category.label}
              href="/properties"
              className="group flex flex-col items-start gap-3 rounded-2xl border border-navy/10 bg-white p-5 transition hover:-translate-y-0.5 hover:border-gold hover:shadow-lg dark:border-offwhite/10 dark:bg-navy-light"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-navy text-gold transition group-hover:bg-gold group-hover:text-navy dark:bg-gold/10 dark:group-hover:bg-gold">
                <Icon size={20} />
              </span>
              <span>
                <span className="block font-semibold text-navy dark:text-offwhite">
                  {CATEGORY_KEYS[category.label] ? (
                    <T id={`cat.${CATEGORY_KEYS[category.label]}.label`}>{category.label}</T>
                  ) : (
                    category.label
                  )}
                </span>
                <span className="mt-1 block text-sm text-navy/60 dark:text-offwhite/60">
                  {CATEGORY_KEYS[category.label] ? (
                    <T id={`cat.${CATEGORY_KEYS[category.label]}.caption`}>{category.caption}</T>
                  ) : (
                    category.caption
                  )}
                </span>
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
