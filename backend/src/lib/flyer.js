// Phase 26. One-page A4 listing flyer, generated on demand with pdfkit.
//
// - Prices are written "PHP 5,000,000" rather than with the peso sign: the
//   built-in PDF fonts don't contain U+20B1, and bundling a font file for
//   one glyph isn't worth it. Swap in a TTF via doc.registerFont() if you
//   want the symbol back.
// - Photos come from Cloudinary only (SSRF guard — the admin controls the
//   URLs, but the server shouldn't fetch arbitrary hosts on request) and are
//   re-encoded to JPEG by Cloudinary's f_jpg transform because pdfkit
//   can't embed WebP/AVIF.
// - A photo that fails to download is skipped, never fatal: a flyer with
//   fewer pictures beats a 500.

const PDFDocument = require("pdfkit");
const { formatRefNo, getSiteUrl } = require("./emailUtils");

const NAVY = "#0B1F3A";
const GOLD = "#D4AF37";
const GREY = "#6b7280";
const PAGE_W = 595.28;
const MARGIN = 40;
const CONTENT_W = PAGE_W - MARGIN * 2;

const TYPE_LABEL = {
  HOUSE_AND_LOT: "House & Lot", CONDO: "Condo", TOWNHOUSE: "Townhouse",
  COMMERCIAL: "Commercial", VACANT_LOT: "Vacant Lot",
};

function toJpegUrl(url) {
  try {
    const u = new URL(url);
    if (u.protocol !== "https:" || u.hostname !== "res.cloudinary.com") return null;
    return url.includes("/upload/")
      ? url.replace("/upload/", "/upload/f_jpg,w_1400,q_auto/")
      : url;
  } catch {
    return null;
  }
}

