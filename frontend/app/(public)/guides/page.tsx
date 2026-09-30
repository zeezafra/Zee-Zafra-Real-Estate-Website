import type { Metadata } from "next";
import GuidesSection from "@/components/site/GuidesSection";
import CTABanner from "@/components/site/CTABanner";

export const metadata: Metadata = {
  title: "Free Buying & Selling Guides",
  description:
    "Free checklists for buying and selling property in Cebu: title checks, closing costs, documents, and safe-closing tips.",
};

// Trust & polish. Landing page for the lead magnet. Static page; the forms
// inside are client components that POST to /api/guides.
export default function GuidesPage() {
  return (
    <main>
      <GuidesSection heading="h1" />
      <CTABanner />
    </main>
  );
}
