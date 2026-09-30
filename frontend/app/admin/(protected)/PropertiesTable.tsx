"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Property } from "@/lib/types";
import { formatPrice, formatRefNo, isPriceOnRequest, isPriceReduced } from "@/lib/format";

// Phase 27. One bulk PATCH per action button, plus per-row Duplicate. Kept
// as a small fixed set (not a generic "apply any field to many rows" UI)
// because that's all the properties table's own toolbar needs -- editing
// anything else still goes through the single-property form.
const BULK_ACTIONS: { action: string; label: string }[] = [
  { action: "MARK_AVAILABLE", label: "Mark Available" },
  { action: "MARK_RESERVED", label: "Mark Reserved" },
  { action: "MARK_SOLD", label: "Mark Sold" },
  { action: "FEATURE", label: "Feature" },
  { action: "UNFEATURE", label: "Unfeature" },
];

function formatScheduled(publishAt: string | null): string | null {
  if (!publishAt) return null;
  const d = new Date(publishAt);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

export default function PropertiesTable({
  properties,
  apiUrl,
}: {
  properties: Property[];
  apiUrl: string;
}) {
  const router = useRouter();
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null);

  const allSelected = properties.length > 0 && selected.size === properties.length;
  const someSelected = selected.size > 0;

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(properties.map((p) => p.id)));
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function runBulkAction(action: string) {
    setBulkBusy(true);
    setError(null);
    try {
      const res = await fetch(`${apiUrl}/api/admin/properties/bulk`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: Array.from(selected), action }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Bulk update failed");
      }
      setSelected(new Set());
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bulk update failed");
    } finally {
      setBulkBusy(false);
    }
  }

  async function handleDuplicate(id: string) {
    setDuplicatingId(id);
    setError(null);
    try {
      const res = await fetch(`${apiUrl}/api/admin/properties/${id}/duplicate`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to duplicate listing");
      }
      const created = (await res.json()) as Property;
      router.push(`/admin/properties/${created.id}/edit`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to duplicate listing");
      setDuplicatingId(null);
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    setError(null);

    try {
      const res = await fetch(`${apiUrl}/api/admin/properties/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!res.ok && res.status !== 204) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to delete listing");
      }

      setConfirmingId(null);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete listing");
    } finally {
      setDeletingId(null);
    }
  }

  if (properties.length === 0) {
    return (
      <p className="mt-8 text-sm text-navy/60">
        No listings yet. Click &ldquo;Add Listing&rdquo; to create the first one.
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

      {someSelected && (
        <div className="flex flex-wrap items-center gap-2 border-b border-navy/10 bg-gold/10 px-4 py-2.5">
          <span className="text-sm font-medium text-navy">{selected.size} selected</span>
          {BULK_ACTIONS.map(({ action, label }) => (
            <button
              key={action}
              type="button"
              onClick={() => runBulkAction(action)}
              disabled={bulkBusy}
              className="rounded-full border border-navy/20 bg-white px-3 py-1 text-xs font-medium text-navy transition hover:border-gold hover:text-gold disabled:opacity-60"
            >
              {label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setSelected(new Set())}
            className="text-xs font-medium text-navy/50 underline-offset-2 hover:underline"
          >
            Clear
          </button>
        </div>
      )}

      <table className="w-full min-w-[820px] text-left text-sm">
        <thead className="bg-navy/5 text-navy/70">
          <tr>
            <th className="w-8 px-4 py-3">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={toggleAll}
                aria-label="Select all listings"
                className="h-4 w-4 rounded border-navy/30 text-gold focus:ring-gold"
              />
            </th>
            <th className="px-4 py-3 font-medium">Ref #</th>
            <th className="px-4 py-3 font-medium">Title</th>
            <th className="px-4 py-3 font-medium">Type</th>
            <th className="px-4 py-3 font-medium">Listing</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium">Price</th>
            <th className="px-4 py-3 font-medium">Featured</th>
            <th className="px-4 py-3 font-medium text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {properties.map((property) => (
            <tr
              key={property.id}
              className={`border-t border-navy/10 ${selected.has(property.id) ? "bg-gold/5" : ""}`}
            >
              <td className="px-4 py-3">
                <input
                  type="checkbox"
                  checked={selected.has(property.id)}
                  onChange={() => toggleOne(property.id)}
                  aria-label={`Select ${property.title}`}
                  className="h-4 w-4 rounded border-navy/30 text-gold focus:ring-gold"
                />
              </td>
              <td className="px-4 py-3 font-mono text-xs text-navy/60">
                {formatRefNo(property.refNo)}
              </td>
              <td className="px-4 py-3 font-medium text-navy">{property.title}</td>
              <td className="px-4 py-3 text-navy/70">{property.type.replace(/_/g, " ")}</td>
              <td className="px-4 py-3 text-navy/70">{property.listingType.replace("_", " ")}</td>
              <td className="px-4 py-3 text-navy/70">
                {property.status === "DRAFT" ? (
                  <span className="inline-flex flex-col">
                    <span className="inline-flex w-fit items-center rounded-full bg-navy/10 px-2 py-0.5 text-xs font-semibold text-navy">
                      Draft
                    </span>
                    {formatScheduled(property.publishAt) && (
                      <span className="mt-0.5 text-[11px] text-navy/50">
                        Publishes {formatScheduled(property.publishAt)}
                      </span>
                    )}
                  </span>
                ) : (
                  property.status
                )}
              </td>
              <td className="px-4 py-3 text-navy/70">
                {formatPrice(property)}
                {!isPriceOnRequest(property) &&
                property.listingType === "FOR_RENT" &&
                property.rentPeriod
                  ? ` / ${property.rentPeriod}`
                  : ""}
                {isPriceReduced(property) && (
                  <span className="ml-1.5 text-xs font-medium text-emerald-600">
                    ↓ was ₱{property.originalPrice!.toLocaleString()}
                  </span>
                )}
              </td>
              <td className="px-4 py-3 text-navy/70">{property.featured ? "Yes" : "—"}</td>
              <td className="px-4 py-3">
                <div className="flex justify-end gap-2">
                  <Link
                    href={`/admin/properties/${property.id}/edit`}
                    className="rounded-full border border-navy/20 px-3 py-1 text-xs font-medium text-navy transition hover:border-navy/40"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => handleDuplicate(property.id)}
                    disabled={duplicatingId === property.id}
                    className="rounded-full border border-navy/20 px-3 py-1 text-xs font-medium text-navy transition hover:border-navy/40 disabled:opacity-60"
                  >
                    {duplicatingId === property.id ? "Duplicating…" : "Duplicate"}
                  </button>
                  {confirmingId === property.id ? (
                    <>
                      <button
                        onClick={() => handleDelete(property.id)}
                        disabled={deletingId === property.id}
                        className="rounded-full bg-red-600 px-3 py-1 text-xs font-medium text-white transition hover:bg-red-700 disabled:opacity-60"
                      >
                        {deletingId === property.id ? "Deleting…" : "Confirm"}
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
                      onClick={() => setConfirmingId(property.id)}
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
