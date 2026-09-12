"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import Sidebar from "./Sidebar";
import ThemeToggle from "../theme/ThemeToggle";

// Breakpoint call for "collapses appropriately on mobile": lg (1024px). A
// fixed 288px sidebar plus a readable content column needs more room than
// tablet width gives, so below lg the sidebar is replaced by this sticky
// mobile header (logo, theme toggle, hamburger) and an off-canvas drawer
// carrying the same Sidebar content.
export default function SiteChrome({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 lg:block">
        <Sidebar />
      </aside>

      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-navy/10 bg-offwhite px-4 py-3 dark:border-offwhite/10 dark:bg-navy lg:hidden">
        <Link href="/" className="font-bold text-navy dark:text-offwhite">
          <span className="text-gold">Zee Zafra</span> Properties
        </Link>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
            className="rounded-lg p-2 text-navy transition hover:bg-navy/5 dark:text-offwhite dark:hover:bg-white/10"
          >
            <Menu size={22} />
          </button>
        </div>
      </header>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setMobileOpen(false)}
            className="absolute inset-0 bg-navy/60"
          />
          <div className="absolute inset-y-0 left-0 w-72 max-w-[85vw]">
            <div className="relative h-full">
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                aria-label="Close menu"
                className="absolute right-3 top-3 z-10 rounded-lg p-1.5 text-offwhite/70 transition hover:text-offwhite"
              >
                <X size={20} />
              </button>
              <Sidebar onNavigate={() => setMobileOpen(false)} />
            </div>
          </div>
        </div>
      )}

      <div className="lg:pl-72">{children}</div>
    </>
  );
}
