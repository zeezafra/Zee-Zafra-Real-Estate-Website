import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getPostBySlug, getPosts } from "@/lib/api";
import { formatPostDate } from "@/lib/format";

type Props = { params: { slug: string } };

// Every published post becomes a statically-generated route at build
// time, same reasoning as /areas/[slug] (Phase 15) and every property
// detail page: a small, slow-changing set, so paying the fetch at build
// time beats an on-demand render per visit. A post published after the
// last deploy 404s until the next one — same known limitation Phase 15
// flagged for new areas, not a new gap introduced here.
export async function generateStaticParams() {
  const posts = await getPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = await getPostBySlug(params.slug);

  if (!post) {
    return { title: "Article Not Found" };
  }

  return {
    title: post.title,
    description: post.excerpt,
    // Same "only set openGraph when there's a real photo" call as the
    // property detail page — returning this key at all replaces the root
    // layout's default entirely, so a post with no cover image yet should
    // inherit the generated app/opengraph-image.tsx card instead.
    ...(post.coverImage && {
      openGraph: {
        title: post.title,
        description: post.excerpt,
        images: [post.coverImage],
      },
    }),
  };
}

export default async function BlogPostPage({ params }: Props) {
  const post = await getPostBySlug(params.slug);

  if (!post) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-16 lg:px-10">
      <Link
        href="/blog"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-navy/60 transition hover:text-gold dark:text-offwhite/60"
      >
        <ArrowLeft size={14} />
        All Articles
      </Link>

      <p className="mt-4 text-sm font-semibold uppercase tracking-wide text-gold">
        {formatPostDate(post.createdAt)}
      </p>
      <h1 className="mt-1 text-3xl font-bold leading-tight text-navy dark:text-offwhite sm:text-4xl">
        {post.title}
      </h1>

      {post.coverImage && (
        <div className="relative mt-8 aspect-[16/9] w-full overflow-hidden rounded-2xl">
          <Image src={post.coverImage} alt="" fill className="object-cover" priority />
        </div>
      )}

      {/* Content is plain text with paragraph breaks, not markdown — same
          "no fancy dependencies until volume justifies one" call as the
          rest of this codebase's admin-authored text fields (e.g.
          Property.description). whitespace-pre-line turns the admin's
          blank-line paragraph breaks into real spacing without needing a
          markdown renderer. */}
      <div className="mt-8 whitespace-pre-line text-base leading-relaxed text-navy/80 dark:text-offwhite/80">
        {post.content}
      </div>
    </main>
  );
}
