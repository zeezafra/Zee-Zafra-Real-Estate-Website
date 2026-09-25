"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Post } from "@/lib/types";
import { formatPostDate } from "@/lib/format";

export default function PostsTable({
  posts,
  apiUrl,
}: {
  posts: Post[];
  apiUrl: string;
}) {
  const router = useRouter();
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete(id: string) {
    setDeletingId(id);
    setError(null);

    try {
      const res = await fetch(`${apiUrl}/api/admin/posts/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!res.ok && res.status !== 204) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to delete post");
      }

      setConfirmingId(null);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete post");
    } finally {
      setDeletingId(null);
    }
  }

  if (posts.length === 0) {
    return (
      <p className="mt-8 text-sm text-navy/60">
        No articles yet. Click &ldquo;New Post&rdquo; to write the first one.
      </p>
    );
  }

  return (
    <div className="mt-8 overflow-x-auto rounded-xl border border-navy/10">
      {error && (
        <p className="border-b border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead className="bg-navy/5 text-navy/70">
          <tr>
            <th className="px-4 py-3 font-medium">Title</th>
            <th className="px-4 py-3 font-medium">Slug</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium">Date</th>
            <th className="px-4 py-3 font-medium text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {posts.map((post) => (
            <tr key={post.id} className="border-t border-navy/10">
              <td className="px-4 py-3 font-medium text-navy">{post.title}</td>
              <td className="px-4 py-3 font-mono text-xs text-navy/60">/{post.slug}</td>
              <td className="px-4 py-3">
                <span
                  className={
                    post.published
                      ? "rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-600"
                      : "rounded-full bg-navy/10 px-2.5 py-1 text-xs font-semibold text-navy/60"
                  }
                >
                  {post.published ? "Published" : "Draft"}
                </span>
              </td>
              <td className="px-4 py-3 text-navy/70">{formatPostDate(post.createdAt)}</td>
              <td className="px-4 py-3">
                <div className="flex justify-end gap-2">
                  <Link
                    href={`/admin/posts/${post.id}/edit`}
                    className="rounded-full border border-navy/20 px-3 py-1 text-xs font-medium text-navy transition hover:border-navy/40"
                  >
                    Edit
                  </Link>
                  {confirmingId === post.id ? (
                    <>
                      <button
                        onClick={() => handleDelete(post.id)}
                        disabled={deletingId === post.id}
                        className="rounded-full bg-red-600 px-3 py-1 text-xs font-medium text-white transition hover:bg-red-700 disabled:opacity-60"
                      >
                        {deletingId === post.id ? "Deleting…" : "Confirm"}
                      </button>
                      <button
                        onClick={() => setConfirmingId(null)}
                        className="rounded-full border border-navy/20 px-3 py-1 text-xs font-medium text-navy/60"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setConfirmingId(post.id)}
                      className="rounded-full border border-red-200 px-3 py-1 text-xs font-medium text-red-600 transition hover:border-red-400"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
