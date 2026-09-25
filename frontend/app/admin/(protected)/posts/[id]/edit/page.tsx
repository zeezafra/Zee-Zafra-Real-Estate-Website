import { notFound } from "next/navigation";
import { getAdminPosts } from "@/lib/adminAuth";
import PostForm from "../../PostForm";

// Looked up via the admin list endpoint (drafts included), not the public
// GET /api/posts/:slug — that one 404s on an unpublished post by design
// (see backend/src/routes/posts.js), which would make a draft
// impossible to reopen and finish editing. No separate
// GET /api/admin/posts/:id endpoint needed just for this — the admin
// list is already small enough (one admin, one blog) that finding by id
// client-side costs nothing extra.
async function getPostById(id: string) {
  const posts = await getAdminPosts();
  return posts.find((post) => post.id === id) ?? null;
}

export default async function EditPostPage({
  params,
}: {
  params: { id: string };
}) {
  const post = await getPostById(params.id);
  if (!post) {
    notFound();
  }

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";

  return (
    <main className="mx-auto min-h-screen max-w-3xl px-6 py-10">
      <h1 className="text-3xl font-bold text-navy">Edit Post</h1>
      <p className="mt-1 text-sm text-navy/60">{post.title}</p>
      <div className="mt-8">
        <PostForm apiUrl={apiUrl} post={post} />
      </div>
    </main>
  );
}
