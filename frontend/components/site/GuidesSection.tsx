import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { GUIDES } from "@/lib/guides";
import GuideCapture from "./GuideCapture";
import T from "@/components/i18n/T";

// Trust & polish. The lead magnet block. `full` (used on /guides) shows
// both guides with their forms; the homepage teaser shows a heading and the
// same two cards side by side, with a link through to /guides.
export default function GuidesSection({ heading = "h2" }: { heading?: "h1" | "h2" }) {
  const Heading = heading;
  return (
    <section className="mx-auto max-w-6xl px-6 py-16 lg:px-10">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-gold">
            <T id="guides.eyebrow">Free Guides</T>
          </p>
          <Heading className="mt-1 text-2xl font-bold text-navy dark:text-offwhite sm:text-3xl">
            <T id="guides.heading">Free checklists for Cebu buyers and sellers</T>
          </Heading>
          <p className="mt-2 max-w-2xl text-navy/60 dark:text-offwhite/60">
            <T id="guides.sub">Easy-to-follow checklists. Enter your email and download right away.</T>
          </p>
        </div>
        {heading === "h2" && (
          <Link
            href="/guides"
            className="hidden shrink-0 items-center gap-1.5 text-sm font-semibold text-navy transition hover:text-gold dark:text-offwhite dark:hover:text-gold sm:flex"
          >
            <T id="guides.more">See all guides</T>
            <ArrowRight size={16} />
          </Link>
        )}
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
        {GUIDES.map((guide) => (
          <GuideCapture key={guide.slug} guide={guide} />
        ))}
      </div>
    </section>
  );
}
