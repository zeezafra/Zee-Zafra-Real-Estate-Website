"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Property } from "@/lib/types";

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
      <table className="w-full min-w-[760px] text-left text-sm">
        <thead className="bg-navy/5 text-navy/70">
          <tr>
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
            <tr key={property.id} className="border-t border-navy/10">
              <td className="px-4 py-3 font-medium text-navy">{property.title}</td>
              <td className="px-4 py-3 text-navy/70">{property.type.replace(/_/g, " ")}</td>
              <td className="px-4 py-3 text-navy/70">{property.listingType.replace("_", " ")}</td>
              <td className="px-4 py-3 text-navy/70">{property.status}</td>
              <td className="px-4 py-3 text-navy/70">
                ₱{property.price.toLocaleString()}
                {property.listingType === "FOR_RENT" && property.rentPeriod
                  ? ` / ${property.rentPeriod}`
                  : ""}
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
