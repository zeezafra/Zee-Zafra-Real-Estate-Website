import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Play } from "lucide-react";
import TopNav from "./TopNav";

// Phase 5 built this section's structure with placehold.co stand-ins for
// both the background and the agent photo. Zee has since supplied real
// photography (a skyline/infinity-pool background shot and a pre-cut-out
// portrait with transparency), and the reference screenshot's exact hero
// copy — this swaps both in rather than leaving Phase 5's placeholder
// headline in place now that real assets exist. "Watch Introduction" stays
// a TBD placeholder until there's a video to link to, per the roadmap.
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
          and the portrait's signature caption don't sit on raw highlights. */}
      <div className="absolute inset-0 bg-gradient-to-r from-navy/90 via-navy/55 to-navy/10" />
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

          <h1 className="mt-4 text-4xl font-bold leading-tight text-offwhite sm:text-5xl">
            Find the right property.
            <br />
            <span className="text-gold">Build your future.</span>
          </h1>

          <p className="mt-5 max-w-md text-offwhite/80">
            I help clients buy, sell, and invest in properties that fit their
            lifestyle and goals — from dream homes to smart investments.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-6">
            <Link
              href="/properties"
              className="flex items-center gap-2 rounded-full bg-gold px-6 py-3 font-semibold text-navy transition hover:bg-gold-light"
            >
              Browse Properties
              <ArrowRight size={16} />
            </Link>
            <button
              type="button"
              title="Coming soon"
              className="flex items-center gap-3 font-medium text-offwhite transition hover:text-gold"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-offwhite/50">
                <Play size={14} className="ml-0.5" />
              </span>
              Watch Introduction
            </button>
          </div>
        </div>
      </div>

      {/* Agent cutout, composited over the background photo's right edge.
          Hidden below sm — at narrow widths there isn't room for it beside
          the headline without crowding the text, and the background photo
          alone still carries the section on mobile. */}
      <div className="pointer-events-none absolute inset-y-0 right-0 z-[1] hidden w-[36%] justify-center sm:flex lg:w-[30%]">
        <div className="relative mt-auto h-[85%] w-full">
          <Image
            src="/images/hero-portrait.png"
            alt="Zee Zafra"
            fill
            priority
            className="object-contain object-bottom"
          />
          <div className="absolute bottom-4 right-0 text-right drop-shadow-[0_1px_4px_rgba(11,31,58,0.8)]">
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
