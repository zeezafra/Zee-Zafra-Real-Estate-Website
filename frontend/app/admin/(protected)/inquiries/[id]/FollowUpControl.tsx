"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

// Phase 19. Item 7 (half of it — "last contacted" is read-only, stamped
// automatically by the backend whenever status changes; see StatusControl
// and the schema comment on Inquiry.lastContactedAt). This half is the
// admin-set target date, same client-mutates/server-refreshes split as
// StatusControl.
export default function FollowUpControl({
  inquiryId,
  nextFollowUpDate,
  apiUrl,
}: {
  inquiryId: string;
  nextFollowUpDate: string | null;
  apiUrl: string;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleChange(value: string) {
    setSaving(true);
    setError(null);

    try {
      const res = await fetch(`${apiUrl}/api/admin/inquiries/${inquiryId}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nextFollowUpDate: value || null }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to update follow-up date");
      }

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update follow-up date");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <label className="text-xs font-semibold uppercase tracking-wide text-navy/50">
        Next Follow-up
      </label>
      <input
        type="date"
        defaultValue={nextFollowUpDate ?? ""}
        disabled={saving}
        onBlur={(e) => handleChange(e.target.value)}
        className="mt-1 block rounded-lg border border-navy/15 bg-white px-3 py-1.5 text-sm text-navy focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold disabled:opacity-60 dark:border-offwhite/15 dark:bg-navy-light dark:text-offwhite"
      />
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
