"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import type { InquiryNote } from "@/lib/types";

// Phase 19. Item 8 of the CRM recommendation. SYSTEM notes (status
// changes, follow-up scheduling, archive toggles — auto-created by the
// backend) and MANUAL notes (typed here) render in the same
// chronological list, styled differently so the auto-log doesn't read as
// something the admin claimed to have done.
export default function NotesTimeline({
  inquiryId,
  notes,
  apiUrl,
}: {
  inquiryId: string;
  notes: InquiryNote[];
  apiUrl: string;
}) {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = content.trim();
    if (!trimmed) return;

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`${apiUrl}/api/admin/inquiries/${inquiryId}/notes`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: trimmed }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to add note");
      }

      setContent("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add note");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mt-6 rounded-xl border border-navy/10 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-navy/50">
        Activity
      </p>

      <form onSubmit={handleSubmit} className="mt-3 flex gap-2">
        <input
          type="text"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Log a call, message, or update…"
          className="flex-1 rounded-lg border border-navy/15 bg-white px-3 py-2 text-sm text-navy placeholder:text-navy/40 focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold dark:border-offwhite/15 dark:bg-navy-light dark:text-offwhite"
        />
        <button
          type="submit"
          disabled={submitting || !content.trim()}
          className="rounded-full bg-navy px-4 py-2 text-sm font-medium text-offwhite transition hover:bg-navy/90 disabled:opacity-60"
        >
          Add
        </button>
      </form>
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}

      {notes.length === 0 ? (
        <p className="mt-4 text-sm text-navy/50">No activity logged yet.</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {notes.map((note) => (
            <li key={note.id} className="flex gap-3 text-sm">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-navy/30" />
              <div>
                <p
                  className={
                    note.type === "SYSTEM"
                      ? "italic text-navy/50"
                      : "text-navy/80"
                  }
                >
                  {note.content}
                </p>
                <p className="text-xs text-navy/40">
                  {new Date(note.createdAt).toLocaleString()}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
