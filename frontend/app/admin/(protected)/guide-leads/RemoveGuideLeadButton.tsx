"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RemoveGuideLeadButton({ id, apiUrl }: { id: string; apiUrl: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function remove() {
    if (!window.confirm("Remove this guide lead? This can't be undone.")) return;
    setBusy(true);
    try {
      const res = await fetch(`${apiUrl}/api/admin/guide-leads/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok && res.status !== 404) throw new Error();
      router.refresh();
    } catch {
      window.alert("Couldn't remove — try again.");
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={remove}
      disabled={busy}
      className="text-xs font-medium text-red-600 underline-offset-2 hover:underline disabled:opacity-50"
    >
      {busy ? "Removing…" : "Remove"}
    </button>
  );
}
