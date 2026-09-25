import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { Post } from "@/lib/types";
import { formatPostDate } from "@/lib/format";

// Phase 16. Same "whole card is one Link" shape as PropertyCard — a post
// has no per-card actions (no save/share button living outside the Link
// the way PropertyCard's SaveButton does), so there's no nested-<a>
// constraint to work around here.
export default function PostCard({ post }: { post: Post }) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-navy/10 bg-white transition hover:-translate-y-0.5 hover:border-gold hover:shadow-lg dark:border-offwhite/10 dark:bg-navy-light"
    >
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-navy/5 dark:bg-white/5">
        {post.coverImage ? (
          <Image
            src={post.coverImage}
            alt={post.title}
            fill
            className="object-cover transition duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-navy/40 dark:text-offwhite/40">
            Zee Zafra Properties
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <p className="text-xs font-medium uppercase tracking-wide text-navy/50 dark:text-offwhite/50">
          {formatPostDate(post.createdAt)}
        </p>
        <h3 className="mt-2 line-clamp-2 text-lg font-semibold text-navy dark:text-offwhite">
          {post.title}
        </h3>
        <p className="mt-2 line-clamp-2 flex-1 text-sm text-navy/60 dark:text-offwhite/60">
          {post.excerpt}
        </p>
        <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-gold">
          Read More
          <ArrowRight size={14} className="transition group-hover:translate-x-0.5" />
        </span>
      </div>
    </Link>
  );
}
