import type { Metadata } from "next";
import { Quote } from "lucide-react";
import { TESTIMONIALS } from "@/lib/siteConfig";
import CTABanner from "@/components/site/CTABanner";

export const metadata: Metadata = {
  title: "Testimonials",
  description: "What clients say about working with Zee Zafra Properties.",
};

// TESTIMONIALS itself is draft placeholder content — see the note in
// lib/siteConfig.ts. This page just renders whatever's in that array, so
// swapping in real client quotes there is the only change needed once
// Zee has them.
export default function TestimonialsPage() {
  return (
    <main>
      <div className="mx-auto max-w-6xl px-6 py-16 lg:px-10">
        <p className="text-sm font-semibold uppercase tracking-wide text-gold">
          Testimonials
        </p>
        <h1 className="mt-1 text-3xl font-bold text-navy dark:text-offwhite sm:text-4xl">
          What Clients Say
        </h1>
        <p className="mt-3 max-w-2xl text-navy/60 dark:text-offwhite/60">
          A few words from people I&rsquo;ve helped buy, sell, and invest in
          Cebu real estate.
        </p>

        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
          {TESTIMONIALS.map((testimonial, index) => (
            <figure
              // Index, not name+location: this is a fixed, hand-authored
              // array (not fetched/reorderable data), and placeholder
              // entries share literal text like "[Client name]" until real
              // quotes are added — a composite string key collides there,
              // and even real client names/locations aren't guaranteed
              // unique.
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
      </div>

      <CTABanner />
    </main>
  );
}
