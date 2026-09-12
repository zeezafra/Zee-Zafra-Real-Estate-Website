"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LogoutButton() {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!apiUrl) return;

    setLoggingOut(true);
    try {
      await fetch(`${apiUrl}/api/admin/logout`, {
        method: "POST",
        credentials: "include",
      });
    } finally {
      router.push("/admin/login");
      router.refresh();
    }
  }

  return (
    <button
      onClick={handleLogout}
      disabled={loggingOut}
      className="rounded-full border border-navy/20 px-4 py-2 text-sm font-medium text-navy transition hover:border-navy/40 disabled:opacity-60"
    >
      {loggingOut ? "Signing out…" : "Log out"}
    </button>
  );
}
