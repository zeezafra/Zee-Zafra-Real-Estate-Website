import type { Metadata } from "next";
import Link from "next/link";
import { TESTIMONIALS } from "@/lib/siteConfig";
import CTABanner from "@/components/site/CTABanner";
import TestimonialCard from "@/components/site/TestimonialCard";
import ReviewButtons from "@/components/site/ReviewButtons";
import T from "@/components/i18n/T";

export const metadata: Metadata = {
  title: "Testimonials",
  description: "What clients say about working with Zee Zafra Properties.",
};

// Trust & polish. Renders whatever real testimonials are in
// lib/siteConfig.ts (photo + optional Google/Facebook source link per
// entry). With none yet, shows a composed empty state instead of
// placeholder quotes — see the how-to comment above TESTIMONIALS.
export default function TestimonialsPage() {
  const hasTestimonials = TESTIMONIALS.length > 0;

  return (
    <main>
      <div className="mx-auto max-w-6xl px-6 py-16 lg:px-10">
        <p className="text-sm font-semibold uppercase tracking-wide text-gold">
          <T id="test.eyebrow">Testimonials</T>
        </p>
        <h1 className="mt-1 text-3xl font-bold text-navy dark:text-offwhite sm:text-4xl">
          <T id="test.heading">What Clients Say</T>
        </h1>
        <p className="mt-3 max-w-2xl text-navy/60 dark:text-offwhite/60">
          <T id="test.sub">
            A few words from people I&rsquo;ve helped buy, sell, and invest in Cebu real estate.
          </T>
        </p>

        {hasTestimonials ? (
          <>
            <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
              {TESTIMONIALS.map((testimonial, index) => (
                // Index key: a fixed, hand-authored array — names aren't
                // guaranteed unique.
                <TestimonialCard key={index} testimonial={testimonial} />
              ))}
            </div>
            <div className="mt-10">
              <p className="mb-3 text-sm font-semibold text-navy dark:text-offwhite">
                <T id="test.leave">Leave a review</T>
              </p>
              <ReviewButtons />
            </div>
          </>
        ) : (
          <div className="mt-12 rounded-2xl border border-dashed border-navy/20 p-10 text-center dark:border-offwhite/20">
            <h2 className="text-xl font-semibold text-navy dark:text-offwhite">
              <T id="test.emptyTitle">Client stories are on the way</T>
            </h2>
            <p className="mx-auto mt-2 max-w-md text-navy/60 dark:text-offwhite/60">
              <T id="test.emptyBody">
                I&rsquo;m still collecting reviews from the people I&rsquo;ve helped. In the meantime,
                you&rsquo;re welcome to talk to me directly.
              </T>
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/contact"
                className="rounded-full bg-gold px-6 py-2.5 text-sm font-semibold text-navy transition hover:bg-gold-light"
              >
                <T id="nav./contact">Contact</T>
              </Link>
              <ReviewButtons />
            </div>
          </div>
        )}
      </div>

      <CTABanner />
    </main>
  );
}
