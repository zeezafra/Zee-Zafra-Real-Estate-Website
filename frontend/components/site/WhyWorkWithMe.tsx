import { UserCheck, MapPinned, ClipboardCheck, CalendarCheck } from "lucide-react";
import { WHY_WORK_WITH_ME } from "@/lib/siteConfig";

// UI/UX Phase 4. Static content section — no fetch, so this stays a plain
// sync component (same non-async treatment as CategoryStrip). Sits right
// after FeaturedListings: a visitor who's just scanned a few listings is
// the right audience for "here's why to work with the person behind them"
// before being asked to browse further or commit to an inquiry.
const ICONS = {
  "user-check": UserCheck,
  "map-pinned": MapPinned,
  "clipboard-check": ClipboardCheck,
  "calendar-check": CalendarCheck,
};

export default function WhyWorkWithMe() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-16 lg:px-10">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-gold">
          Why Work With Me
        </p>
        <h2 className="mt-1 text-2xl font-bold text-navy dark:text-offwhite sm:text-3xl">
          A Smoother Way to Buy, Sell, or Invest
        </h2>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {WHY_WORK_WITH_ME.map((item) => {
          const Icon = ICONS[item.icon];
          return (
            <div
              key={item.title}
              className="rounded-2xl border border-navy/10 bg-white p-6 dark:border-offwhite/10 dark:bg-navy-light"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-navy text-gold dark:bg-gold/10">
                <Icon size={22} />
              </span>
              <h3 className="mt-5 font-semibold text-navy dark:text-offwhite">
                {item.title}
              </h3>
              <p className="mt-2 text-sm text-navy/60 dark:text-offwhite/60">
                {item.caption}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