async function fetchImage(url) {
  const safe = toJpegUrl(url);
  if (!safe) return null;
  try {
    const res = await fetch(safe, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    return buf.length > 0 && buf.length < 8 * 1024 * 1024 ? buf : null;
  } catch {
    return null;
  }
}

function priceText(p) {
  if (p.price === 0) return "Price upon request";
  const base = `PHP ${p.price.toLocaleString("en-US")}`;
  return p.listingType === "FOR_RENT" && p.rentPeriod ? `${base} / ${p.rentPeriod}` : base;
}

function flyerFileName(p) {
  const slug = p.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "listing";
  return `${formatRefNo(p.refNo)}-${slug}.pdf`;
}

async function buildFlyerPdf(property) {
  const photos = (
    await Promise.all((property.images || []).slice(0, 3).map(fetchImage))
  ).filter(Boolean);

  const doc = new PDFDocument({ size: "A4", margin: 0, info: {
    Title: `${property.title} (${formatRefNo(property.refNo)})`,
    Author: "Zee Zafra Properties",
  } });
  const chunks = [];
  doc.on("data", (c) => chunks.push(c));
  const done = new Promise((resolve, reject) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
  });

  // Header band
  doc.rect(0, 0, PAGE_W, 70).fill(NAVY);
  doc.fillColor(GOLD).font("Helvetica-Bold").fontSize(20).text("Zee Zafra", MARGIN, 24, { continued: true });
  doc.fillColor("#FFFFFF").text(" Properties");
  const badge = property.listingType === "FOR_RENT" ? "FOR RENT" : "FOR SALE";
  doc.roundedRect(PAGE_W - MARGIN - 90, 22, 90, 26, 13).fill(GOLD);
  doc.fillColor(NAVY).font("Helvetica-Bold").fontSize(11).text(badge, PAGE_W - MARGIN - 90, 29, { width: 90, align: "center" });

  let y = 90;

  // Hero photo + two smaller
  if (photos[0]) {
    doc.save();
    doc.roundedRect(MARGIN, y, CONTENT_W, 250, 8).clip();
    doc.image(photos[0], MARGIN, y, { cover: [CONTENT_W, 250], align: "center", valign: "center" });
    doc.restore();
    y += 262;
    if (photos.length > 1) {
      const w = (CONTENT_W - 10) / 2;
      photos.slice(1, 3).forEach((buf, i) => {
        const x = MARGIN + i * (w + 10);
        doc.save();
        doc.roundedRect(x, y, w, 120, 8).clip();
        doc.image(buf, x, y, { cover: [w, 120], align: "center", valign: "center" });
        doc.restore();
      });
      y += 132;
    }
  } else {
    doc.roundedRect(MARGIN, y, CONTENT_W, 120, 8).fill("#F1EFE9");
    doc.fillColor(GREY).font("Helvetica").fontSize(11).text("Photos available on request", MARGIN, y + 52, { width: CONTENT_W, align: "center" });
    y += 136;
  }

  // Title / location
  doc.fillColor(NAVY).font("Helvetica-Bold").fontSize(20).text(property.title, MARGIN, y, { width: CONTENT_W });
  y = doc.y + 4;
  doc.fillColor(GREY).font("Helvetica").fontSize(11).text(
    `${property.location}   |   ${formatRefNo(property.refNo)}   |   ${TYPE_LABEL[property.type] || property.type}`,
    MARGIN, y, { width: CONTENT_W }
  );
  y = doc.y + 8;

  // Price
  doc.fillColor(NAVY).font("Helvetica-Bold").fontSize(24).text(priceText(property), MARGIN, y, { width: CONTENT_W });
  y = doc.y + 8;
  if (property.originalPrice && property.originalPrice > property.price && property.price > 0) {
    doc.fillColor("#059669").font("Helvetica-Bold").fontSize(10).text(
      `PRICE REDUCED (was PHP ${property.originalPrice.toLocaleString("en-US")})`, MARGIN, y - 4
    );
    y = doc.y + 6;
  }

  // Facts row
  const facts = [
    property.beds != null && ["Bedrooms", property.beds],
    property.baths != null && ["Bathrooms", property.baths],
    property.carSpaces != null && ["Parking", property.carSpaces],
    [property.type === "VACANT_LOT" ? "Lot area" : "Floor area", `${property.sqm} sqm`],
  ].filter(Boolean);
  const boxW = (CONTENT_W - (facts.length - 1) * 8) / facts.length;
  facts.forEach(([label, value], i) => {
    const x = MARGIN + i * (boxW + 8);
    doc.roundedRect(x, y, boxW, 44, 6).fill("#F7F5EF");
    doc.fillColor(NAVY).font("Helvetica-Bold").fontSize(14).text(String(value), x, y + 8, { width: boxW, align: "center" });
    doc.fillColor(GREY).font("Helvetica").fontSize(8).text(label.toUpperCase(), x, y + 28, { width: boxW, align: "center" });
  });
  y += 58;

  // Description — fit what remains above the footer, ellipsis if cut.
  const footerTop = 842 - 70;
  const desc = String(property.description || "").replace(/\s+\n/g, "\n").trim();
  if (desc && y < footerTop - 40) {
    doc.fillColor(NAVY).font("Helvetica").fontSize(10);
    doc.text(desc, MARGIN, y, {
      width: CONTENT_W, height: footerTop - y - 8, ellipsis: true, lineGap: 2,
    });
  }

  // Footer
  const site = getSiteUrl();
  doc.rect(0, footerTop + 8, PAGE_W, 842 - footerTop - 8).fill(NAVY);
  doc.fillColor(GOLD).font("Helvetica-Bold").fontSize(11).text("Interested? Message Zee Zafra", MARGIN, footerTop + 22, { lineBreak: false });
  if (site) {
    const link = `${site.replace(/^https?:\/\//, "")}/properties/${property.id}`;
    doc.fillColor("#FFFFFF").font("Helvetica").fontSize(9).text(link, MARGIN, footerTop + 40, {
      lineBreak: false, link: `${site}/properties/${property.id}`, underline: true,
    });
  }
  doc.fillColor("#9CA3AF").fontSize(7).text(
    "Details are believed accurate but not guaranteed; subject to change without notice.",
    MARGIN, 842 - 16, { lineBreak: false }
  );

  doc.end();
  return done;
}

module.exports = { buildFlyerPdf, flyerFileName, toJpegUrl };
