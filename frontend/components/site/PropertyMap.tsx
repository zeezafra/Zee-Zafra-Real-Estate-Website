import { ExternalLink, GraduationCap, HeartPulse, ShoppingBag, Utensils } from "lucide-react";

// Phase 25. Server component — no JS shipped. Uses OpenStreetMap's public
// embed (free, no API key). The "nearby" chips are plain Google Maps search
// links centered on the pin, so there's no Places API key or paid data;
// they open in a new tab.
const NEARBY = [
  { label: "Schools", query: "schools", icon: GraduationCap },
  { label: "Hospitals", query: "hospital", icon: HeartPulse },
  { label: "Malls & Groceries", query: "mall supermarket", icon: ShoppingBag },
  { label: "Restaurants", query: "restaurants", icon: Utensils },
];

export default function PropertyMap({
  latitude,
  longitude,
  title,
}: {
  latitude: number;
  longitude: number;
  title: string;
}) {
  // bbox is ~600 m either side of the pin; marker= draws the pin itself.
  const d = 0.006;
  const bbox = [longitude - d, latitude - d, longitude + d, latitude + d].join(",");
  const src = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${latitude},${longitude}`;
  const pin = `${latitude},${longitude}`;

  return (
    <section aria-labelledby="map-heading" className="mt-8 border-t border-navy/10 pt-8 dark:border-offwhite/10">
      <h2 id="map-heading" className="text-lg font-semibold text-navy dark:text-offwhite">
        Location
      </h2>

      <div className="mt-4 overflow-hidden rounded-2xl border border-navy/10 dark:border-offwhite/10">
        <iframe
          title={`Map showing the location of ${title}`}
          src={src}
          loading="lazy"
          referrerPolicy="no-referrer"
          className="h-72 w-full sm:h-80"
        />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <a
          href={`https://www.google.com/maps/search/?api=1&query=${pin}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-full bg-gold px-4 py-2 text-sm font-semibold text-navy transition hover:bg-gold-light"
        >
          <ExternalLink size={14} /> Open in Google Maps
        </a>
        {NEARBY.map(({ label, query, icon: Icon }) => (
          <a
            key={label}
            href={`https://www.google.com/maps/search/${encodeURIComponent(query)}/@${latitude},${longitude},15z`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full border border-navy/20 px-4 py-2 text-sm font-medium text-navy transition hover:border-gold hover:text-gold dark:border-offwhite/20 dark:text-offwhite"
          >
            <Icon size={14} /> Nearby {label}
          </a>
        ))}
      </div>
    </section>
  );
}
