"use client";

import { Calendar } from "lucide-react";
import { useViewingModal } from "./ViewingModalProvider";
import T from "@/components/i18n/T";

type Props = {
  propertyId?: string;
  propertyTitle?: string;
  label?: string;
  className?: string;
};

// Phase 14. On the property detail page, propertyId/propertyTitle are
// always passed, and ViewingModal shows that property locked in ("For:
// <title>"). Phase 14 follow-up: also used bare (no props) as the global
// "Book a Viewing" trigger in TopNav and Hero — in that case ViewingModal
// opens with no property chosen yet and shows an in-modal property search
// instead, since a viewing request still can't be submitted without one
// (see the backend's propertyId requirement).
export default function BookViewingButton({
  propertyId,
  propertyTitle,
  label,
  className,
}: Props) {
  const { open } = useViewingModal();

  return (
    <button
      type="button"
      onClick={() => open({ propertyId, propertyTitle })}
      className={className}
    >
      <Calendar size={16} className="shrink-0" />
      {label ?? <T id="cta.bookViewing">Book a Viewing</T>}
    </button>
  );
}
