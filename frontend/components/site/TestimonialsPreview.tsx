import Link from "next/link";
import { Quote, ArrowRight } from "lucide-react";
import { TESTIMONIALS } from "@/lib/siteConfig";

// UI/UX Phase 4. Reads TESTIMONIALS from siteConfig, same source as the
// full /testimonials page — a preview, not a second source of truth (per
// the roadmap's implementation note). Shows the first two rather than all
// three so there's a reason to click through, same restraint FeaturedListings
// and PopularAreas apply to their own full pages.
//
// Note (carried from siteConfig.ts): TESTIMONIALS is still placeholder
// content pending Zee's real client quotes — this preview will show that
// placeholder copy until the array is filled in with real testimonials.
const TESTIMONIALS_SHOWN = 2;

export default function TestimonialsPreview() {
  const shown = TESTIMONIALS.slice(0, TESTIMONIALS_SHOWN);

  return (
    <section className="mx-auto max-w-6xl px-6 py-16 lg:px-10">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-gold">
            Testimonials
          </p>
          <h2 className="mt-1 text-2xl font-bold text-navy dark:text-offwhite sm:text-3xl">
            What Clients Say
          </h2>
        </div>
        <Link
          href="/testimonials"
          className="hidden shrink-0 items-center gap-1.5 text-sm font-semibold text-navy transition hover:text-gold dark:text-offwhite dark:hover:text-gold sm:flex"
        >
          Read All Testimonials
          <ArrowRight size={16} />
        </Link>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2">
        {shown.map((testimonial, index) => (
          <figure
            // Same index-key reasoning as the full /testimonials page:
            // fixed, hand-authored array, placeholder entries can share
            // literal text.
            key={index}
            className="flex flex-col rounded-2xl border border-navy/10 bg-white p-6 dark:border-offwhite/10 dark:bg-navy-light"
          >
            <Quote size={22} className="text-gold" />
            <blockquote className="mt-4 flex-1 text-navy/80 dark:text-offwhite/80">
              &ldquo;{testimonial.quote}&rdquo;
            </blockquote>
            <figcaption className="mt-5 border-t border-navy/10 pt-4 dark:border-offwhite/10">
              <p className="font-semibold text-navy dark:text-offwhite">
                {testimonial.name}
              </p>
              <p className="text-sm text-navy/60 dark:text-offwhite/60">
                {testimonial.location}
              </p>
            </figcaption>
          </figure>
        ))}
      </div>

      <Link
        href="/testimonials"
        className="mt-8 flex items-center justify-center gap-1.5 text-sm font-semibold text-navy transition hover:text-gold dark:text-offwhite dark:hover:text-gold sm:hidden"
      >
        Read All Testimonials
        <ArrowRight size={16} />
      </Link>
    </section>
  );
}
