import Image from "next/image";
import Link from "next/link";
import { Play } from "lucide-react";
import TopNav from "./TopNav";

// Both images are placeholders (placehold.co) until Zee supplies real
// property and portrait photography — swap the two `src` values below.
// "Watch Introduction" is likewise a TBD placeholder until there's a video
// to link to, per the roadmap.
export default function Hero() {
  return (
    <section className="relative isolate flex min-h-[85vh] items-center overflow-hidden bg-navy">
      <Image
        src="https://placehold.co/1600x900/0B1F3A/12305C?text=Skyline+Photo"
        alt=""
        fill
        priority
        className="object-cover opacity-70"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/60 to-navy/10" />

      <TopNav />

      <div className="relative z-[1] mx-auto flex w-full max-w-6xl flex-col-reverse items-center gap-10 px-6 pt-24 lg:flex-row lg:justify-between lg:px-10 lg:pt-0">
        <div className="max-w-xl text-center lg:text-left">
          <h1 className="text-4xl font-bold leading-tight text-offwhite sm:text-5xl">
            Find the Place
            <br />
            <span className="text-gold">You&rsquo;ll Call Home</span>
          </h1>
          <p className="mt-5 text-offwhite/80">
            Personalized guidance across houses, condos, and commercial
            spaces — from your first viewing to closing day.
          </p>

          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center lg:justify-start">
            <Link
              href="/properties"
              className="rounded-full bg-gold px-6 py-3 font-semibold text-navy transition hover:bg-gold-light"
            >
              Browse Properties
            </Link>
            <button
              type="button"
              title="Coming soon"
              className="flex items-center gap-2 rounded-full border border-offwhite/40 px-6 py-3 font-medium text-offwhite transition hover:border-gold hover:text-gold"
            >
              <Play size={16} />
              Watch Introduction
            </button>
          </div>
        </div>

        <div className="relative h-56 w-56 shrink-0 overflow-hidden rounded-full ring-4 ring-gold sm:h-72 sm:w-72">
          <Image
            src="https://placehold.co/400x400/0B1F3A/D4AF37?text=Agent+Photo"
            alt="Zee Zafra"
            fill
            className="object-cover"
          />
        </div>
      </div>
    </section>
  );
}
