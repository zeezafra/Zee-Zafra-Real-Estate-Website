import Hero from "@/components/site/Hero";
import CategoryStrip from "@/components/site/CategoryStrip";
import FeaturedListings from "@/components/site/FeaturedListings";

// Phase 5 replaces the Phase 1 health-check placeholder that used to live
// here. GET /api/health still exists on the backend for infra checks; it's
// just no longer rendered on the homepage.
//
// Phase 6 adds the two sections below the hero. FeaturedListings is an async
// server component (fetches GET /api/properties?featured=true directly), so
// this page stays a server component too rather than becoming a client one.
export default function HomePage() {
  return (
    <main>
      <Hero />
      <CategoryStrip />
      <FeaturedListings />
    </main>
  );
}
