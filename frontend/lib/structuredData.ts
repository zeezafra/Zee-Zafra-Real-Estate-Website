import type { Property } from "./types";
import { AGENT, SITE_URL, SOCIAL_LINKS } from "./siteConfig";
import { isPriceOnRequest } from "./format";

// Phase 25. schema.org markup. Google doesn't currently show a dedicated
// rich result for real-estate listings, but valid markup still helps it
// understand the page (price, location, bedrooms, availability) and is
// picked up by other consumers of schema.org data.

const RESIDENTIAL_TYPE: Record<Property["type"], string> = {
  HOUSE_AND_LOT: "SingleFamilyResidence",
  CONDO: "Apartment",
  TOWNHOUSE: "House",
  COMMERCIAL: "Accommodation",
  VACANT_LOT: "Place",
};

const AVAILABILITY: Record<Property["status"], string> = {
  AVAILABLE: "https://schema.org/InStock",
  RESERVED: "https://schema.org/LimitedAvailability",
  SOLD: "https://schema.org/SoldOut",
  // Phase 27: DRAFT listings are never public (see backend/src/routes/
  // properties.js), so this value is never actually rendered — it exists
  // only so this lookup stays exhaustive over PropertyStatus.
  DRAFT: "https://schema.org/OutOfStock",
};

export function propertyJsonLd(property: Property) {
  const url = `${SITE_URL}/properties/${property.id}`;
  const isLot = property.type === "VACANT_LOT";

  const about: Record<string, unknown> = {
    "@type": RESIDENTIAL_TYPE[property.type],
    name: property.title,
    address: {
      "@type": "PostalAddress",
      addressLocality: property.location,
      addressCountry: "PH",
    },
    ...(property.latitude !== null &&
      property.longitude !== null && {
        geo: {
          "@type": "GeoCoordinates",
          latitude: property.latitude,
          longitude: property.longitude,
        },
      }),
    ...(isLot
      ? {
          additionalProperty: {
            "@type": "PropertyValue",
            name: "Lot area",
            value: property.sqm,
            unitCode: "MTK",
          },
        }
      : {
          floorSize: { "@type": "QuantitativeValue", value: property.sqm, unitCode: "MTK" },
          ...(property.beds !== null && { numberOfBedrooms: property.beds }),
          ...(property.baths !== null && { numberOfBathroomsTotal: property.baths }),
        }),
  };

  const offers = isPriceOnRequest(property)
    ? undefined
    : {
        "@type": "Offer",
        url,
        priceCurrency: "PHP",
        availability: AVAILABILITY[property.status],
        ...(property.listingType === "FOR_RENT"
          ? {
              priceSpecification: {
                "@type": "UnitPriceSpecification",
                price: property.price,
                priceCurrency: "PHP",
                ...(property.rentPeriod && { unitText: property.rentPeriod.toUpperCase() }),
              },
            }
          : { price: property.price }),
      };

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "RealEstateListing",
        "@id": `${url}#listing`,
        url,
        name: property.title,
        description: property.description.slice(0, 500),
        datePosted: property.createdAt,
        dateModified: property.updatedAt,
        ...(property.images.length > 0 && { image: property.images }),
        about,
        ...(offers && { offers }),
        provider: { "@id": `${SITE_URL}/#agent` },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
          { "@type": "ListItem", position: 2, name: "Properties", item: `${SITE_URL}/properties` },
          { "@type": "ListItem", position: 3, name: property.title, item: url },
        ],
      },
      // Included so the listing's provider @id resolves within this page.
      agentNode(),
    ],
  };
}

// The agent record, referenced by @id from every listing. Placed on the
// About page (the page that's actually about Zee). Only real values are
// emitted: no phone/license fields exist in siteConfig yet, so none are
// invented here — add `telephone` once siteConfig has a real number.
function agentNode() {
  const email = SOCIAL_LINKS.find((l) => l.icon === "mail")?.href.replace("mailto:", "");
  const sameAs = SOCIAL_LINKS.filter((l) => l.href.startsWith("http")).map((l) => l.href);

  return {
    "@type": "RealEstateAgent",
    "@id": `${SITE_URL}/#agent`,
    name: `${AGENT.name} Properties`,
    url: SITE_URL,
    image: `${SITE_URL}/images/hero-portrait.png`,
    description: `${AGENT.name}, ${AGENT.role.toLowerCase()} helping clients buy, sell and invest in property in Cebu, Philippines.`,
    ...(email && { email }),
    areaServed: [
      { "@type": "City", name: "Cebu City" },
      { "@type": "City", name: "Talisay City" },
    ],
    address: { "@type": "PostalAddress", addressRegion: "Cebu", addressCountry: "PH" },
    founder: { "@type": "Person", name: AGENT.name, jobTitle: AGENT.role },
    ...(sameAs.length > 0 && { sameAs }),
  };
}

export function agentJsonLd() {
  return { "@context": "https://schema.org", ...agentNode() };
}
