import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import TopNav from "./TopNav";
import BookViewingButton from "./BookViewingButton";
import IntroVideoButton from "./IntroVideoButton";
import T from "@/components/i18n/T";

// UI/UX Phase 2 (Hero Section Refinement). Phase 5 built this section's
// structure with placehold.co stand-ins; a later session swapped in real
// photography and the reference screenshot's copy. This phase is the
// polish pass on top of that real-asset version:
// - Stronger left-to-right scrim (text column now reads clearly even
//   against the brightest part of the background photo).
// - Clearer headline hierarchy (bigger jump to the accent line, tighter
//   supporting copy, a proper drop-shadow so white text never washes out
//   over sky/glass in the photo).
// - Down to exactly two CTAs — Browse Properties and Book a Viewing. The
//   "Sell Your Property" text link that used to sit below them is gone:
//   it's been live in TopNav since the Phase 1 nav cleanup, so keeping it
//   here too was pure duplication, not a second useful path.
// - Portrait container widened slightly and re-anchored so the top of the
//   head always clears the container top at every breakpoint the portrait
//   shows at (sm+) — see the sizing note on the portrait wrapper below.
// - Signature caption ("Zee Zafra" / "Real Estate Salesperson") was
//   text-right against right-0, i.e. flush against the section's own
//   right edge with zero margin — since that edge is also the viewport
//   edge, the caption was reading as clipped rather than an intentional
//   bleed. Pulled it in a few pixels (right-3, growing to right-5 on lg)
//   so it always clears the frame.
// - Supporting paragraph gets `text-pretty` (CSS text-wrap: pretty,
//   supported since Tailwind 3.4) so the browser's own line-breaking
//   avoids leaving a single orphaned word on the last line, at every
//   viewport width the max-w-md container reflows to — not just the
//   desktop width the copy happened to be checked at. No-op in browsers
//   that don't support text-wrap: pretty yet; wrapping just falls back
//   to normal.
export default function Hero() {
  return (
    <section className="relative isolate flex min-h-[80vh] items-center overflow-hidden bg-navy lg:min-h-[85vh]">
      <Image
        src="/images/hero-background.jpg"
        alt=""
        fill
        priority
        className="object-cover"
      />
      {/* Two overlapping scrims: left-to-right so the headline column stays
          legible over a bright sunset photo, and bottom-up so the top nav
          and the portrait's signature caption don't sit on raw highlights.
          Darkened over the Phase 5 values — the old from-navy/90 via-55
          still let bright sky bleed through behind the supporting
          paragraph on wide screens. */}
      <div className="absolute inset-0 bg-gradient-to-r from-navy/95 via-navy/70 to-navy/20" />
      <div className="absolute inset-0 bg-gradient-to-t from-navy/70 via-transparent to-navy/20" />

      <TopNav />

      <div className="relative z-[1] mx-auto w-full max-w-6xl px-6 pb-16 pt-20 lg:px-10 lg:pb-0 lg:pt-0">
        <div className="max-w-xl">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold uppercase tracking-[0.25em] text-gold">
              Zee Zafra Properties
            </span>
            <span className="h-px w-10 bg-gold/60" />
          </div>

          <h1 className="mt-5 text-4xl font-bold leading-[1.1] tracking-tight text-offwhite drop-shadow-[0_2px_10px_rgba(11,31,58,0.55)] sm:text-5xl lg:text-6xl">
            <T id="hero.line1">Find the right property.</T>
            <br />
            <span className="text-gold">
              <T id="hero.line2">Build your future.</T>
            </span>
          </h1>

          <p className="mt-5 max-w-md text-pretty text-base text-offwhite/85 sm:text-lg">
            <T id="hero.sub">
              {"I help clients buy, sell, and invest in properties that fit their lifestyle and goals — from dream homes to smart investments."}
            </T>
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-4">
            <Link
              href="/properties"
              className="flex items-center gap-2 rounded-full bg-gold px-7 py-3.5 text-base font-semibold text-navy shadow-lg shadow-navy/30 transition hover:bg-gold-light hover:shadow-xl"
            >
              <T id="hero.browse">Browse Properties</T>
              <ArrowRight size={16} />
            </Link>
            <BookViewingButton
              className="flex items-center gap-2 rounded-full border border-offwhite/50 px-7 py-3.5 text-base font-semibold text-offwhite backdrop-blur-sm transition hover:border-gold hover:text-gold"
            />
            {/* Trust & polish: a lower-emphasis third option, not a third
                button — and it only renders once INTRO_VIDEO_URL is set. */}
            <IntroVideoButton />
          </div>
        </div>
      </div>

      {/* Agent cutout, composited over the background photo's right edge.
          Hidden below sm — at narrow widths there isn't room for it beside
          the headline without crowding the text, and the background photo
          alone still carries the section on mobile.
          Sizing note: the source photo (900x957, roughly square) was
          getting its headroom pinched at lg's narrower 30%-width slot on
          shorter viewports, reading as a "cropped" portrait even though
          object-contain never actually crops it. Widening lg's slot to
          34% and dropping the container to h-[90%] (up from 85%) gives the
          image more room to scale up without the letterboxed gap at the
          top the old, tighter box produced. */}
      <div className="pointer-events-none absolute inset-y-0 right-0 z-[1] hidden w-[38%] justify-center sm:flex lg:w-[34%]">
        <div className="relative mt-auto h-[90%] w-full">
          <Image
            src="/images/hero-portrait.png"
            alt="Zee Zafra"
            fill
            priority
            className="object-contain object-bottom"
          />
          <div className="absolute bottom-4 right-3 text-right drop-shadow-[0_1px_4px_rgba(11,31,58,0.8)] sm:right-4 lg:right-5">
            <p className="font-serif text-lg italic text-offwhite sm:text-xl">
              Zee Zafra
            </p>
            <p className="text-xs text-offwhite/80">Real Estate Salesperson</p>
          </div>
        </div>
      </div>
    </section>
  );
}
