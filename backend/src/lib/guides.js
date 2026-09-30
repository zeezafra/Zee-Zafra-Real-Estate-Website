// Trust & polish. The downloadable guides offered as an email-gated lead
// magnet. Only the slugs live here — the PDFs themselves are static files in
// frontend/public/guides/ and the frontend's lib/guides.ts holds the titles
// and file paths. Keep the two slug lists in step: the API refuses any slug
// that isn't listed here, which is what stops the endpoint being used to
// stuff arbitrary strings into the GuideLead table.
const GUIDES = {
  "buying-property-in-cebu": "Buying Property in Cebu — Checklist",
  "selling-property-in-cebu": "Selling Your Property in Cebu — Checklist",
};

module.exports = { GUIDES, isValidGuide: (slug) => Object.prototype.hasOwnProperty.call(GUIDES, slug) };
