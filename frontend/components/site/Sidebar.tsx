"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Facebook, Instagram, Linkedin, Mail } from "lucide-react";
import ThemeToggle from "../theme/ThemeToggle";
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
export default function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <div className="flex h-full w-full flex-col overflow-y-auto bg-navy px-6 py-8 text-offwhite">
      <Link href="/" onClick={onNavigate} className="text-xl font-bold tracking-wide">
        <span className="text-gold">Zee Zafra</span> Properties
      </Link>

      <div className="mt-10 flex flex-col items-center text-center">
        <div className="relative h-24 w-24 overflow-hidden rounded-full ring-2 ring-gold">
          <Image
            src="https://placehold.co/160x160/0B1F3A/D4AF37?text=ZZ"
            alt={AGENT.name}
            fill
            className="object-cover"
          />
        </div>
        <p className="mt-3 font-semibold">{AGENT.name}</p>
        <p className="text-sm text-offwhite/60">{AGENT.role}</p>
        <p className="mt-2 flex items-center gap-1.5 text-xs text-offwhite/70">
          <span className="h-2 w-2 rounded-full bg-green-400" />
          Available for inquiries
        </p>
      </div>

      <nav className="mt-10 flex flex-1 flex-col gap-1">
        {NAV_LINKS.map((link) => {
          const active = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={onNavigate}
              className={`rounded-lg border-l-2 px-3 py-2 text-sm font-medium transition ${
                active
                  ? "border-gold bg-white/5 text-gold"
                  : "border-transparent text-offwhite/70 hover:bg-white/5 hover:text-offwhite"
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-6 flex items-center justify-between">
        <div className="flex gap-3">
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

      <p className="mt-6 text-center text-xs italic text-offwhite/40">{AGENT.tagline}</p>
    </div>
  );
}
