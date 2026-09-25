"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import {
  LISTING_TYPES,
  PROPERTY_STATUSES,
  PROPERTY_TYPES,
  type Property,
} from "@/lib/types";

type Props = {
  apiUrl: string;
  property?: Property; // present in edit mode, absent in create mode
};

type FormState = {
  title: string;
  type: string;
  listingType: string;
  status: string;
  price: string;
  // Phase 12. `priceReduced` is UI-only — it just toggles whether the
  // Original Price field shows — the payload derives originalPrice from
  // both (null when unchecked) rather than sending this boolean anywhere.
  priceReduced: boolean;
  originalPrice: string;
  rentPeriod: string;
  location: string;
  beds: string;
  baths: string;
  carSpaces: string;
  sqm: string;
  description: string;
  featured: boolean;
};

function toFormState(property?: Property): FormState {
  return {
    title: property?.title ?? "",
    type: property?.type ?? PROPERTY_TYPES[0].value,
    listingType: property?.listingType ?? LISTING_TYPES[0].value,
    status: property?.status ?? "AVAILABLE",
    price: property ? String(property.price) : "",
    priceReduced: property?.originalPrice != null,
    originalPrice: property?.originalPrice != null ? String(property.originalPrice) : "",
    rentPeriod: property?.rentPeriod ?? "",
    location: property?.location ?? "",
    beds: property?.beds != null ? String(property.beds) : "",
    baths: property?.baths != null ? String(property.baths) : "",
    carSpaces: property?.carSpaces != null ? String(property.carSpaces) : "",
    sqm: property ? String(property.sqm) : "",
    description: property?.description ?? "",
    featured: property?.featured ?? false,
  };
}

