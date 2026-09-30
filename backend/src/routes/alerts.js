const crypto = require("crypto");
const express = require("express");
const prisma = require("../lib/prisma");
const { sendEmail, isEmailEnabled } = require("../lib/email");
const { STRICT_EMAIL_RE, escapeHtml, getSiteUrl, wrapEmail, button } = require("../lib/emailUtils");
const { describeSearch } = require("../lib/listingAlerts");
const { verifyTurnstile } = require("../lib/turnstile");
const { signupLimits, tokenActionLimit } = require("../middleware/alertRateLimit");

const router = express.Router();

const PROPERTY_TYPES = ["HOUSE_AND_LOT", "CONDO", "TOWNHOUSE", "COMMERCIAL", "VACANT_LOT"];
const LISTING_TYPES = ["FOR_SALE", "FOR_RENT"];
const MAX_SEARCHES_PER_EMAIL = 5;

const optInt = (v) => {
  if (v === undefined || v === null || v === "") return null;
  const n = Number.parseInt(v, 10);
  return Number.isFinite(n) && n >= 0 ? n : NaN;
};

// POST /api/alerts — public sign-up (double opt-in).
// Always answers with the same generic success once the payload is valid,
// whether the address is new, already subscribed, or over the per-address
// cap — so the endpoint can't be used to probe who is subscribed.
router.post("/", signupLimits, async (req, res) => {
  const body = req.body || {};

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!STRICT_EMAIL_RE.test(email) || email.length > 200) {
    return res.status(400).json({ error: "Please enter a valid email address." });
  }

  const errors = [];
  const type = body.type ? String(body.type) : null;
  const listingType = body.listingType ? String(body.listingType) : null;
  if (type && !PROPERTY_TYPES.includes(type)) errors.push("Unknown property type");
  if (listingType && !LISTING_TYPES.includes(listingType)) errors.push("Unknown listing type");
  const minPrice = optInt(body.minPrice);
  const maxPrice = optInt(body.maxPrice);
  const minBeds = optInt(body.minBeds);
  if ([minPrice, maxPrice, minBeds].some(Number.isNaN)) errors.push("Price and bedroom values must be numbers");
  if (minPrice != null && maxPrice != null && minPrice > maxPrice) errors.push("Minimum price is above maximum price");
  if (errors.length) return res.status(400).json({ error: errors.join("; ") });

  const location = typeof body.location === "string" && body.location.trim() ? body.location.trim().slice(0, 100) : null;
  const name = typeof body.name === "string" && body.name.trim() ? body.name.trim().slice(0, 80) : null;

  const verification = await verifyTurnstile(body.turnstileToken, req.ip);
  if (!verification.ok) {
    return res.status(400).json({
      error: "We couldn't verify that you're human. Please complete the check and try again.",
    });
  }

  // Honeypot: pretend success, store nothing.
  const generic = { ok: true, message: "Almost done — check your inbox to confirm your alert." };
  if (body.website) return res.status(200).json(generic);

  try {
    const existing = await prisma.savedSearch.findMany({ where: { email } });
    const duplicate = existing.find(
      (s) =>
        s.location === location &&
        s.type === type &&
        s.listingType === listingType &&
        s.minPrice === minPrice &&
        s.maxPrice === maxPrice &&
        s.minBeds === minBeds
    );
    if (duplicate || existing.length >= MAX_SEARCHES_PER_EMAIL) {
      return res.status(200).json(generic);
    }

    const emailOn = isEmailEnabled();
    const search = await prisma.savedSearch.create({
      data: {
        email, name, location, type, listingType, minPrice, maxPrice, minBeds,
        token: crypto.randomBytes(24).toString("hex"),
        // With email disabled (local dev / no Resend key) nobody could ever
        // click a confirm link, so confirm immediately instead of stranding the row.
        confirmedAt: emailOn ? null : new Date(),
      },
    });

    const siteUrl = getSiteUrl();
    if (emailOn && siteUrl) {
      const confirmUrl = `${siteUrl}/alerts/confirm?token=${search.token}`;
      const what = describeSearch(search);
      sendEmail({
        to: email,
        subject: "Confirm your Zee Zafra Properties alert",
        text: `Please confirm your email alert for: ${what}\n\nConfirm: ${confirmUrl}\n\nIf you didn't ask for this, ignore this email and nothing will be sent.`,
        html: wrapEmail({
          eyebrow: "One more step",
          heading: "Confirm your listing alert",
          bodyHtml:
            `<p style="margin:0 0 12px;font-size:14px;line-height:1.6;color:#0B1F3A;">You asked to be emailed when a new listing matches: <strong>${escapeHtml(what)}</strong>.</p>` +
            button(confirmUrl, "Confirm my alert") +
            `<p style="margin:20px 0 0;font-size:12px;color:#6b7280;">Didn't ask for this? Ignore this email and nothing will be sent.</p>`,
        }),
      }).then((r) => {
        if (!r.ok) console.error(`[alerts] Confirmation email failed for ${search.id}: ${r.error}`);
      });
    }

    return res.status(200).json(generic);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to save your alert" });
  }
});

// POST /api/alerts/confirm  { token }
router.post("/confirm", tokenActionLimit, async (req, res) => {
  const token = req.body && typeof req.body.token === "string" ? req.body.token : "";
  if (!token || token.length > 100) return res.status(400).json({ error: "Invalid link" });
  try {
    const result = await prisma.savedSearch.updateMany({
      where: { token, confirmedAt: null },
      data: { confirmedAt: new Date() },
    });
    if (result.count === 0) {
      // Either already confirmed (fine) or unknown/removed.
      const exists = await prisma.savedSearch.findUnique({ where: { token } });
      if (!exists) return res.status(404).json({ error: "This link is no longer valid." });
    }
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong" });
  }
});

// POST /api/alerts/unsubscribe  { token } — deletes the saved search.
// POST rather than GET so mail-scanner link prefetching can't unsubscribe
// people; the frontend page asks for a click first.
router.post("/unsubscribe", tokenActionLimit, async (req, res) => {
  const token = req.body && typeof req.body.token === "string" ? req.body.token : "";
  if (!token || token.length > 100) return res.status(400).json({ error: "Invalid link" });
  try {
    await prisma.savedSearch.deleteMany({ where: { token } });
    res.json({ ok: true }); // idempotent: already-gone still reads as success
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong" });
  }
});

module.exports = router;
