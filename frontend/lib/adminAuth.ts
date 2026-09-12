import { cookies } from "next/headers";

// Must match ADMIN_COOKIE_NAME in backend/src/lib/cookieOptions.js.
const ADMIN_COOKIE_NAME = "zzp_admin_token";

export type AdminSession = { email: string };

// Server-only: reads the admin cookie out of the incoming request and asks
// the backend to verify it via GET /api/admin/me. We deliberately don't
// verify the JWT here in the frontend — that would mean sharing JWT_SECRET
// across two separately-deployed apps (Vercel + Render) for no real
// benefit, when the backend can just tell us yes/no.
export async function getAdminSession(): Promise<AdminSession | null> {
  const token = cookies().get(ADMIN_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  if (!apiUrl) {
    return null;
  }

  try {
    const res = await fetch(`${apiUrl}/api/admin/me`, {
      headers: { cookie: `${ADMIN_COOKIE_NAME}=${token}` },
      cache: "no-store",
    });

    if (!res.ok) {
      return null;
    }

    return (await res.json()) as AdminSession;
  } catch {
    return null;
  }
}
