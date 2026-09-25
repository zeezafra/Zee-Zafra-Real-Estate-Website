// Emails Zee when a real lead lands in the inbox. The Inquiry row is still
// the source of truth (see routes/inquiries.js) — this is a heads-up so a
// lead doesn't sit unseen until the next time he opens /admin/inquiries.
//
// Recipient: INQUIRY_NOTIFY_TO if set, otherwise ADMIN_EMAIL (already set
// on Render for seedAdmin.js), so adding RESEND_API_KEY alone is enough to
// turn this on. Comma-separate to notify more than one address.
//
// Everything user-supplied (name, message, phone, email, property title)
// is HTML-escaped before it goes into the HTML body — a visitor controls
// those strings, and an email client will happily render markup in them.

const prisma = require("./prisma");
const { sendEmail, isEmailEnabled } = require("./email");

function getRecipients() {
  return (process.env.INQUIRY_NOTIFY_TO || process.env.ADMIN_EMAIL || "")
    .split(",")
    .map((address) => address.trim())
    .filter(Boolean);
}

// Where the "Open in admin" button points: the first FRONTEND_ORIGIN entry
// (it's a comma-separated allow-list — see middleware/cors.js). Null when
// unset, in which case the email just omits the button.
function getAdminBaseUrl() {
  const first = (process.env.FRONTEND_ORIGIN || "").split(",")[0].trim();
  return first ? first.replace(/\/+$/, "") : null;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Mirrors formatRefNo() in frontend/lib/format.ts — the backend and
// frontend are separate deployments, so this can't be imported. If the
// "ZZ-0001" format ever changes there, change it here too.
function formatRefNo(refNo) {
  return `ZZ-${String(refNo).padStart(4, "0")}`;
}

// preferredDate is a raw "YYYY-MM-DD". Formatting it via a local-time Date
// would shift it by a day depending on the server's timezone (Render runs
// UTC), so build it as UTC and render it as UTC — same off-by-one-day trap
// the schema comment on Inquiry.preferredDate describes.
function formatDate(isoDate) {
  const [y, m, d] = isoDate.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

// "14:30" -> "2:30 PM"
function formatTime(hhmm) {
  const [h, min] = hhmm.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  return `${h % 12 || 12}:${String(min).padStart(2, "0")} ${suffix}`;
}

function describeViewing({ preferredDate, preferredTime }) {
  const parts = [];
  if (preferredDate) parts.push(formatDate(preferredDate));
  if (preferredTime) parts.push(formatTime(preferredTime));
  return parts.length ? parts.join(" at ") : null;
}

function inquiryLabel(inquiry) {
  // A viewing request is still type BUYER, distinguished only by the
  // preferred date/time being set (Phase 14) — so check that first.
  if (inquiry.preferredDate || inquiry.preferredTime) return "Viewing request";
  return inquiry.type === "SELLER" ? "Seller inquiry" : "Buyer inquiry";
}

// The visitor's email becomes the Reply-To so Zee can answer straight from
// his mail app. The route's validator is deliberately loose (it only
// rejects whitespace and a missing @), but Resend rejects a malformed
// Reply-To with a 422 — which would drop the *whole* notification. Only
// use the address when it's strictly well-formed; otherwise send without.
const STRICT_EMAIL_RE = /^[A-Za-z0-9._%+'-]+@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}$/;

function row(label, valueHtml) {
  return (
    `<tr>` +
    `<td style="padding:6px 16px 6px 0;color:#6b7280;vertical-align:top;white-space:nowrap;">${label}</td>` +
    `<td style="padding:6px 0;color:#0B1F3A;vertical-align:top;">${valueHtml}</td>` +
    `</tr>`
  );
}

function buildMessage(inquiry, property, adminBaseUrl) {
  const label = inquiryLabel(inquiry);
  const viewing = describeViewing(inquiry);
  const propertyLine = property
    ? `${formatRefNo(property.refNo)} — ${property.title}`
    : null;
  const adminUrl = adminBaseUrl ? `${adminBaseUrl}/admin/inquiries/${inquiry.id}` : null;

  // Subject is a header: strip anything that could break it across lines
  // (name can contain internal newlines — the route only trims the ends)
  // and cap the length.
  const safeName = inquiry.name.replace(/[\r\n\t]+/g, " ").trim().slice(0, 80);
  const subject =
    `New ${label.toLowerCase()} from ${safeName}` +
    (property ? ` — ${formatRefNo(property.refNo)}` : "");

  // ---- plain text (also what mail clients that block HTML show) ----
  const textLines = [
    `${label} received on Zee Zafra Properties`,
    "",
    `Name: ${inquiry.name}`,
  ];
  if (inquiry.email) textLines.push(`Email: ${inquiry.email}`);
  if (inquiry.phone) textLines.push(`Phone: ${inquiry.phone}`);
  if (propertyLine) textLines.push(`Property: ${propertyLine}`);
  if (viewing) textLines.push(`Preferred viewing: ${viewing}`);
  textLines.push("", "Message:", inquiry.message);
  if (adminUrl) textLines.push("", `Open in admin: ${adminUrl}`);
  const text = textLines.join("\n");

  // ---- HTML ----
  const rows = [row("Name", escapeHtml(inquiry.name))];
  if (inquiry.email) {
    const e = escapeHtml(inquiry.email);
    rows.push(row("Email", `<a href="mailto:${e}" style="color:#0B1F3A;">${e}</a>`));
  }
  if (inquiry.phone) {
    const p = escapeHtml(inquiry.phone);
    const dialable = escapeHtml(inquiry.phone.replace(/[^\d+]/g, ""));
    rows.push(row("Phone", `<a href="tel:${dialable}" style="color:#0B1F3A;">${p}</a>`));
  }
  if (propertyLine) rows.push(row("Property", escapeHtml(propertyLine)));
  if (viewing) rows.push(row("Preferred viewing", escapeHtml(viewing)));

  const button = adminUrl
    ? `<p style="margin:24px 0 0;"><a href="${escapeHtml(adminUrl)}" ` +
      `style="display:inline-block;background:#D4AF37;color:#0B1F3A;font-weight:600;` +
      `text-decoration:none;padding:10px 20px;border-radius:999px;">Open in admin</a></p>`
    : "";

  const html =
    `<div style="font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;` +
    `background:#FAF9F6;padding:24px;">` +
    `<div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:12px;` +
    `border-top:4px solid #D4AF37;padding:24px;">` +
    `<p style="margin:0 0 4px;color:#D4AF37;font-size:12px;font-weight:700;` +
    `letter-spacing:.08em;text-transform:uppercase;">${escapeHtml(label)}</p>` +
    `<h1 style="margin:0 0 16px;font-size:20px;color:#0B1F3A;">` +
    `${escapeHtml(inquiry.name)} sent an inquiry</h1>` +
    `<table style="border-collapse:collapse;font-size:14px;">${rows.join("")}</table>` +
    `<p style="margin:20px 0 6px;color:#6b7280;font-size:13px;">Message</p>` +
    `<div style="white-space:pre-wrap;font-size:14px;line-height:1.55;color:#0B1F3A;` +
    `background:#FAF9F6;border-radius:8px;padding:12px 14px;">${escapeHtml(inquiry.message)}</div>` +
    button +
    `</div></div>`;

  const replyTo =
    inquiry.email && STRICT_EMAIL_RE.test(inquiry.email) ? inquiry.email : undefined;

  return { subject, text, html, replyTo };
}

/**
 * Fire-and-forget: call it without `await` from the route, after the
 * inquiry is saved. Never throws, never rejects — every failure is logged
 * and swallowed, because the lead is already safely in the database.
 *
 * @param {object} inquiry The Inquiry row as returned by prisma.inquiry.create.
 */
async function notifyNewInquiry(inquiry) {
  try {
    // Checked first so an unconfigured deploy doesn't spend a DB query per
    // inquiry building an email nobody will send.
    if (!isEmailEnabled()) return;

    const recipients = getRecipients();
    if (recipients.length === 0) {
      console.warn(
        "[email] No recipient — set INQUIRY_NOTIFY_TO (or ADMIN_EMAIL). Skipping inquiry notification."
      );
      return;
    }

    // Best-effort: an email without the property line is still worth
    // sending, so a failed lookup degrades to that instead of aborting.
    let property = null;
    if (inquiry.propertyId) {
      try {
        property = await prisma.property.findUnique({
          where: { id: inquiry.propertyId },
          select: { title: true, refNo: true },
        });
      } catch (err) {
        console.error("[email] Property lookup failed, sending without it:", err.message);
      }
    }

    const message = buildMessage(inquiry, property, getAdminBaseUrl());
    const result = await sendEmail({ to: recipients, ...message });

    if (!result.ok) {
      console.error(`[email] Inquiry notification failed for ${inquiry.id}: ${result.error}`);
    }
  } catch (err) {
    console.error(`[email] Unexpected error notifying for inquiry ${inquiry && inquiry.id}:`, err);
  }
}

module.exports = { notifyNewInquiry };
