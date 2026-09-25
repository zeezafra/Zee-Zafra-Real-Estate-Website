import Link from "next/link";
import { Home } from "lucide-react";
import NavSearch from "./NavSearch";
import SavedListingsLink from "./SavedListingsLink";

// UI/UX Phase 1: this used to also map NAV_LINKS across the left side,
// duplicating the sidebar's Home/Properties/Market Insights/About Me/
// Services/Testimonials/Contact list. The sidebar is the site's single
// primary nav now (see Sidebar.tsx); this bar over the hero is a
// right-aligned utility/action strip only — Search, Saved, and one CTA
// below. Desktop only (lg+). Below lg, the persistent header + drawer in
// SiteChrome is how visitors reach navigation instead — see that
// component for the breakpoint call.
//
// Reference screenshot update: the single "Inquire Now" CTA here was
// first replaced with two more specific ones — "Book a Viewing" (opens
// ViewingModal with no property locked in yet) and "Sell Your Property"
// (links straight to /sell). A later pass dropped "Book a Viewing" from
// this bar: it duplicated the hero's own outline CTA directly below,
// putting the same buyer-facing ask above the fold twice next to
// "Browse Properties". "Sell Your Property" stays — it targets sellers,
// a different audience from the hero's two buyer CTAs, so it's not a
// third stacked ask, just the one seller-facing path. Search and Saved
// stay too since they're utility, not calls to action. General
// "Inquire Now"/viewing access isn't gone — it's still on every property
// detail page, the closing CTA banner ("Get in Touch"), and /contact.
export default function TopNav() {
  return (
    <nav className="absolute inset-x-0 top-0 z-10 hidden items-center justify-end gap-6 px-10 py-6 lg:flex">
      <div className="flex items-center gap-4">
        <NavSearch />
        <SavedListingsLink className="text-offwhite/90 transition hover:text-gold" />
      </div>

      <div className="h-6 w-px bg-offwhite/20" aria-hidden="true" />

      <Link
        href="/sell"
        className="flex items-center gap-2 rounded-full border border-offwhite/50 px-5 py-2 text-sm font-semibold text-offwhite transition hover:border-gold hover:text-gold"
      >
        <Home size={15} className="shrink-0" />
        Sell Your Property
      </Link>
    </nav>
  );
}
