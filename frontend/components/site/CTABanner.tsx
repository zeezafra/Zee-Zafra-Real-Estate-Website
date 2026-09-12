import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";

// The reference screenshot's homepage closes on a full-bleed photo band
// with a short prompt and a "Get in Touch" button — the roadmap's Visual
// System section calls this out, but no earlier phase actually built it as
// a section (Phase 6 only covers the category strip + featured grid).
// Building it now that Zee has supplied the background photo for it.
//
// The button links to /contact, same as TopNav's "Inquire Now" — that route
// doesn't exist until Phase 9, and neither button is wired to actually
// submit anything until Phase 10's Inquiry table/endpoint. Both are
// pre-existing gaps this section just stays consistent with, not new ones.
export default function CTABanner() {
  return (
    <section className="relative isolate overflow-hidden">
      <Image
        src="/images/cta-background.jpg"
        alt=""
        fill
        className="object-cover"
      />
      <div className="absolute inset-0 bg-navy/65" />

      <div className="relative mx-auto flex max-w-6xl flex-col items-start gap-6 px-6 py-16 sm:flex-row sm:items-center sm:justify-between lg:px-10">
        <div>
          <h2 className="text-2xl font-bold text-offwhite sm:text-3xl">
            Let&rsquo;s Find Your Perfect Property
          </h2>
          <p className="mt-2 max-w-xl text-offwhite/80">
            Whether you&rsquo;re looking for a new home, an investment, or
            your next business space, I&rsquo;m here to help you every step
            of the way.
          </p>
        </div>

        <Link
          href="/contact"
          className="flex shrink-0 items-center gap-2 rounded-full bg-gold px-6 py-3 font-semibold text-navy transition hover:bg-gold-light"
        >
          Get in Touch
          <ArrowRight size={16} />
        </Link>
      </div>
    </section>
  );
}
