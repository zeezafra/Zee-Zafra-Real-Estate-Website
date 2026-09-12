import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/adminAuth";

// Everything under this route group (currently just /admin itself; Phase 4
// adds /admin/properties/new etc. as siblings inside the same group) is
// gated here. /admin/login lives outside the group so it isn't itself
// protected — see the folder structure: app/admin/login/ vs
// app/admin/(protected)/.
export default async function ProtectedAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getAdminSession();

  if (!session) {
    redirect("/admin/login");
  }

  return <>{children}</>;
}
