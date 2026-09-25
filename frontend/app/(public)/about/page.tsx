import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { ABOUT_CONTENT, AGENT } from "@/lib/siteConfig";
import CTABanner from "@/components/site/CTABanner";

export const metadata: Metadata = {
  title: "About Me",
  description: `Meet ${AGENT.name}, a ${AGENT.role.toLowerCase()} in Cebu.`,
};

export default function AboutPage() {
  return (
    <main>
      <div className="mx-auto max-w-6xl px-6 py-16 lg:px-10">
        <p className="text-sm font-semibold uppercase tracking-wide text-gold">
          About Me
        </p>
        <h1 className="mt-1 text-3xl font-bold text-navy dark:text-offwhite sm:text-4xl">
          Hi, I&rsquo;m {AGENT.name}
        </h1>

        <div className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-[1fr_320px]">
          <div>
            <p className="text-lg font-medium text-navy dark:text-offwhite">
              {ABOUT_CONTENT.intro}
            </p>

            <div className="mt-6 space-y-4 text-navy/70 dark:text-offwhite/70">
              {ABOUT_CONTENT.bio.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>

            <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
              {ABOUT_CONTENT.highlights.map((highlight) => (
                <div
                  key={highlight.caption}
                  className="rounded-2xl border border-navy/10 bg-white p-5 dark:border-offwhite/10 dark:bg-navy-light"
                >
                  <p className="text-2xl font-bold text-gold">{highlight.label}</p>
                  <p className="mt-1 text-sm text-navy/60 dark:text-offwhite/60">
                    {highlight.caption}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-10">
              <h2 className="text-lg font-semibold text-navy dark:text-offwhite">
                Credentials
              </h2>
              <ul className="mt-4 space-y-3">
                {ABOUT_CONTENT.credentials.map((credential) => (
                  <li
                    key={credential}
                    className="flex items-start gap-3 text-navy/70 dark:text-offwhite/70"
                  >
                    <CheckCircle2
                      size={18}
                      className="mt-0.5 shrink-0 text-gold"
                    />
                    <span>{credential}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-10 flex flex-wrap gap-4">
              <Link
                href="/properties"
                className="rounded-full bg-gold px-6 py-3 font-semibold text-navy transition hover:bg-gold-light"
              >
                Browse Properties
              </Link>
              <Link
                href="/contact"
                className="rounded-full border border-navy/20 px-6 py-3 font-semibold text-navy transition hover:border-gold hover:text-gold dark:border-offwhite/20 dark:text-offwhite"
              >
                Get in Touch
              </Link>
            </div>
          </div>

          <div className="mx-auto w-full max-w-xs lg:mx-0">
            <div className="relative aspect-[3/4] overflow-hidden rounded-2xl bg-navy">
              <Image
                src="/images/hero-portrait.png"
                alt={AGENT.name}
                fill
                className="object-cover object-top"
              />
            </div>
            <div className="mt-4 flex items-center gap-2 text-sm text-navy/70 dark:text-offwhite/70">
              <span className="h-2 w-2 rounded-full bg-green-400" />
              Available for inquiries
            </div>
          </div>
        </div>
      </div>

      <CTABanner />
    </main>
  );
}
