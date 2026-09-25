const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

// Placeholder photo until Phase 4 wires up real Cloudinary uploads.
const placeholderImage =
  "https://res.cloudinary.com/demo/image/upload/w_800,h_600,c_fill/sample.jpg";

// 8 listings — clearly placeholder data, not real inventory. Spans all
// five PropertyType values and both ListingType values, with a mix of
// featured true/false so the Phase 6 homepage grid has something to show.
// Two listings set `originalPrice` (Phase 12) so the "Price Reduced" badge
// has something to show immediately after reseeding. `refNo` isn't set
// here — it's a SERIAL column that assigns itself on insert.
const listings = [
  {
    title: "Modern House and Lot in Talisay",
    type: "HOUSE_AND_LOT",
    listingType: "FOR_SALE",
    price: 8500000,
    // Phase 12 demo data — shows the "Price Reduced" badge on this listing
    // out of the box after reseeding, without needing an admin edit first.
    originalPrice: 9200000,
    location: "Talisay City, Negros Occidental",
    beds: 4,
    baths: 3,
    carSpaces: 2,
    sqm: 180,
    description:
      "A bright, contemporary two-storey home with an open living area, landscaped garden, and a two-car garage inside a gated subdivision.",
    images: [placeholderImage],
    featured: true,
  },
  {
    title: "2BR Condo Unit near Ayala Malls",
    type: "CONDO",
    listingType: "FOR_SALE",
    price: 6200000,
    location: "Bacolod City, Negros Occidental",
    beds: 2,
    baths: 2,
    carSpaces: 1,
    sqm: 65,
    description:
      "A move-in-ready two-bedroom unit on a high floor with city views, walking distance to malls, restaurants, and offices.",
    images: [placeholderImage],
    featured: true,
  },
  {
    title: "Preselling Townhouse in Mandalagan",
    type: "TOWNHOUSE",
    listingType: "FOR_SALE",
    price: 5800000,
    location: "Mandalagan, Bacolod City",
    beds: 3,
    baths: 2,
    carSpaces: 1,
    sqm: 95,
    description:
      "A preselling three-bedroom townhouse in a quiet, up-and-coming enclave, with flexible payment terms during the construction period.",
    images: [placeholderImage],
    featured: false,
  },
  {
    title: "Commercial Space along Lacson St",
    type: "COMMERCIAL",
    listingType: "FOR_RENT",
    rentPeriod: "month",
    price: 85000,
    location: "Lacson Street, Bacolod City",
    sqm: 120,
    description:
      "Ground-floor commercial space on a high-traffic street, ideal for a restaurant, clinic, or retail storefront.",
    images: [placeholderImage],
    featured: false,
  },
  {
    title: "Residential Lot in Vista Alegre",
    type: "VACANT_LOT",
    listingType: "FOR_SALE",
    price: 3000000,
    location: "Vista Alegre, Bacolod City",
    sqm: 300,
    description:
      "A flat, titled residential lot in a developing area, ready for construction with easy access to the main road.",
    images: [placeholderImage],
    featured: false,
  },
  {
    title: "Cozy Studio Condo for Rent",
    type: "CONDO",
    listingType: "FOR_RENT",
    rentPeriod: "month",
    price: 18000,
    originalPrice: 21000,
    location: "Bacolod City, Negros Occidental",
    beds: 1,
    baths: 1,
    carSpaces: 0,
    sqm: 28,
    description:
      "A compact, fully furnished studio unit perfect for young professionals, with building amenities and 24-hour security.",
    images: [placeholderImage],
    featured: true,
  },
  {
    title: "Family House and Lot for Rent in Bata",
    type: "HOUSE_AND_LOT",
    listingType: "FOR_RENT",
    rentPeriod: "month",
    price: 35000,
    location: "Bata, Bacolod City",
    beds: 3,
    baths: 2,
    carSpaces: 1,
    sqm: 150,
    description:
      "A single-detached family home in a quiet residential street, close to schools and the coastal road.",
    images: [placeholderImage],
    featured: false,
  },
  {
    title: "Corner Commercial Lot for Sale",
    type: "COMMERCIAL",
    listingType: "FOR_SALE",
    price: 12000000,
    location: "Bacolod-Talisay Highway",
    sqm: 250,
    description:
      "A corner commercial lot along a busy highway, suitable for a gas station, warehouse, or retail development.",
    images: [placeholderImage],
    featured: false,
  },
];

async function main() {
  console.log(`Seeding ${listings.length} properties...`);

  for (const listing of listings) {
    await prisma.property.create({ data: listing });
  }

  console.log("Seed complete.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
