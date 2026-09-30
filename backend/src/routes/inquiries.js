const express = require("express");
const prisma = require("../lib/prisma");
const inquiryRateLimit = require("../middleware/inquiryRateLimit");
const { verifyTurnstile } = require("../lib/turnstile");
const { detectSpam } = require("../lib/spamFilter");
const { notifyNewInquiry } = require("../lib/inquiryNotification");
const { sendAutoReply } = require("../lib/autoReply");

const router = express.Router();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Phase 20. Digits, spaces, and the punctuation real phone numbers are
// written with — deliberately permissive about *format* (Philippine
// numbers get written as 0917 123 4567, +63 917 123 4567, (02) 8888 8888)
// while rejecting letters and the 40 characters of garbage that used to
// get through, since the old check only capped length.
const PHONE_RE = /^[+()\-.\s\d]+$/;
// At least one letter somewhere — stops "....", "12345", and emoji-only
// submissions landing in the inbox as a lead with no usable name.
const HAS_LETTER_RE = /\p{L}/u;
const INQUIRY_TYPES = ["BUYER", "SELLER"];
// Phase 20. Mirrors the InquirySource enum in prisma/schema.prisma — keep
// the two in sync (same contract as INQUIRY_STATUSES in adminInquiries.js).
const INQUIRY_SOURCES = [
  "NAV_CTA",
  "PROPERTY_PAGE",
  "CTA_BANNER",
  "VIEWING_FORM",
  "SELL_PAGE",
  "DIRECT",
];
// Phase 14. Match the raw output of <input type="date">/<input
// type="time"> exactly — the frontend never reformats these before
// sending, so a stricter/looser regex would just be a second source of
// truth to keep in sync for no benefit.
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^\d{2}:\d{2}$/;

// Phase 20. How far back the duplicate check looks — matches the
// roadmap's suggested window.
const DUPLICATE_WINDOW_MS = 24 * 60 * 60 * 1000;

// The frontend's <input type="date"> sets a `min` of the visitor's local
// today, but that's a client-side hint only — nothing stopped a direct
// API call (or devtools tampering) from submitting a past date until now.
// Computed in Asia/Manila rather than the server's own timezone (Render
// runs UTC) since that's where the site's actual visitors and viewings
// are, and string comparison works directly because YYYY-MM-DD sorts
// the same lexicographically as chronologically.
function todayManilaISODate() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Manila" }).format(new Date());
}

// Same shape as validatePropertyPayload in adminProperties.js: sanitize
// into `data`, collect human-readable messages into `errors`. No `partial`
// mode here since this route only ever does a full create, never a patch.
function validateInquiryPayload(body) {
  const errors = [];
  const data = {};

  // Phase 13. Omitted entirely for the pre-existing callers (nav "Inquire
  // Now", CTA banner, property detail page) — the schema default of BUYER
  // covers them without any change on the frontend side. Only
  // SellerLeadForm sends this explicitly.
  const type =
    typeof body.type === "string" && body.type.trim()
      ? body.type.trim().toUpperCase()
      : "BUYER";
  if (!INQUIRY_TYPES.includes(type)) {
    errors.push("type must be BUYER or SELLER");
  } else {
    data.type = type;
  }

  // Phase 20. Same opt-in shape as `type`: an unrecognized or missing
  // value falls back to DIRECT rather than erroring, since a bad source
  // string is an analytics gap, not a reason to reject a real lead.
  const source =
    typeof body.source === "string" && body.source.trim()
      ? body.source.trim().toUpperCase()
      : "DIRECT";
  data.source = INQUIRY_SOURCES.includes(source) ? source : "DIRECT";

  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!name) {
    errors.push("name is required");
  } else if (name.length < 2) {
    errors.push("name must be at least 2 characters");
  } else if (name.length > 120) {
    errors.push("name must be 120 characters or fewer");
  } else if (!HAS_LETTER_RE.test(name)) {
    errors.push("name must contain letters");
  } else {
    data.name = name;
  }

  // Phase 20: lowercased so duplicate detection and the admin search treat
  // Zee@Example.com and zee@example.com as the same person.
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const phone = typeof body.phone === "string" ? body.phone.trim() : "";

  if (!email && !phone) {
    errors.push("email or phone is required");
  }

  if (email) {
    if (!EMAIL_RE.test(email) || email.length > 200) {
      errors.push("email must be a valid address");
    } else {
      data.email = email;
    }
  }

  if (phone) {
    // Count digits separately from total length: "+63 (917) 123-4567" is
    // 18 characters but 12 digits, and it's the digit count that decides
    // whether this is a dialable number.
    const digits = phone.replace(/\D/g, "");
    if (!PHONE_RE.test(phone)) {
      errors.push("phone must contain only digits and phone punctuation");
    } else if (digits.length < 7 || digits.length > 15) {
      // 15 is the E.164 maximum; 7 is the shortest plausible local number.
      errors.push("phone must be a valid phone number");
    } else if (phone.length > 40) {
      errors.push("phone must be 40 characters or fewer");
    } else {
      data.phone = phone;
    }
  }

  const message = typeof body.message === "string" ? body.message.trim() : "";
  if (!message) {
    errors.push("message is required");
  } else if (message.length < 5) {
    errors.push("message must be at least 5 characters");
  } else if (message.length > 2000) {
    errors.push("message must be 2000 characters or fewer");
  } else {
    data.message = message;
  }

  // Optional — present when the inquiry came from a property detail page
  // rather than the nav button or CTA banner.
  if (
    body.propertyId !== undefined &&
    body.propertyId !== null &&
    body.propertyId !== ""
  ) {
    if (typeof body.propertyId !== "string") {
      errors.push("propertyId must be a string");
    } else {
      data.propertyId = body.propertyId;
    }
  }

  // Phase 14. Only ViewingModal (property detail page) sends these — the
  // nav "Inquire Now", CTA banner, and /sell all omit them entirely, same
  // opt-in shape as Phase 13's `type`. Format-checked rather than parsed
  // into a real Date: see the schema comment for why these stay plain
  // strings.
  const preferredDate =
    typeof body.preferredDate === "string" ? body.preferredDate.trim() : "";
  const preferredTime =
    typeof body.preferredTime === "string" ? body.preferredTime.trim() : "";

  if (preferredDate) {
    if (!DATE_RE.test(preferredDate)) {
      errors.push("preferredDate must be in YYYY-MM-DD format");
    } else if (preferredDate < todayManilaISODate()) {
      errors.push("preferredDate cannot be in the past");
    } else {
      data.preferredDate = preferredDate;
    }
  }

  if (preferredTime) {
    if (!TIME_RE.test(preferredTime)) {
      errors.push("preferredTime must be in HH:MM format");
    } else {
      data.preferredTime = preferredTime;
    }
  }

  // A viewing request with no property to view doesn't mean anything —
  // catch it here rather than leave a dangling preferredDate/preferredTime
  // on a general inquiry.
  if ((preferredDate || preferredTime) && !data.propertyId) {
    errors.push("propertyId is required when requesting a viewing");
  }

  return { data, errors };
}

