// Keep these in sync with backend/prisma/schema.prisma.

export type PropertyType =
  | "HOUSE_AND_LOT"
  | "CONDO"
  | "TOWNHOUSE"
  | "COMMERCIAL"
  | "VACANT_LOT";

export type ListingType = "FOR_SALE" | "FOR_RENT";

export type PropertyStatus = "AVAILABLE" | "SOLD" | "RESERVED";

export type Property = {
  id: string;
  title: string;
  type: PropertyType;
  listingType: ListingType;
  status: PropertyStatus;
  price: number;
  rentPeriod: string | null;
  location: string;
  beds: number | null;
  baths: number | null;
  carSpaces: number | null;
  sqm: number;
  description: string;
  images: string[];
  featured: boolean;
  createdAt: string;
  updatedAt: string;
};

export const PROPERTY_TYPES: { value: PropertyType; label: string }[] = [
  { value: "HOUSE_AND_LOT", label: "House & Lot" },
  { value: "CONDO", label: "Condo" },
  { value: "TOWNHOUSE", label: "Townhouse" },
  { value: "COMMERCIAL", label: "Commercial" },
  { value: "VACANT_LOT", label: "Vacant Lot" },
];

export const LISTING_TYPES: { value: ListingType; label: string }[] = [
  { value: "FOR_SALE", label: "For Sale" },
  { value: "FOR_RENT", label: "For Rent" },
];

export const PROPERTY_STATUSES: { value: PropertyStatus; label: string }[] = [
  { value: "AVAILABLE", label: "Available" },
  { value: "SOLD", label: "Sold" },
  { value: "RESERVED", label: "Reserved" },
];

// Mirrors SORT_OPTIONS in backend/src/routes/properties.js — keep in sync.
export const SORT_OPTIONS: { value: string; label: string }[] = [
  { value: "newest", label: "Newest" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
];
