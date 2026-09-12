import { notFound } from "next/navigation";
import type { Property } from "@/lib/types";
import PropertyForm from "../../PropertyForm";

async function getProperty(id: string): Promise<Property | null> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl) return null;

  try {
    const res = await fetch(`${apiUrl}/api/properties/${id}`, { cache: "no-store" });
    if (!res.ok) return null;
    return (await res.json()) as Property;
  } catch {
    return null;
  }
}

export default async function EditPropertyPage({
  params,
}: {
  params: { id: string };
}) {
  const property = await getProperty(params.id);
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
