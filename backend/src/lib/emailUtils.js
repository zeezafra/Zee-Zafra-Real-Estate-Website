// Phase 26. Small helpers shared by the auto-reply, listing-alert and
// digest emails. (inquiryNotification.js keeps its own private copies from
// before this file existed — left alone on purpose, not refactored.)

const STRICT_EMAIL_RE = /^[A-Za-z0-9._%+'-]+@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}$/;

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Mirrors formatRefNo() in frontend/lib/format.ts (separate deployments).
function formatRefNo(refNo) {
  return `ZZ-${String(refNo).padStart(4, "0")}`;
}

// Public site URL: first FRONTEND_ORIGIN entry (comma-separated allow-list).
function getSiteUrl() {
  const first = (process.env.FRONTEND_ORIGIN || "").split(",")[0].trim();
  return first ? first.replace(/\/+$/, "") : null;
}

// Zee's own inbox — same rule as inquiryNotification.js.
function getOwnerRecipients() {
  return (process.env.INQUIRY_NOTIFY_TO || process.env.ADMIN_EMAIL || "")
    .split(",")
    .map((a) => a.trim())
    .filter(Boolean);
}

function formatPeso(n) {
  return `PHP ${Math.round(n).toLocaleString("en-US")}`;
}

// Branded wrapper matching the existing notification email's look.
function wrapEmail({ eyebrow, heading, bodyHtml, footerHtml = "" }) {
  return (
    `<div style="font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;background:#FAF9F6;padding:24px;">` +
    `<div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:12px;border-top:4px solid #D4AF37;padding:24px;">` +
    (eyebrow
      ? `<p style="margin:0 0 4px;color:#D4AF37;font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;">${escapeHtml(eyebrow)}</p>`
      : "") +
    `<h1 style="margin:0 0 16px;font-size:20px;color:#0B1F3A;">${escapeHtml(heading)}</h1>` +
    bodyHtml +
    `</div>` +
    (footerHtml
      ? `<p style="max-width:560px;margin:12px auto 0;color:#9ca3af;font-size:12px;line-height:1.5;text-align:center;">${footerHtml}</p>`
      : "") +
    `</div>`
  );
}

function button(href, label) {
  return (
    `<p style="margin:20px 0 0;"><a href="${escapeHtml(href)}" style="display:inline-block;background:#D4AF37;color:#0B1F3A;` +
    `font-weight:600;text-decoration:none;padding:10px 20px;border-radius:999px;">${escapeHtml(label)}</a></p>`
  );
}

// Strip CR/LF so user-controlled text can't break an email header (subject).
function headerSafe(value, max = 80) {
  return String(value).replace(/[\r\n\t]+/g, " ").trim().slice(0, max);
}

module.exports = {
  STRICT_EMAIL_RE,
  escapeHtml,
  formatRefNo,
  getSiteUrl,
  getOwnerRecipients,
  formatPeso,
  wrapEmail,
  button,
  headerSafe,
};
