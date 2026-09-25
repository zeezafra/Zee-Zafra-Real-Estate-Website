"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import InquiryModal from "./InquiryModal";
import type { InquirySource } from "@/lib/types";

export type InquiryContext = {
  propertyId?: string;
  propertyTitle?: string;
  // Phase 20. Set by the trigger (InquireButton's `source` prop) so the
  // payload sent to POST /api/inquiries always reports where the lead
  // actually came from, instead of InquiryModal guessing from whether a
  // propertyId is present. See InquireButton.tsx for the call sites.
  source?: InquirySource;
};

type InquiryModalContextValue = {
  open: (context?: InquiryContext) => void;
};

const InquiryModalContext = createContext<InquiryModalContextValue | null>(null);

// Mounted once in app/(public)/layout.tsx, above SiteChrome. Anything under
// the public route group can call useInquiryModal().open() — TopNav's
// "Inquire Now", CTABanner's "Get in Touch", and the property detail
// page's "Inquire Now" all trigger the same modal instance rather than
// each managing their own open/closed state, since they need to share one
// on-screen modal regardless of which page or component triggered it.
export function InquiryModalProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [context, setContext] = useState<InquiryContext | undefined>(undefined);

  const open = useCallback((ctx?: InquiryContext) => {
    setContext(ctx);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  const value = useMemo(() => ({ open }), [open]);

  return (
    <InquiryModalContext.Provider value={value}>
      {children}
      <InquiryModal isOpen={isOpen} onClose={close} context={context} />
    </InquiryModalContext.Provider>
  );
}

export function useInquiryModal() {
  const ctx = useContext(InquiryModalContext);
  if (!ctx) {
    throw new Error("useInquiryModal must be used within InquiryModalProvider");
  }
  return ctx;
}
