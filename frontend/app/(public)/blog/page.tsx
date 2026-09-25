import type { Metadata } from "next";
import Link from "next/link";
import { getPosts } from "@/lib/api";
import PostCard from "@/components/site/PostCard";

export const metadata: Metadata = {
  title: "Market Insights",
  description:
    "Market insights, buying and selling tips, and neighborhood guides from Zee Zafra Properties.",
};

// Phase 16. Same directory-page shape as /areas (Phase 15): every
// published post as a card, newest first (getPosts() already orders by
// createdAt desc — see backend/src/routes/posts.js).
export default async function BlogPage() {
  const posts = await getPosts();

  return (
    <main className="mx-auto max-w-6xl px-6 py-16 lg:px-10">
      <p className="text-sm font-semibold uppercase tracking-wide text-gold">
        Market Insights
      </p>
      <h1 className="mt-1 text-3xl font-bold text-navy dark:text-offwhite">
        From the Blog
      </h1>
      <p className="mt-2 text-navy/60 dark:text-offwhite/60">
        {posts.length > 0
          ? `${posts.length} ${posts.length === 1 ? "article" : "articles"} on buying, selling, and investing in Cebu real estate.`
          : "No articles published yet."}
      </p>

      {posts.length > 0 ? (
        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      ) : (
        <p className="mt-10 text-navy/60 dark:text-offwhite/60">
          Check back soon, or{" "}
          <Link href="/contact" className="font-medium underline hover:text-gold">
            get in touch
          </Link>{" "}
          with a question in the meantime.
        </p>
      )}
    </main>
  );
}