export default function PropertyForm({ apiUrl, property }: Props) {
  const router = useRouter();
  const isEdit = Boolean(property);

  const [form, setForm] = useState<FormState>(toFormState(property));
  const [existingImages, setExistingImages] = useState<string[]>(property?.images ?? []);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [newPreviews, setNewPreviews] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleFilesSelected(fileList: FileList | null) {
    if (!fileList) return;
    const files = Array.from(fileList);
    setNewFiles((prev) => [...prev, ...files]);
    setNewPreviews((prev) => [...prev, ...files.map((file) => URL.createObjectURL(file))]);
  }

  function removeExistingImage(url: string) {
    setExistingImages((prev) => prev.filter((image) => image !== url));
  }

  function removeNewFile(index: number) {
    setNewFiles((prev) => prev.filter((_, i) => i !== index));
    setNewPreviews((prev) => prev.filter((_, i) => i !== index));
  }

  async function uploadNewFiles(): Promise<string[]> {
    if (newFiles.length === 0) return [];

    const body = new FormData();
    newFiles.forEach((file) => body.append("images", file));

    const res = await fetch(`${apiUrl}/api/admin/upload`, {
      method: "POST",
      credentials: "include",
      body,
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || "Image upload failed");
    }

    const data = (await res.json()) as { urls: string[] };
    return data.urls;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const uploadedUrls = await uploadNewFiles();
      const images = [...existingImages, ...uploadedUrls];

      const payload = {
        title: form.title,
        type: form.type,
        listingType: form.listingType,
        status: form.status,
        price: Number(form.price),
        originalPrice: form.priceReduced && form.originalPrice ? Number(form.originalPrice) : null,
        rentPeriod: form.listingType === "FOR_RENT" ? form.rentPeriod || null : null,
        location: form.location,
        beds: form.beds === "" ? null : Number(form.beds),
        baths: form.baths === "" ? null : Number(form.baths),
        carSpaces: form.carSpaces === "" ? null : Number(form.carSpaces),
        sqm: Number(form.sqm),
        description: form.description,
        images,
        featured: form.featured,
      };

      const url = isEdit
        ? `${apiUrl}/api/admin/properties/${property!.id}`
        : `${apiUrl}/api/admin/properties`;

      const res = await fetch(url, {
        method: isEdit ? "PATCH" : "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to save listing");
      }

      router.push("/admin");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save listing");
      setSubmitting(false);
    }
  }

  const inputClass =
    "mt-1 w-full rounded-lg border border-navy/20 px-3 py-2 text-navy focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold";
  const labelClass = "block text-sm font-medium text-navy";

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-2xl space-y-6 pb-16">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className={`${labelClass} sm:col-span-2`}>
          Title
          <input
            required
            value={form.title}
            onChange={(e) => updateField("title", e.target.value)}
            className={inputClass}
          />
        </label>

        <label className={labelClass}>
          Property Type
          <select
            value={form.type}
            onChange={(e) => updateField("type", e.target.value)}
            className={inputClass}
          >
            {PROPERTY_TYPES.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className={labelClass}>
          Listing Type
          <select
            value={form.listingType}
            onChange={(e) => updateField("listingType", e.target.value)}
            className={inputClass}
          >
            {LISTING_TYPES.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className={labelClass}>
          Status
          <select
            value={form.status}
            onChange={(e) => updateField("status", e.target.value)}
            className={inputClass}
          >
            {PROPERTY_STATUSES.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className={labelClass}>
          Price (₱)
          <input
            required
            type="number"
            min="0"
            value={form.price}
            onChange={(e) => updateField("price", e.target.value)}
            className={inputClass}
          />
          <span className="mt-1 text-xs font-normal text-navy/50">
            Leave as 0 to show &ldquo;Price Upon Request&rdquo; instead of a peso amount.
          </span>
        </label>

        <label className="flex items-center gap-2 text-sm font-medium text-navy sm:col-span-2">
          <input
            type="checkbox"
            checked={form.priceReduced}
            onChange={(e) => updateField("priceReduced", e.target.checked)}
            className="h-4 w-4 rounded border-navy/30 text-gold focus:ring-gold"
          />
          Price reduced from a higher original price
        </label>

        {form.priceReduced && (
          <label className={labelClass}>
            Original Price (₱)
            <input
              type="number"
              min="0"
              value={form.originalPrice}
              onChange={(e) => updateField("originalPrice", e.target.value)}
              className={inputClass}
            />
          </label>
        )}

        {form.listingType === "FOR_RENT" && (
          <label className={labelClass}>
            Rent Period (e.g. &ldquo;month&rdquo;)
            <input
              value={form.rentPeriod}
              onChange={(e) => updateField("rentPeriod", e.target.value)}
              className={inputClass}
            />
          </label>
        )}

        <label className={`${labelClass} sm:col-span-2`}>
          Location
          <input
            required
            value={form.location}
            onChange={(e) => updateField("location", e.target.value)}
            className={inputClass}
          />
        </label>

        <label className={labelClass}>
          Bedrooms
          <input
            type="number"
            min="0"
            value={form.beds}
            onChange={(e) => updateField("beds", e.target.value)}
            className={inputClass}
          />
        </label>

        <label className={labelClass}>
          Bathrooms
          <input
            type="number"
            min="0"
            value={form.baths}
            onChange={(e) => updateField("baths", e.target.value)}
            className={inputClass}
          />
        </label>

        <label className={labelClass}>
          Car Spaces
          <input
            type="number"
            min="0"
            value={form.carSpaces}
            onChange={(e) => updateField("carSpaces", e.target.value)}
            className={inputClass}
          />
        </label>

        <label className={labelClass}>
          Floor Area (sqm)
          <input
            required
            type="number"
            min="0"
            step="0.01"
            value={form.sqm}
            onChange={(e) => updateField("sqm", e.target.value)}
            className={inputClass}
          />
        </label>

        <label className={`${labelClass} sm:col-span-2`}>
          Description
          <textarea
            required
            rows={5}
            value={form.description}
            onChange={(e) => updateField("description", e.target.value)}
            className={inputClass}
          />
        </label>

        <label className="flex items-center gap-2 text-sm font-medium text-navy sm:col-span-2">
          <input
            type="checkbox"
            checked={form.featured}
            onChange={(e) => updateField("featured", e.target.checked)}
            className="h-4 w-4 rounded border-navy/30 text-gold focus:ring-gold"
          />
          Feature on homepage
        </label>
      </div>

      <div>
        <span className={labelClass}>Photos</span>

        {(existingImages.length > 0 || newPreviews.length > 0) && (
          <div className="mt-2 grid grid-cols-3 gap-3 sm:grid-cols-4">
            {existingImages.map((url) => (
              <div
                key={url}
                className="group relative aspect-square overflow-hidden rounded-lg border border-navy/10"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="" className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeExistingImage(url)}
                  className="absolute right-1 top-1 rounded-full bg-navy/80 px-2 py-0.5 text-xs text-white opacity-0 transition group-hover:opacity-100"
                >
                  Remove
                </button>
              </div>
            ))}
            {newPreviews.map((preview, index) => (
              <div
                key={preview}
                className="group relative aspect-square overflow-hidden rounded-lg border border-navy/10"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={preview} alt="" className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeNewFile(index)}
                  className="absolute right-1 top-1 rounded-full bg-navy/80 px-2 py-0.5 text-xs text-white opacity-0 transition group-hover:opacity-100"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}

        <input
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => handleFilesSelected(e.target.files)}
          className="mt-3 block w-full text-sm text-navy/70 file:mr-4 file:rounded-full file:border-0 file:bg-navy/5 file:px-4 file:py-2 file:text-sm file:font-medium file:text-navy hover:file:bg-navy/10"
        />
      </div>

      {error && (
        <p className="rounded-lg bg-red-100 px-3 py-2 text-sm font-medium text-red-700">
          {error}
        </p>
      )}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-full bg-gold px-6 py-2 font-semibold text-navy transition hover:bg-gold-light disabled:opacity-60"
        >
          {submitting ? "Saving…" : isEdit ? "Save Changes" : "Create Listing"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/admin")}
          className="rounded-full border border-navy/20 px-6 py-2 font-medium text-navy transition hover:border-navy/40"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
