"use client";

import { useInquiryModal } from "./InquiryModalProvider";
import type { InquirySource } from "@/lib/types";

type Props = {
  label?: string;
  propertyId?: string;
  propertyTitle?: string;
  // Phase 20. Each call site should pass its own source explicitly now
  // (CTABanner -> "CTA_BANNER", the property detail page ->
  // "PROPERTY_PAGE") rather than leaning on InquiryModal's propertyId-based
  // guess, which only ever covered two of the six InquirySource values and
  // silently misattributed anything else as "NAV_CTA".
  source?: InquirySource;
  className?: string;
  children?: React.ReactNode;
};

// Drop this in anywhere under the public layout to open the shared
// InquiryModal. Used by CTABanner ("Get in Touch") and the property detail
// page's sidebar (with propertyId/propertyTitle so the modal shows
// "Regarding: <title>" and submits with that property attached). TopNav's
// old "Inquire Now" CTA was replaced with "Book a Viewing"/"Sell Your
// Property" in the reference-screenshot update — no current call site needs
// the "NAV_CTA" source, but the value stays in InquirySource for any future
// nav CTA that reintroduces it.
export default function InquireButton({
  label = "Inquire Now",
  propertyId,
  propertyTitle,
  source,
  className,
  children,
}: Props) {
  const { open } = useInquiryModal();

  return (
    <button
      type="button"
      onClick={() => open({ propertyId, propertyTitle, source })}
      className={className}
    >
      {children ?? label}
    </button>
  );
}
