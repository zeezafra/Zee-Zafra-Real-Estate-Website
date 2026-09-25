import Link from "next/link";
import { getAdminPosts, getAdminSession } from "@/lib/adminAuth";
import LogoutButton from "../LogoutButton";
import PostsTable from "./PostsTable";

// Same shape as the Listings dashboard (app/admin/(protected)/page.tsx):
// session + data fetched together, table below a header with the create
// action. Sits at its own /admin/posts route rather than folded into the
// Listings dashboard, same reasoning /admin/inquiries got its own route
// back in Phase 10 — a second, unrelated table doesn't belong stacked
// under the same page.
export default async function AdminPostsPage() {
  const [session, posts] = await Promise.all([getAdminSession(), getAdminPosts()]);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";

  return (
    <main className="mx-auto min-h-screen max-w-5xl px-6 py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-navy">Blog Posts</h1>
          <p className="mt-1 text-sm text-navy/60">
            Signed in as <span className="font-medium">{session?.email}</span>
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/admin"
            className="rounded-full border border-navy/20 px-4 py-2 text-sm font-medium text-navy transition hover:border-navy/40"
          >
            Listings
          </Link>
          <Link
            href="/admin/inquiries"
            className="rounded-full border border-navy/20 px-4 py-2 text-sm font-medium text-navy transition hover:border-navy/40"
          >
            Inquiries
          </Link>
          {/* Phase 20 */}
          <Link
            href="/admin/analytics"
            className="rounded-full border border-navy/20 px-4 py-2 text-sm font-medium text-navy transition hover:border-navy/40"
          >
            Analytics
          </Link>
          <Link
            href="/admin/posts/new"
            className="rounded-full bg-gold px-4 py-2 text-sm font-semibold text-navy transition hover:bg-gold-light"
          >
            New Post
          </Link>
          <LogoutButton />
        </div>
      </div>

      <PostsTable posts={posts} apiUrl={apiUrl} />
    </main>
  );
}
