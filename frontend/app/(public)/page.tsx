import Hero from "@/components/site/Hero";
import HomeSearch from "@/components/site/HomeSearch";
import CategoryStrip from "@/components/site/CategoryStrip";
import FeaturedListings from "@/components/site/FeaturedListings";
import PopularAreas from "@/components/site/PopularAreas";
import ServicesPreview from "@/components/site/ServicesPreview";
import LatestArticles from "@/components/site/LatestArticles";
import CTABanner from "@/components/site/CTABanner";

// Phase 5 replaces the Phase 1 health-check placeholder that used to live
// here. GET /api/health still exists on the backend for infra checks; it's
// just no longer rendered on the homepage.
//
// Phase 6 adds the two sections below the hero. FeaturedListings is an async
// server component (fetches GET /api/properties?featured=true directly), so
// this page stays a server component too rather than becoming a client one.
//
// CTABanner is the closing photo band from the reference screenshot — added
// once Zee supplied its background photo, closing out the homepage per the
// Visual System spec.
//
// Phase 15 adds PopularAreas between the featured grid and the CTA banner,
// matching Zee's updated reference screenshot (flagged as overlapping this
// phase back in the Phase 14 README rather than built silently then).
//
// Phase 16 adds LatestArticles right after it, closing out the homepage
// with the blog-style section the same screenshot showed — also flagged
// rather than built early, this time in the Phase 15 work.
//
// UI/UX Phase 3 puts HomeSearch directly under the hero — the first thing
// below the fold should be "what are you looking for?", not a category
// grid, since a visitor who already knows their area/budget shouldn't have
// to scroll past browsing aids to say so. CategoryStrip stays right after
// it as the browse-instead-of-search path. HomeSearch is an async server
// component (it fetches the areas list for its location autocomplete), so
// this page stays a server component, same as FeaturedListings.
//
// UI/UX Phase 4 originally added four trust-building sections here:
// WhyWorkWithMe, ServicesPreview, TestimonialsPreview, AboutPreview. Zee
// later removed WhyWorkWithMe, TestimonialsPreview and AboutPreview from
// the homepage (Phase 26) — their component files still exist in
// components/site/ but are no longer rendered anywhere. The full /about
// and /testimonials pages are unaffected. ServicesPreview stays.
export default function HomePage() {
  return (
    <main>
      <Hero />
      <HomeSearch />
      <CategoryStrip />
      <FeaturedListings />
      <PopularAreas />
      <ServicesPreview />
      <LatestArticles />
      <CTABanner />
    </main>
  );
}
