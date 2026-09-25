"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import ViewingModal from "./ViewingModal";

// Phase 14 follow-up: both fields are now optional, matching
// InquiryContext's shape. A viewing request still can't be *submitted*
// without a specific property (the backend's validateInquiryPayload still
// requires propertyId) — but the button that opens this modal now has two
// callers: BookViewingButton on the property detail page, which always
// passes both fields, and the global "Book a Viewing" trigger in TopNav/
// Hero, which passes neither. When propertyId is missing, ViewingModal
// shows an in-modal property search so the visitor picks one before
// submitting, rather than the property being a precondition of opening
// the modal at all.
export type ViewingContext = {
  propertyId?: string;
  propertyTitle?: string;
};

type ViewingModalContextValue = {
  open: (context?: ViewingContext) => void;
};

const ViewingModalContext = createContext<ViewingModalContextValue | null>(null);

// Phase 14. A second, separate modal instance from InquiryModalProvider
// rather than a mode flag on it — "Book a Viewing" asks for different
// fields (preferred date/time instead of a free-text message) and is a
// genuinely distinct action from a general "Inquire Now"/"Get in Touch",
// so keeping them as two small, focused components avoids growing the
// existing modal's form logic to branch on a type prop. Mounted once in
// app/(public)/layout.tsx, next to InquiryModalProvider.
export function ViewingModalProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [context, setContext] = useState<ViewingContext | undefined>(undefined);

  const open = useCallback((ctx?: ViewingContext) => {
    setContext(ctx);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  const value = useMemo(() => ({ open }), [open]);

  return (
    <ViewingModalContext.Provider value={value}>
      {children}
      <ViewingModal isOpen={isOpen} onClose={close} context={context} />
    </ViewingModalContext.Provider>
  );
}

export function useViewingModal() {
  const ctx = useContext(ViewingModalContext);
  if (!ctx) {
    throw new Error("useViewingModal must be used within ViewingModalProvider");
  }
  return ctx;
}
