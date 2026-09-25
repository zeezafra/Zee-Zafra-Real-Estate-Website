import type { Metadata } from "next";
import { AGENT } from "@/lib/siteConfig";
import SellerLeadForm from "@/components/site/SellerLeadForm";

export const metadata: Metadata = {
  title: "Sell Your Property",
  description: `Get a market-based read on your property from ${AGENT.name} and see what listing it would look like.`,
};

// Phase 13. Page shell only — all the actual form logic/validation lives in
// SellerLeadForm (a client component), same split as ContactPage delegating
// its content to CONTACT_INFO/SOCIAL_LINKS. Header style (gold eyebrow +
// <h1> + intro paragraph) matches ContactPage/ServicesPage; the form itself
// is single-column, so the wrapper is narrower (max-w-3xl) than those two
// multi-column pages (max-w-6xl).
export default function SellPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16 lg:px-10">
      <p className="text-sm font-semibold uppercase tracking-wide text-gold">
        Sell With Me
      </p>
      <h1 className="mt-1 text-3xl font-bold text-navy dark:text-offwhite sm:text-4xl">
        Thinking of Selling?
      </h1>
      <p className="mt-3 max-w-2xl text-navy/60 dark:text-offwhite/60">
        Tell me a bit about your property and I&rsquo;ll get back to you with
        a market-based read on pricing and what listing it would look like
        &mdash; no obligation.
      </p>

      <div className="mt-10">
        <SellerLeadForm />
      </div>
    </main>
  );
}
