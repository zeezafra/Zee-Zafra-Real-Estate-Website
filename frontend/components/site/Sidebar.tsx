"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Facebook, Instagram, Linkedin, Mail } from "lucide-react";
import ThemeToggle from "../theme/ThemeToggle";
import SavedListingsLink from "./SavedListingsLink";
import LanguageToggle from "../i18n/LanguageToggle";
import T from "../i18n/T";
import { AGENT, NAV_LINKS, SOCIAL_LINKS } from "@/lib/siteConfig";

const SOCIAL_ICONS = {
  facebook: Facebook,
  instagram: Instagram,
  linkedin: Linkedin,
  mail: Mail,
};

// Used both as the fixed desktop column (via SiteChrome) and, unchanged, as
// the content of the mobile drawer — onNavigate closes that drawer after a
// link tap and is undefined (a no-op) on desktop.
//
// UI/UX Phase 1: this is now the site's single primary nav — TopNav no
// longer duplicates NAV_LINKS (see that file). Section order still follows
// SKILL.md's visual system (logo -> profile block -> nav -> social/theme ->
// tagline); hairline dividers were added between sections so the hierarchy
// reads on its own instead of relying on margin spacing alone.
// The outer column's overflow-y-auto scrollbar is themed via the
// `sidebar-scroll` class in globals.css (transparent at rest, a thin gold
// thread on hover) instead of showing the raw browser default.
export default function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <div className="sidebar-scroll flex h-full w-full flex-col overflow-y-auto bg-navy px-6 py-8 text-offwhite">
      <Link href="/" onClick={onNavigate} className="text-xl font-bold tracking-wide">
        <span className="text-gold">Zee Zafra</span> Properties
      </Link>

      <div className="mt-8 flex flex-col items-center border-t border-offwhite/10 pt-8 text-center">
        <div className="relative h-24 w-24 overflow-hidden rounded-full ring-2 ring-gold">
          <Image
            src="/images/hero-portrait.png"
            alt={AGENT.name}
            fill
            className="object-cover object-top"
          />
        </div>
        <p className="mt-3 font-semibold">{AGENT.name}</p>
        <p className="text-sm text-offwhite/60">{AGENT.role}</p>
        <p className="mt-2 flex items-center gap-1.5 text-xs text-offwhite/70">
          <span className="h-2 w-2 rounded-full bg-green-400" />
          <T id="nav.available">Available for inquiries</T>
        </p>
      </div>

      <nav className="mt-8 flex flex-1 flex-col gap-1 border-t border-offwhite/10 pt-6">
        {NAV_LINKS.map((link) => {
          const active = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={`rounded-lg border-l-2 px-3 py-2 text-sm font-medium transition ${
                active
                  ? "border-gold bg-white/10 font-semibold text-gold"
                  : "border-transparent text-offwhite/70 hover:border-offwhite/30 hover:bg-white/5 hover:text-offwhite"
              }`}
            >
              <T id={`nav.${link.href}`}>{link.label}</T>
            </Link>
          );
        })}
        {/* Phase 12 — see SavedListingsLink.tsx for why this isn't just a
            seventh entry in NAV_LINKS. */}
        <SavedListingsLink variant="row" onNavigate={onNavigate} />
      </nav>

      <div className="mt-6 flex items-center justify-between border-t border-offwhite/10 pt-6">
        <div className="flex items-center gap-4">
          {SOCIAL_LINKS.map((social) => {
            const Icon = SOCIAL_ICONS[social.icon];
            return (
              <a
                key={social.label}
                href={social.href}
                aria-label={social.label}
                className="text-offwhite/60 transition hover:text-gold"
              >
                <Icon size={18} />
              </a>
            );
          })}
        </div>
        <ThemeToggle />
      </div>

      {/* Trust & polish: EN | TL | CEB. Lives here (not the mobile
          header) because the drawer reuses this component, and the header
          has no spare width at 360px. */}
      <div className="mt-5 flex justify-center">
        <LanguageToggle variant="dark" />
      </div>

      <p className="mt-5 text-center text-xs italic text-offwhite/40">
        <T id="nav.tagline">{AGENT.tagline}</T>
      </p>
      <Link
        href="/privacy"
        onClick={onNavigate}
        className="mt-2 block text-center text-xs text-offwhite/40 underline-offset-2 hover:text-offwhite/70 hover:underline"
      >
        <T id="nav.privacy">Privacy Policy</T>
      </Link>
    </div>
  );
}
