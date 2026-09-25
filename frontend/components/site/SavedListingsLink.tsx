"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart } from "lucide-react";
import { useSavedListings } from "@/lib/useSavedListings";

type Props = {
  variant?: "row" | "icon";
  className?: string;
  onNavigate?: () => void;
};

// Deliberately not added to NAV_LINKS in siteConfig.ts — the reference
// screenshot's nav is a fixed six-item set (Home/Properties/About Me/
// Services/Testimonials/Contact), and "Saved" is a utility link (like a
// wishlist icon), not a marketing page, so it gets its own element
// wherever it appears instead of extending that list. variant="row" is
// the labeled version used in the Sidebar (desktop + mobile drawer);
// variant="icon" is the compact badge used in TopNav and SiteChrome's
// mobile header.
export default function SavedListingsLink({ variant = "icon", className, onNavigate }: Props) {
  const pathname = usePathname();
  const { savedIds, hydrated } = useSavedListings();
  // Same hydration gate as SaveButton — avoids flashing a stale count
  // before localStorage has actually been read on the client.
  const count = hydrated ? savedIds.length : 0;
  const active = pathname === "/saved";

  if (variant === "row") {
    return (
      <Link
        href="/saved"
        onClick={onNavigate}
        aria-current={active ? "page" : undefined}
        className={`flex items-center justify-between rounded-lg border-l-2 px-3 py-2 text-sm font-medium transition ${
          active
            ? "border-gold bg-white/10 font-semibold text-gold"
            : "border-transparent text-offwhite/70 hover:border-offwhite/30 hover:bg-white/5 hover:text-offwhite"
        }`}
      >
        <span className="flex items-center gap-2">
          <Heart size={15} />
          Saved
        </span>
        {count > 0 && (
          <span className="rounded-full bg-gold px-2 py-0.5 text-[10px] font-bold text-navy">
            {count}
          </span>
        )}
      </Link>
    );
  }

  return (
    <Link
      href="/saved"
      onClick={onNavigate}
      aria-label="Saved properties"
      className={`relative inline-flex ${className ?? "text-navy transition hover:text-gold dark:text-offwhite"}`}
    >
      <Heart size={18} />
      {count > 0 && (
        <span className="absolute -right-2 -top-2 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-gold px-1 text-[10px] font-bold text-navy">
          {count}
        </span>
      )}
    </Link>
  );
}
