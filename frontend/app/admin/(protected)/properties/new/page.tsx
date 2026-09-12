import PropertyForm from "../PropertyForm";

export default function NewPropertyPage() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";

  return (
    <main className="mx-auto min-h-screen max-w-3xl px-6 py-10">
      <h1 className="text-3xl font-bold text-navy">Add Listing</h1>
      <p className="mt-1 text-sm text-navy/60">
        Fill in the details below. Photos upload to Cloudinary when you save.
      </p>
      <div className="mt-8">
        <PropertyForm apiUrl={apiUrl} />
      </div>
    </main>
  );
}
