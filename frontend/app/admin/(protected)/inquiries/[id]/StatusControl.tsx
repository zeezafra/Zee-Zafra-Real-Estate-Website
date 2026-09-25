"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { InquiryStatus } from "@/lib/types";
import { INQUIRY_STATUSES, INQUIRY_STATUS_STYLES } from "@/lib/types";

// Phase 18. Same "server component fetches, client component mutates"
// split as PostsTable's publish toggle — credentials: "include" carries
// the httpOnly admin cookie since this fetch runs in the browser, not on
// the server (see adminAuth.ts's cookie-forwarding comment for why the
// two cases need different approaches).
export default function StatusControl({
  inquiryId,
  status,
  apiUrl,
}: {
  inquiryId: string;
  status: InquiryStatus;
  apiUrl: string;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleChange(next: InquiryStatus) {
    setSaving(true);
    setError(null);

    try {
      const res = await fetch(`${apiUrl}/api/admin/inquiries/${inquiryId}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to update status");
      }

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update status");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <select
        value={status}
        disabled={saving}
        onChange={(e) => handleChange(e.target.value as InquiryStatus)}
        className={`rounded-full border-0 px-3 py-1.5 text-sm font-semibold uppercase tracking-wide focus:outline-none focus:ring-2 focus:ring-gold disabled:opacity-60 ${INQUIRY_STATUS_STYLES[status]}`}
      >
        {INQUIRY_STATUSES.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  );
}
