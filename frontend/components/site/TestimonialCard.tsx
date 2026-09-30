import Image from "next/image";
import { ExternalLink, Quote } from "lucide-react";
import type { Testimonial } from "@/lib/siteConfig";

function initials(name: string): string {
  const parts = name.replace(/[^\p{L}\s]/gu, "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
}

// Trust & polish. A testimonial with a photo (or an initials avatar when no
// photo was supplied) and, for quotes that were originally public reviews,
// a "via Google/Facebook" line linking to the original.
export default function TestimonialCard({ testimonial }: { testimonial: Testimonial }) {
  const { name, location, quote, photo, source, sourceUrl } = testimonial;

  return (
    <figure className="flex flex-col rounded-2xl border border-navy/10 bg-white p-6 dark:border-offwhite/10 dark:bg-navy-light">
      <Quote size={22} className="text-gold" aria-hidden="true" />
      <blockquote className="mt-4 flex-1 text-navy/80 dark:text-offwhite/80">
        &ldquo;{quote}&rdquo;
      </blockquote>

      <figcaption className="mt-5 flex items-center gap-3 border-t border-navy/10 pt-4 dark:border-offwhite/10">
        {photo ? (
          <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full ring-2 ring-gold/60">
            <Image src={photo} alt={name} fill sizes="48px" className="object-cover" />
          </span>
        ) : (
          <span
            aria-hidden="true"
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-navy text-sm font-bold text-gold"
          >
            {initials(name)}
          </span>
        )}
        <span className="min-w-0">
          <span className="block font-semibold text-navy dark:text-offwhite">{name}</span>
          <span className="block text-sm text-navy/60 dark:text-offwhite/60">{location}</span>
          {source &&
            (sourceUrl ? (
              <a
                href={sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-0.5 inline-flex items-center gap-1 text-xs font-medium text-gold hover:underline"
              >
                via {source}
                <ExternalLink size={11} aria-hidden="true" />
              </a>
            ) : (
              <span className="mt-0.5 block text-xs font-medium text-gold">via {source}</span>
            ))}
        </span>
      </figcaption>
    </figure>
  );
}
