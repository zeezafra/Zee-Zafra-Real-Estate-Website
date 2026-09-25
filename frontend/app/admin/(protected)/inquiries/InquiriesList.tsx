"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { CalendarClock } from "lucide-react";
import type { AdminInquiry } from "@/lib/adminAuth";
import { INQUIRY_STATUSES, INQUIRY_STATUS_STYLES } from "@/lib/types";
import { formatFollowUpDate, formatRefNo, isFollowUpOverdue } from "@/lib/format";

function statusLabel(status: string): string {
  return INQUIRY_STATUSES.find((s) => s.value === status)?.label ?? status;
}

// Phase 19. Item 10 of the CRM recommendation. Client component since
// checkbox selection is local, transient UI state — the list itself is
// still server-fetched by the parent page and passed in as a prop, same
// split as StatusControl/PostsTable elsewhere in this app.
export default function InquiriesList({
  inquiries,
  apiUrl,
  showArchived,
  showSpam,
}: {
  inquiries: AdminInquiry[];
  apiUrl: string;
  showArchived: boolean;
  // Phase 20. Same "which view is this list currently rendering" role as
  // showArchived, but for the Spam view — decides whether rows show a
  // "Mark spam"/"Not spam" action and whether the bulk bar's other actions
  // (contacting/closing junk doesn't mean anything) are shown at all.
  showSpam: boolean;
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Phase 20. Per-row spam toggle, separate from the bulk-select flow
  // above — marking a single junk submission shouldn't require checking
  // its box first. Keyed by inquiry id so only the row being updated shows
  // a disabled state.
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  // Delete is its own busy-state, separate from updatingId (spam toggle)
  // and applying (bulk PATCH) — a row can only be mid-delete, never both.
  const [deletingId, setDeletingId] = useState<string | null>(null);

  function toggle(id: string, checked: boolean) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  async function applyBulk(body: { status?: string; archived?: boolean; spam?: boolean }) {
    setApplying(true);
    setError(null);

    try {
      const res = await fetch(`${apiUrl}/api/admin/inquiries/bulk`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: Array.from(selected), ...body }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Bulk action failed");
      }

      setSelected(new Set());
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bulk action failed");
    } finally {
      setApplying(false);
    }
  }

  async function setSpam(id: string, spam: boolean) {
    setUpdatingId(id);
    setError(null);

    try {
      const res = await fetch(`${apiUrl}/api/admin/inquiries/${id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ spam }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to update");
      }

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update");
    } finally {
      setUpdatingId(null);
    }
  }

  async function deleteBulk() {
    const count = selected.size;
    if (
      !window.confirm(
        `Permanently delete ${count} ${count === 1 ? "inquiry" : "inquiries"}? This can't be undone.`,
      )
    ) {
      return;
    }

    setApplying(true);
    setError(null);

    try {
      const res = await fetch(`${apiUrl}/api/admin/inquiries/bulk`, {
        method: "DELETE",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: Array.from(selected) }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Delete failed");
      }

      setSelected(new Set());
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setApplying(false);
    }
  }

  async function deleteOne(id: string, name: string) {
    if (!window.confirm(`Permanently delete the inquiry from ${name}? This can't be undone.`)) {
      return;
    }

    setDeletingId(id);
    setError(null);

    try {
      const res = await fetch(`${apiUrl}/api/admin/inquiries/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Delete failed");
      }

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="mt-8">
      {selected.size > 0 && (
        <div className="sticky top-2 z-10 mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-navy/15 bg-offwhite p-3 shadow-sm dark:bg-navy-light">
          <span className="text-sm font-medium text-navy">
            {selected.size} selected
          </span>
          {showSpam ? (
            // Phase 20. In the Spam view, contacting/closing/archiving a
            // flagged submission doesn't mean anything — the only bulk
            // action that makes sense here is restoring false positives.
            <button
              disabled={applying}
              onClick={() => applyBulk({ spam: false })}
              className="rounded-full border border-navy/20 px-3 py-1.5 text-sm font-medium text-navy transition hover:border-navy/40 disabled:opacity-60"
            >
              Not Spam
            </button>
          ) : (
            <>
              <button
                disabled={applying}
                onClick={() => applyBulk({ status: "CONTACTED" })}
                className="rounded-full border border-navy/20 px-3 py-1.5 text-sm font-medium text-navy transition hover:border-navy/40 disabled:opacity-60"
              >
                Mark Contacted
              </button>
              <button
                disabled={applying}
                onClick={() => applyBulk({ status: "CLOSED_LOST" })}
                className="rounded-full border border-navy/20 px-3 py-1.5 text-sm font-medium text-navy transition hover:border-navy/40 disabled:opacity-60"
              >
                Mark Closed
              </button>
              <button
                disabled={applying}
                onClick={() => applyBulk({ archived: !showArchived })}
                className="rounded-full border border-navy/20 px-3 py-1.5 text-sm font-medium text-navy transition hover:border-navy/40 disabled:opacity-60"
              >
                {showArchived ? "Unarchive" : "Archive"}
              </button>
              <button
                disabled={applying}
                onClick={() => applyBulk({ spam: true })}
                className="rounded-full border border-navy/20 px-3 py-1.5 text-sm font-medium text-navy transition hover:border-navy/40 disabled:opacity-60"
              >
                Mark as Spam
              </button>
            </>
          )}
          <button
            disabled={applying}
            onClick={deleteBulk}
            className="rounded-full border border-red-300 px-3 py-1.5 text-sm font-medium text-red-600 transition hover:border-red-500 hover:bg-red-50 disabled:opacity-60"
          >
            Delete
          </button>
          <button
            onClick={() => setSelected(new Set())}
            className="text-sm font-medium text-navy/60 underline-offset-2 hover:underline"
          >
            Clear selection
          </button>
        </div>
      )}
      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

      <div className="space-y-3">
        {inquiries.map((inquiry) => {
          const overdue = isFollowUpOverdue(inquiry.nextFollowUpDate);
          return (
            <div
              key={inquiry.id}
              className="flex gap-3 rounded-xl border border-navy/10 p-4 transition hover:border-navy/25 hover:bg-navy/[0.02]"
            >
              <input
                type="checkbox"
                checked={selected.has(inquiry.id)}
                onChange={(e) => toggle(inquiry.id, e.target.checked)}
                onClick={(e) => e.stopPropagation()}
                className="mt-1.5 h-4 w-4 shrink-0 accent-navy"
                aria-label={`Select inquiry from ${inquiry.name}`}
              />
              <Link href={`/admin/inquiries/${inquiry.id}`} className="block flex-1">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-navy">{inquiry.name}</p>
                      {inquiry.type === "SELLER" && (
                        <span className="rounded-full bg-gold/20 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-navy">
                          Seller
                        </span>
                      )}
                      {showSpam && (
                        <span className="rounded-full bg-red-500/15 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-red-700">
                          Spam
                        </span>
                      )}
                      <span
                        className={`rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${INQUIRY_STATUS_STYLES[inquiry.status]}`}
                      >
                        {statusLabel(inquiry.status)}
                      </span>
                      {(inquiry.preferredDate || inquiry.preferredTime) && (
                        <span className="flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
                          <CalendarClock size={11} />
                          Viewing
                        </span>
                      )}
                      {overdue && (
                        <span className="rounded-full bg-red-500/15 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-red-700">
                          Follow-up overdue
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-navy/60">
                      {[inquiry.email, inquiry.phone].filter(Boolean).join(" · ") ||
                        "No contact info provided"}
                    </p>
                  </div>
                  <p className="shrink-0 text-xs text-navy/50">
                    {new Date(inquiry.createdAt).toLocaleString()}
                  </p>
                </div>

                {inquiry.property && (
                  <p className="mt-2 text-xs font-medium text-navy/70">
                    Re: {inquiry.property.title} ({formatRefNo(inquiry.property.refNo)})
                  </p>
                )}

                {inquiry.nextFollowUpDate && (
                  <p
                    className={`mt-1 text-xs font-medium ${overdue ? "text-red-600" : "text-navy/60"}`}
                  >
                    Next follow-up: {formatFollowUpDate(inquiry.nextFollowUpDate)}
                  </p>
                )}

                <p className="mt-2 truncate text-sm text-navy/70">{inquiry.message}</p>
              </Link>

              {/* Phase 20. Sibling of the <Link> above, not nested inside
                  it — a <button> inside an <a> is invalid HTML, same
                  constraint the checkbox and SaveButton's "icon" variant
                  already work around. Doesn't require selecting the row's
                  checkbox first, unlike the bulk actions in the toolbar. */}
              <div className="flex shrink-0 flex-col items-stretch gap-1.5 self-start">
                <button
                  type="button"
                  disabled={updatingId === inquiry.id}
                  onClick={() => setSpam(inquiry.id, !showSpam)}
                  className="h-fit rounded-full border border-navy/20 px-2.5 py-1 text-[11px] font-medium text-navy/70 transition hover:border-navy/40 hover:text-navy disabled:opacity-60"
                >
                  {showSpam ? "Not spam" : "Mark spam"}
                </button>
                <button
                  type="button"
                  disabled={deletingId === inquiry.id}
                  onClick={() => deleteOne(inquiry.id, inquiry.name)}
                  className="h-fit rounded-full border border-red-300 px-2.5 py-1 text-[11px] font-medium text-red-600 transition hover:border-red-500 hover:bg-red-50 disabled:opacity-60"
                >
                  Delete
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
