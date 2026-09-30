"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import {
  LISTING_TYPES,
  PROPERTY_STATUSES,
  PROPERTY_TYPES,
  type Property,
} from "@/lib/types";
import ImageManager, { photosFromUrls, type PhotoItem } from "./ImageManager";

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
  // Phase 25. `coordinates` is one pasted "lat, lng" string (what Google Maps
  // copies on right-click) — split into latitude/longitude on submit.
  coordinates: string;
  videoUrl: string;
  // Datetime-local input value ("YYYY-MM-DDTHH:mm"), or "" for no
  // schedule. Only sent/shown while status is DRAFT.
  publishAt: string;
  // "YYYY-MM-DD", or "" to let the server stamp today's date. Only shown and
  // sent while status is SOLD (Recently Sold / Rented track record).
  soldAt: string;
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
    coordinates:
      property?.latitude != null && property?.longitude != null
        ? `${property.latitude}, ${property.longitude}`
        : "",
    videoUrl: property?.videoUrl ?? "",
    publishAt: toDatetimeLocal(property?.publishAt ?? null),
    soldAt: property?.soldAt ? property.soldAt.slice(0, 10) : "",
  };
}

// ISO string (or null) -> the value a <input type="datetime-local"> wants,
// in the browser's local time zone (the admin picks a wall-clock time,
// not a UTC instant, same as preferredDate/preferredTime elsewhere).
function toDatetimeLocal(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// Accepts "10.3157, 123.8854" (Google Maps' copy format), or the same with a
// space instead of a comma. Returns null when blank, "invalid" when unparseable.
function parseCoordinates(input: string): { lat: number; lng: number } | null | "invalid" {
  const trimmed = input.trim();
  if (!trimmed) return null;
  const parts = trimmed.split(/[,\s]+/).filter(Boolean);
  if (parts.length !== 2) return "invalid";
  const lat = Number(parts[0]);
  const lng = Number(parts[1]);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return "invalid";
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return "invalid";
  return { lat, lng };
}

export default function PropertyForm({ apiUrl, property }: Props) {
  const router = useRouter();
  const isEdit = Boolean(property);

  const [form, setForm] = useState<FormState>(toFormState(property));
  const [photos, setPhotos] = useState<PhotoItem[]>(() => photosFromUrls(property?.images ?? []));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  // Uploads every new (File) photo in one call -- Cloudinary returns URLs
  // in the order the files were sent -- then rebuilds the final images
  // array by walking `photos` in its current (possibly drag-reordered)
  // order and substituting each new item's uploaded URL.
  async function resolveImages(): Promise<string[]> {
    const newItems = photos.filter(
      (p): p is Extract<PhotoItem, { kind: "new" }> => p.kind === "new"
    );

    let uploadedUrls: string[] = [];
    if (newItems.length > 0) {
      const body = new FormData();
      newItems.forEach((p) => body.append("images", p.file));

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
      uploadedUrls = data.urls;
    }

    let i = 0;
    return photos.map((p) => (p.kind === "existing" ? p.url : uploadedUrls[i++]));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const coords = parseCoordinates(form.coordinates);
      if (coords === "invalid") {
        throw new Error('Map coordinates must look like "10.3157, 123.8854".');
      }

      const images = await resolveImages();

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
        latitude: coords ? coords.lat : null,
        longitude: coords ? coords.lng : null,
        videoUrl: form.videoUrl.trim() || null,
        // Only meaningful (and only sent) while Draft.
        publishAt:
          form.status === "DRAFT" && form.publishAt
            ? new Date(form.publishAt).toISOString()
            : null,
        // Only while SOLD, and only when Zee typed one — otherwise the key is
        // omitted and the backend stamps today's date (or, for a listing that
        // isn't SOLD, clears it).
        ...(form.status === "SOLD" && form.soldAt ? { soldAt: form.soldAt } : {}),
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

        {form.status === "DRAFT" && (
          <label className={labelClass}>
            Auto-publish at (optional)
            <input
              type="datetime-local"
              value={form.publishAt}
              onChange={(e) => updateField("publishAt", e.target.value)}
              className={inputClass}
            />
            <span className="mt-1 block text-xs font-normal text-navy/50">
              Leave blank to keep this as a plain draft you publish manually. Set a date/time
              and it goes live (status flips to Available) automatically, roughly every 15
              minutes.
            </span>
          </label>
        )}

        {form.status === "SOLD" && (
          <label className={labelClass}>
            Date {form.listingType === "FOR_RENT" ? "rented" : "sold"} (optional)
            <input
              type="date"
              value={form.soldAt}
              max={new Date().toISOString().slice(0, 10)}
              onChange={(e) => updateField("soldAt", e.target.value)}
              className={inputClass}
            />
            <span className="mt-1 block text-xs font-normal text-navy/50">
              Shown on the public &ldquo;Recently Sold &amp; Rented&rdquo; page as month and year.
              Leave blank to use today&rsquo;s date. Backdate it for deals you closed before this
              site existed.
            </span>
          </label>
        )}

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

        <label className={`${labelClass} sm:col-span-2`}>
          Map coordinates (optional)
          <input
            value={form.coordinates}
            onChange={(e) => updateField("coordinates", e.target.value)}
            placeholder="10.3157, 123.8854"
            className={inputClass}
          />
          <span className="mt-1 block text-xs font-normal text-navy/50">
            In Google Maps, right-click the exact spot and click the coordinates at the top of the
            menu to copy them, then paste here. Leave blank to hide the map.
          </span>
        </label>

        <label className={`${labelClass} sm:col-span-2`}>
          Video tour link (optional)
          <input
            type="url"
            value={form.videoUrl}
            onChange={(e) => updateField("videoUrl", e.target.value)}
            placeholder="https://www.youtube.com/watch?v=… or a public Facebook video/reel"
            className={inputClass}
          />
          <span className="mt-1 block text-xs font-normal text-navy/50">
            YouTube, Vimeo and public Facebook videos play on the page. Other links show as a
            &ldquo;Watch the video tour&rdquo; button.
          </span>
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

      <ImageManager photos={photos} onChange={setPhotos} />

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
