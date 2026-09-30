import { ExternalLink } from "lucide-react";
import { REVIEW_LINKS } from "@/lib/siteConfig";
import T from "@/components/i18n/T";

// Trust & polish. "Leave a review" buttons for Google and Facebook. A
// channel whose URL is still "" in siteConfig.REVIEW_LINKS is skipped, and
// with neither configured the whole block renders nothing — never a dead
// "#" link.
export default function ReviewButtons({ className = "" }: { className?: string }) {
  const channels = [
    { id: "test.google", label: "Review on Google", href: REVIEW_LINKS.google },
    { id: "test.facebook", label: "Review on Facebook", href: REVIEW_LINKS.facebook },
  ].filter((c) => /^https?:\/\//i.test(c.href));

  if (channels.length === 0) return null;

  return (
    <div className={`flex flex-wrap items-center gap-3 ${className}`}>
      {channels.map((c) => (
        <a
          key={c.id}
          href={c.href}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-full border border-navy/20 px-5 py-2.5 text-sm font-semibold text-navy transition hover:border-gold hover:text-gold dark:border-offwhite/30 dark:text-offwhite dark:hover:border-gold dark:hover:text-gold"
        >
          <T id={c.id}>{c.label}</T>
          <ExternalLink size={14} aria-hidden="true" />
        </a>
      ))}
    </div>
  );
}
