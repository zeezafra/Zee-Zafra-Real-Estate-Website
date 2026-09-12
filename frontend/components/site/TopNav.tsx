import Link from "next/link";
import { NAV_LINKS } from "@/lib/siteConfig";
import NavSearch from "./NavSearch";

// Duplicates the sidebar's main links over the hero image, desktop only.
// Below lg, the persistent header + drawer in SiteChrome is how visitors
// reach navigation instead — see that component for the breakpoint call.
export default function TopNav() {
  return (
    <nav className="absolute inset-x-0 top-0 z-10 hidden items-center justify-between px-10 py-6 lg:flex">
      <div className="flex gap-8">
        {NAV_LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="text-sm font-medium text-offwhite/90 transition hover:text-gold"
          >
            {link.label}
          </Link>
        ))}
      </div>

      <div className="flex items-center gap-5">
        <NavSearch />
        <Link
          href="/contact"
          className="rounded-full bg-gold px-5 py-2 text-sm font-semibold text-navy transition hover:bg-gold-light"
        >
          Inquire Now
        </Link>
      </div>
    </nav>
  );
}
