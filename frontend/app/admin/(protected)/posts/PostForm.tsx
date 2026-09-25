"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import type { Post } from "@/lib/types";
import { slugify } from "@/lib/slug";

type Props = {
  apiUrl: string;
  post?: Post; // present in edit mode, absent in create mode
};

type FormState = {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  published: boolean;
};

function toFormState(post?: Post): FormState {
  return {
    title: post?.title ?? "",
    slug: post?.slug ?? "",
    excerpt: post?.excerpt ?? "",
    content: post?.content ?? "",
    published: post?.published ?? true,
  };
}

export default function PostForm({ apiUrl, post }: Props) {
  const router = useRouter();
  const isEdit = Boolean(post);

  const [form, setForm] = useState<FormState>(toFormState(post));
  // Once the admin has touched the slug field directly, typing in Title
  // stops overwriting it — same "suggest, don't fight the user" rule a
  // slug field always needs. Starts true in edit mode: an existing post
  // already has a deliberate slug that a title edit shouldn't silently
  // reshuffle out from under a link someone may have already shared.
  const [slugTouched, setSlugTouched] = useState(isEdit);
  const [existingCoverImage, setExistingCoverImage] = useState<string | null>(
    post?.coverImage ?? null
  );
  const [newFile, setNewFile] = useState<File | null>(null);
  const [newPreview, setNewPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleTitleChange(value: string) {
    setForm((prev) => ({
      ...prev,
      title: value,
      slug: slugTouched ? prev.slug : slugify(value),
    }));
  }

  function handleSlugChange(value: string) {
    setSlugTouched(true);
    updateField("slug", value);
  }

  function handleFileSelected(fileList: FileList | null) {
    const file = fileList?.[0];
    if (!file) return;
    setNewFile(file);
    setNewPreview(URL.createObjectURL(file));
  }

  function removeCoverImage() {
    setExistingCoverImage(null);
    setNewFile(null);
    setNewPreview(null);
  }

  // Reuses the existing Phase 4 upload endpoint — it already accepts up
  // to 10 files under "images" and returns their Cloudinary URLs; a post
  // just ever sends one.
  async function uploadCoverImage(): Promise<string | null> {
    if (!newFile) return null;

    const body = new FormData();
    body.append("images", newFile);

    const res = await fetch(`${apiUrl}/api/admin/upload`, {
      method: "POST",
      credentials: "include",
      body,
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || "Image upload failed");
    }

    const data = (await res.json()) as { urls: string[] };
    return data.urls[0] ?? null;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const uploadedUrl = await uploadCoverImage();
      const coverImage = uploadedUrl ?? existingCoverImage;

      const payload = {
        title: form.title,
        slug: form.slug,
        excerpt: form.excerpt,
        content: form.content,
        coverImage,
        published: form.published,
      };

      const url = isEdit
        ? `${apiUrl}/api/admin/posts/${post!.id}`
        : `${apiUrl}/api/admin/posts`;

      const res = await fetch(url, {
        method: isEdit ? "PATCH" : "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to save post");
      }

      router.push("/admin/posts");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save post");
      setSubmitting(false);
    }
  }

  const inputClass =
    "mt-1 w-full rounded-lg border border-navy/20 px-3 py-2 text-navy focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold";
  const labelClass = "block text-sm font-medium text-navy";
  const coverPreview = newPreview ?? existingCoverImage;

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-2xl space-y-6 pb-16">
      <div className="grid gap-4">
        <label className={labelClass}>
          Title
          <input
            required
            value={form.title}
            onChange={(e) => handleTitleChange(e.target.value)}
            className={inputClass}
          />
        </label>

        <label className={labelClass}>
          Slug
          <div className="mt-1 flex items-center gap-1 text-sm text-navy/50">
            <span>/blog/</span>
            <input
              required
              value={form.slug}
              onChange={(e) => handleSlugChange(e.target.value)}
              pattern="[a-z0-9]+(-[a-z0-9]+)*"
              title="Lowercase letters, numbers, and hyphens only"
              className="w-full rounded-lg border border-navy/20 px-3 py-2 font-mono text-navy focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
            />
          </div>
          <p className="mt-1 text-xs text-navy/50">
            Auto-filled from the title until you edit it directly. Changing it later
            breaks any link already shared to this post.
          </p>
        </label>

        <label className={labelClass}>
          Excerpt
          <textarea
            required
            rows={2}
            value={form.excerpt}
            onChange={(e) => updateField("excerpt", e.target.value)}
            className={inputClass}
            placeholder="A one- or two-sentence teaser shown on /blog and the homepage."
          />
        </label>

        <label className={labelClass}>
          Content
          <textarea
            required
            rows={14}
            value={form.content}
            onChange={(e) => updateField("content", e.target.value)}
            className={inputClass}
            placeholder="Leave a blank line between paragraphs — that's what controls spacing on the published page."
          />
        </label>

        <label className="flex items-center gap-2 text-sm font-medium text-navy">
          <input
            type="checkbox"
            checked={form.published}
            onChange={(e) => updateField("published", e.target.checked)}
            className="h-4 w-4 rounded border-navy/30 text-gold focus:ring-gold"
          />
          Published (unchecking saves it as a draft — visible here, not on the site)
        </label>
      </div>

      <div>
        <span className={labelClass}>Cover Image</span>

        {coverPreview && (
          <div className="group relative mt-2 aspect-[16/9] w-full max-w-sm overflow-hidden rounded-lg border border-navy/10">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={coverPreview} alt="" className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={removeCoverImage}
              className="absolute right-1 top-1 rounded-full bg-navy/80 px-2 py-0.5 text-xs text-white opacity-0 transition group-hover:opacity-100"
            >
              Remove
            </button>
          </div>
        )}

        <input
          type="file"
          accept="image/*"
          onChange={(e) => handleFileSelected(e.target.files)}
          className="mt-3 block w-full text-sm text-navy/70 file:mr-4 file:rounded-full file:border-0 file:bg-navy/5 file:px-4 file:py-2 file:text-sm file:font-medium file:text-navy hover:file:bg-navy/10"
        />
      </div>

      {error && (
        <p className="rounded-lg bg-red-100 px-3 py-2 text-sm font-medium text-red-700">
          {error}
        </p>
      )}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-full bg-gold px-6 py-2 font-semibold text-navy transition hover:bg-gold-light disabled:opacity-60"
        >
          {submitting ? "Saving…" : isEdit ? "Save Changes" : "Create Post"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/admin/posts")}
          className="rounded-full border border-navy/20 px-6 py-2 font-medium text-navy transition hover:border-navy/40"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
