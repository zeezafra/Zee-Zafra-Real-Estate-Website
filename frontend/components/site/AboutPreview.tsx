import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ABOUT_CONTENT, AGENT } from "@/lib/siteConfig";

// UI/UX Phase 4. Reads ABOUT_CONTENT/AGENT from siteConfig, same source as
// the full /about page (Build Phase 9) — a short intro that links out, not
// a second bio. Only the intro line is shown here (not the fuller `bio`
// paragraphs or the credentials list), matching the roadmap's "short
// intro, linking to the full /about page" framing for this section.
export default function AboutPreview() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-16 lg:px-10">
      <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-[280px_1fr]">
        <div className="mx-auto w-full max-w-xs lg:mx-0">
          <div className="relative aspect-[3/4] overflow-hidden rounded-2xl bg-navy">
            <Image
              src="/images/hero-portrait.png"
              alt={AGENT.name}
              fill
              className="object-cover object-top"
            />
          </div>
        </div>

        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-gold">
            About Me
          </p>
          <h2 className="mt-1 text-2xl font-bold text-navy dark:text-offwhite sm:text-3xl">
            Hi, I&rsquo;m {AGENT.name}
          </h2>
          <p className="mt-4 max-w-2xl text-navy/70 dark:text-offwhite/70">
            {ABOUT_CONTENT.intro}
          </p>

          <div className="mt-6 flex flex-wrap gap-4">
            {ABOUT_CONTENT.highlights.map((highlight) => (
              <div
                key={highlight.caption}
                className="rounded-xl border border-navy/10 bg-white px-4 py-3 dark:border-offwhite/10 dark:bg-navy-light"
              >
                <p className="text-lg font-bold text-gold">
                  {highlight.label}
                </p>
                <p className="text-xs text-navy/60 dark:text-offwhite/60">
                  {highlight.caption}
                </p>
              </div>
            ))}
          </div>

          <Link
            href="/about"
            className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-navy transition hover:text-gold dark:text-offwhite dark:hover:text-gold"
          >
            Read My Full Story
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </section>
  );
}