// Phase 20. Finds an inquiry from the same person inside the duplicate
// window. Two separate shapes count as a duplicate, and they're checked
// separately on purpose:
//
//   1. Same contact + same property. Someone asking twice about the same
//      listing is the case the roadmap names, and it counts as a duplicate
//      even when the second message says something new.
//   2. Same contact + byte-identical message. Catches the double-tapped
//      submit button on a general (no-property) inquiry.
//
// What this deliberately does NOT do is treat "same contact, no property,
// different message" as a duplicate — that's a visitor sending a genuine
// second question, and swallowing it would lose real information.
async function findDuplicate(data) {
  const contactOr = [];
  if (data.email) contactOr.push({ email: data.email });
  if (data.phone) contactOr.push({ phone: data.phone });
  if (contactOr.length === 0) return null;

  const since = new Date(Date.now() - DUPLICATE_WINDOW_MS);

  const sameSubmission = data.propertyId
    ? { propertyId: data.propertyId }
    : { message: data.message };

  return prisma.inquiry.findFirst({
    where: {
      spam: false,
      createdAt: { gte: since },
      OR: contactOr,
      ...sameSubmission,
    },
    orderBy: { createdAt: "desc" },
  });
}

// POST /api/inquiries
// Public — no requireAdmin here, this is the one endpoint the site's
// visitors write to. Phase 20 layers four defenses in front of the insert,
// cheapest first so an obvious bot never costs a network round-trip:
//
//   rate limit (middleware) → validation → Turnstile → spam heuristics
//   → duplicate check → insert
//
// Only rate limiting, validation, and Turnstile return an error to the
// caller. Spam is stored-and-hidden and duplicates return the original
// row — in both cases the client sees a normal success, which is the
// point: a bot learns nothing about what tripped the filter, and a human
// who double-submitted isn't told off for it.
router.post("/", inquiryRateLimit, async (req, res) => {
  const body = req.body || {};
  const { data, errors } = validateInquiryPayload(body);
  if (errors.length > 0) {
    return res.status(400).json({ error: errors.join("; ") });
  }

  const verification = await verifyTurnstile(body.turnstileToken, req.ip);
  if (!verification.ok) {
    console.warn(`[inquiries] Turnstile rejected a submission: ${verification.error}`);
    return res.status(400).json({
      error: "We couldn't verify that you're human. Please complete the check and try again.",
    });
  }

  const { spam, reason } = detectSpam({
    name: data.name,
    email: data.email,
    message: data.message,
    honeypot: body.website,
  });

  try {
    if (!spam) {
      const existing = await findDuplicate(data);
      if (existing) {
        // Nothing is lost when the text differs: the new message lands on
        // the original lead's Phase 19 timeline instead of creating a
        // second row Zee would have to reconcile by hand.
        if (existing.message !== data.message) {
          await prisma.inquiryNote.create({
            data: {
              inquiryId: existing.id,
              type: "SYSTEM",
              content: `Follow-up message from the same visitor (duplicate submission within 24h):\n\n${data.message}`,
            },
          });
        }

        return res.status(200).json({
          id: existing.id,
          createdAt: existing.createdAt,
          duplicate: true,
        });
      }
    }

    const inquiry = await prisma.inquiry.create({ data: { ...data, spam } });

    if (spam) {
      // Logged, not surfaced — Zee reviews it in the inbox's Spam view.
      console.warn(`[inquiries] flagged as spam (${reason}): ${inquiry.id}`);
    } else {
      // Heads-up email to Zee (Resend). Deliberately NOT awaited: the
      // visitor's response shouldn't wait on a third-party API, and
      // notifyNewInquiry never throws, so a failed send can't turn this
      // saved lead into a 500. Spam is skipped so the bots the filter
      // caught don't also fill Zee's mailbox, and a detected duplicate
      // returned earlier without reaching this line — Zee was already
      // told about that lead.
      notifyNewInquiry(inquiry);
      // Phase 26: thank-you email to the visitor. Same fire-and-forget rules.
      sendAutoReply(inquiry);
    }

    res.status(201).json({ id: inquiry.id, createdAt: inquiry.createdAt });
  } catch (err) {
    if (err.code === "P2003") {
      // Foreign key violation — propertyId didn't match a real property.
      return res.status(400).json({ error: "That property could not be found" });
    }
    console.error(err);
    res.status(500).json({ error: "Failed to submit inquiry" });
  }
});

module.exports = router;
