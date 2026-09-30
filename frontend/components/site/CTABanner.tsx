import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import InquireButton from "./InquireButton";
import T from "@/components/i18n/T";

// The reference screenshot's homepage closes on a full-bleed photo band
// with a short prompt and a "Get in Touch" button — the roadmap's Visual
// System section calls this out, but no earlier phase actually built it as
// a section (Phase 6 only covers the category strip + featured grid).
// Built once Zee supplied the background photo for it.
//
// "Get in Touch" opens the shared InquiryModal (Phase 10) — it used to
// link to /contact before the modal existed; /contact itself still exists
// as a page with direct contact details, just no longer the only way to
// reach out from here.
//
// Phase 13 follow-up: a quiet text link to /sell under the headline. The
// banner's primary ask is buyer-facing, so a second gold button would
// compete with "Get in Touch" — a subordinate text link gives sellers a
// second, low-friction path without changing the banner's priority.
// /sell is still deliberately excluded from the six-item main nav; only
// how people find it changed. Previously the Services page's "Selling"
// card was the only entry point — this is the second.
export default function CTABanner() {
  return (
    <section className="relative isolate overflow-hidden">
      <Image
        src="/images/cta-background.jpg"
        alt=""
        fill
        className="object-cover"
      />
      <div className="absolute inset-0 bg-navy/65" />

      <div className="relative mx-auto flex max-w-6xl flex-col items-start gap-6 px-6 py-16 sm:flex-row sm:items-center sm:justify-between lg:px-10">
        <div>
          <h2 className="text-2xl font-bold text-offwhite sm:text-3xl">
            <T id="cta.heading">{"Let\u2019s Find Your Perfect Property"}</T>
          </h2>
          <p className="mt-2 max-w-xl text-offwhite/80">
            <T id="cta.body">
              {"Whether you\u2019re looking for a new home, an investment, or your next business space, I\u2019m here to help you every step of the way."}
            </T>
          </p>
          <Link
            href="/sell"
            className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-offwhite/80 underline decoration-offwhite/40 underline-offset-4 transition hover:text-gold hover:decoration-gold"
          >
            <T id="cta.sell">Thinking of selling instead? Get a free valuation</T>
            <ArrowRight size={13} />
          </Link>
        </div>

        <InquireButton
          source="CTA_BANNER"
          className="flex shrink-0 items-center gap-2 rounded-full bg-gold px-6 py-3 font-semibold text-navy transition hover:bg-gold-light"
        >
          <T id="cta.getInTouch">Get in Touch</T>
          <ArrowRight size={16} />
        </InquireButton>
      </div>
    </section>
  );
}
