// Phase 26. New-listing email alerts for confirmed SavedSearch rows.
//
// Trigger: adminProperties.js calls notifyMatchingSubscribers(property)
// after a create or update. The `alertsSentAt` stamp is claimed with a
// conditional updateMany, so concurrent saves or later edits can't send
// the same listing twice, and a listing created as RESERVED alerts only
// once it first becomes AVAILABLE.

const prisma = require("./prisma");
const { sendEmail, isEmailEnabled } = require("./email");
const {
  escapeHtml,
  formatRefNo,
  formatPeso,
  getSiteUrl,
  wrapEmail,
  button,
  headerSafe,
} = require("./emailUtils");

const MAX_RECIPIENTS_PER_LISTING = 200;

// Pure. `null` criteria mean "any". A Price Upon Request listing (price 0)
// only matches searches with no price bounds — 0 would otherwise satisfy
// every "max price" filter.
function matchesSearch(search, property) {
  if (search.listingType && search.listingType !== property.listingType) return false;
  if (search.type && search.type !== property.type) return false;
  if (search.location && !property.location.toLowerCase().includes(search.location.toLowerCase())) {
    return false;
  }
  if (search.minPrice != null || search.maxPrice != null) {
    if (property.price === 0) return false;
    if (search.minPrice != null && property.price < search.minPrice) return false;
    if (search.maxPrice != null && property.price > search.maxPrice) return false;
  }
  if (search.minBeds != null && (property.beds == null || property.beds < search.minBeds)) {
    return false;
  }
  return true;
}

function describeSearch(search) {
  const parts = [];
  if (search.listingType) parts.push(search.listingType === "FOR_RENT" ? "for rent" : "for sale");
  if (search.type) parts.push(search.type.replace(/_/g, " ").toLowerCase());
  if (search.location) parts.push(`in ${search.location}`);
  if (search.minBeds != null) parts.push(`${search.minBeds}+ beds`);
  if (search.minPrice != null && search.maxPrice != null) {
    parts.push(`${formatPeso(search.minPrice)}–${formatPeso(search.maxPrice)}`);
  } else if (search.minPrice != null) parts.push(`from ${formatPeso(search.minPrice)}`);
  else if (search.maxPrice != null) parts.push(`up to ${formatPeso(search.maxPrice)}`);
  return parts.length ? parts.join(", ") : "all new listings";
}

function buildAlertEmail(search, property, siteUrl) {
  const url = `${siteUrl}/properties/${property.id}`;
  const unsubscribeUrl = `${siteUrl}/unsubscribe?token=${encodeURIComponent(search.token)}`;
  const priceLine =
    property.price === 0
      ? "Price upon request"
      : `${formatPeso(property.price)}${
          property.listingType === "FOR_RENT" && property.rentPeriod ? ` / ${property.rentPeriod}` : ""
        }`;
  const facts = [
    property.beds != null && `${property.beds} bed`,
    property.baths != null && `${property.baths} bath`,
    property.carSpaces != null && `${property.carSpaces} parking`,
    `${property.sqm} sqm`,
  ].filter(Boolean);

  const subject = headerSafe(`New listing: ${property.title} — ${property.location}`, 120);

  const text = [
    `A new listing matches your alert (${describeSearch(search)}):`,
    "",
    `${property.title} (${formatRefNo(property.refNo)})`,
    property.location,
    priceLine,
    facts.join(" · "),
    "",
    `View it: ${url}`,
    "",
    `Stop these alerts: ${unsubscribeUrl}`,
  ].join("\n");

  const photo = property.images && property.images[0];
  const html = wrapEmail({
    eyebrow: "New listing alert",
    heading: property.title,
    bodyHtml:
      (photo && /^https:\/\//.test(photo)
        ? `<img src="${escapeHtml(photo)}" alt="" width="512" style="width:100%;max-width:512px;border-radius:8px;margin:0 0 14px;display:block;">`
        : "") +
      `<p style="margin:0 0 4px;font-size:13px;color:#6b7280;">${escapeHtml(property.location)} · ${escapeHtml(formatRefNo(property.refNo))}</p>` +
      `<p style="margin:0 0 8px;font-size:22px;font-weight:700;color:#0B1F3A;">${escapeHtml(priceLine)}</p>` +
      `<p style="margin:0;font-size:14px;color:#0B1F3A;">${escapeHtml(facts.join("  ·  "))}</p>` +
      button(url, "View property"),
    footerHtml:
      `You asked for alerts for: ${escapeHtml(describeSearch(search))}.<br>` +
      `<a href="${escapeHtml(unsubscribeUrl)}" style="color:#9ca3af;">Unsubscribe</a>`,
  });

  return { subject, text, html, unsubscribeUrl };
}

/**
 * Fire-and-forget, never throws.
 * @param {object} property full Property row (as returned by prisma create/update)
 */
async function notifyMatchingSubscribers(property) {
  try {
    if (!isEmailEnabled()) return;
    if (property.status !== "AVAILABLE" || property.alertsSentAt) return;
    const siteUrl = getSiteUrl();
    if (!siteUrl) {
      console.warn("[alerts] FRONTEND_ORIGIN not set — cannot build listing links, skipping alerts.");
      return;
    }

    // Claim the send. count === 0 means another request already did.
    const claim = await prisma.property.updateMany({
      where: { id: property.id, alertsSentAt: null },
      data: { alertsSentAt: new Date() },
    });
    if (claim.count === 0) return;

    const searches = await prisma.savedSearch.findMany({ where: { confirmedAt: { not: null } } });

    // One email per address per listing even if they saved overlapping searches.
    const seen = new Set();
    const matches = [];
    for (const search of searches) {
      const key = search.email.toLowerCase();
      if (seen.has(key) || !matchesSearch(search, property)) continue;
      seen.add(key);
      matches.push(search);
      if (matches.length >= MAX_RECIPIENTS_PER_LISTING) break;
    }

    for (const search of matches) {
      const { unsubscribeUrl, ...message } = buildAlertEmail(search, property, siteUrl);
      const result = await sendEmail({
        to: search.email,
        ...message,
        headers: { "List-Unsubscribe": `<${unsubscribeUrl}>` },
      });
      if (result.ok) {
        await prisma.savedSearch
          .update({ where: { id: search.id }, data: { lastNotifiedAt: new Date() } })
          .catch(() => {});
      } else {
        console.error(`[alerts] Send failed for saved search ${search.id}: ${result.error}`);
      }
      // Gentle pacing so a burst doesn't trip Resend's per-second limit.
      await new Promise((r) => setTimeout(r, 250));
    }
  } catch (err) {
    console.error(`[alerts] Unexpected error for property ${property && property.id}:`, err);
  }
}

module.exports = { notifyMatchingSubscribers, matchesSearch, describeSearch, buildAlertEmail };
