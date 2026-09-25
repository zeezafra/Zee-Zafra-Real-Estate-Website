import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getPosts } from "@/lib/api";
import PostCard from "./PostCard";

// Phase 16. Same slot/shape decision as PopularAreas (Phase 15): Zee's
// updated reference screenshot showed a blog-style homepage section
// alongside a "Market Insights" nav item — both flagged as out of scope
// for Phase 14/15's follow-up work and deferred to this phase (see the
// Phase 14/15 README sections). Async server component, no client state,
// same pattern as FeaturedListings/PopularAreas.
const POSTS_SHOWN = 3;

export default async function LatestArticles() {
  const posts = await getPosts();

  // Secondary section — disappears rather than showing an empty state
  // when there's nothing to show yet (no posts, or the API is
  // unreachable), same call PopularAreas makes.
  if (posts.length === 0) {
    return null;
  }

  const latest = posts.slice(0, POSTS_SHOWN);

  return (
    <section className="mx-auto max-w-6xl px-6 py-16 lg:px-10">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-gold">
            Market Insights
          </p>
          <h2 className="mt-1 text-2xl font-bold text-navy dark:text-offwhite sm:text-3xl">
            From the Blog
          </h2>
        </div>
        <Link
          href="/blog"
          className="hidden shrink-0 items-center gap-1.5 text-sm font-semibold text-navy transition hover:text-gold dark:text-offwhite dark:hover:text-gold sm:flex"
        >
          View All Articles
          <ArrowRight size={16} />
        </Link>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-3">
        {latest.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>

      <Link
        href="/blog"
        className="mt-8 flex items-center justify-center gap-1.5 text-sm font-semibold text-navy transition hover:text-gold dark:text-offwhite dark:hover:text-gold sm:hidden"
      >
        View All Articles
        <ArrowRight size={16} />
      </Link>
    </section>
  );
}
