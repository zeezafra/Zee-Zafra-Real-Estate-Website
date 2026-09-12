import Hero from "@/components/site/Hero";
import CategoryStrip from "@/components/site/CategoryStrip";
import FeaturedListings from "@/components/site/FeaturedListings";
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
export default function HomePage() {
  return (
    <main>
      <Hero />
      <CategoryStrip />
      <FeaturedListings />
      <CTABanner />
    </main>
  );
}
