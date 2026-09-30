import { notFound } from "next/navigation";
import { getAdminProperty } from "@/lib/adminAuth";
import PropertyForm from "../../PropertyForm";

export default async function EditPropertyPage({
  params,
}: {
  params: { id: string };
}) {
  // Phase 27: authenticated fetch (not the public route) — a DRAFT
  // listing 404s on the public GET /api/properties/:id, so editing one
  // needs the admin-scoped endpoint instead.
  const property = await getAdminProperty(params.id);
  if (!property) {
    notFound();
  }

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";

  return (
    <main className="mx-auto min-h-screen max-w-3xl px-6 py-10">
      <h1 className="text-3xl font-bold text-navy">Edit Listing</h1>
      <p className="mt-1 text-sm text-navy/60">{property.title}</p>
      <div className="mt-8">
        <PropertyForm apiUrl={apiUrl} property={property} />
      </div>
    </main>
  );
}
