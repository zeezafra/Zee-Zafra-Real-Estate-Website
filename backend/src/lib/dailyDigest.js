// Phase 26. Morning email to Zee: overdue follow-ups, follow-ups due today,
// viewings coming up, and leads nobody has touched yet. Nothing is sent on
// a day with nothing to report — an empty digest trains you to ignore them.
//
// Triggered by POST /api/cron/daily-digest (see routes/cron.js) or by
// `node scripts/sendDigest.js`. Both call sendDailyDigest().

const prisma = require("./prisma");
const { sendEmail, isEmailEnabled } = require("./email");
const {
  escapeHtml, formatRefNo, getSiteUrl, getOwnerRecipients, wrapEmail, button, headerSafe,
} = require("./emailUtils");

const CLOSED = ["CLOSED_WON", "CLOSED_LOST"];
const LIST_CAP = 15;

function manilaDate(offsetDays = 0) {
  const d = new Date(Date.now() + offsetDays * 86400000);
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Manila" }).format(d); // YYYY-MM-DD
}

async function collectDigestData() {
  const today = manilaDate(0);
  const tomorrow = manilaDate(1);
  const base = { archived: false, spam: false, status: { notIn: CLOSED } };
  const include = { property: { select: { refNo: true, title: true } } };

  const [overdue, dueToday, viewings, untouched] = await Promise.all([
    prisma.inquiry.findMany({
      where: { ...base, nextFollowUpDate: { not: null, lt: today } },
      orderBy: { nextFollowUpDate: "asc" }, include, take: LIST_CAP + 1,
    }),
    prisma.inquiry.findMany({
      where: { ...base, nextFollowUpDate: today },
      orderBy: { createdAt: "asc" }, include, take: LIST_CAP + 1,
    }),
    prisma.inquiry.findMany({
      where: { ...base, preferredDate: { in: [today, tomorrow] } },
      orderBy: [{ preferredDate: "asc" }, { preferredTime: "asc" }], include, take: LIST_CAP + 1,
    }),
    prisma.inquiry.findMany({
      // Still NEW after 24h+ with no follow-up date set.
      where: { ...base, status: "NEW", createdAt: { lt: new Date(Date.now() - 24 * 3600000) } },
      orderBy: { createdAt: "asc" }, include, take: LIST_CAP + 1,
    }),
  ]);

  return { today, tomorrow, overdue, dueToday, viewings, untouched };
}

function contactOf(i) {
  return [i.phone, i.email].filter(Boolean).join(" · ") || "no contact details";
}

function line(i, extra) {
  const prop = i.property ? ` — ${formatRefNo(i.property.refNo)}` : "";
  return { text: `${i.name}${prop} (${contactOf(i)})${extra ? ` — ${extra}` : ""}`, id: i.id, name: i.name, prop, contact: contactOf(i), extra };
}

// Pure — takes the collected data, returns { empty, subject, text, html }.
function buildDigest(data, adminBaseUrl) {
  const sections = [
    { title: "Overdue follow-ups", items: data.overdue.map((i) => line(i, `was due ${i.nextFollowUpDate}`)), all: data.overdue },
    { title: "Follow-ups due today", items: data.dueToday.map((i) => line(i)), all: data.dueToday },
    {
      title: "Viewings today & tomorrow",
      items: data.viewings.map((i) =>
        line(i, `${i.preferredDate === data.today ? "today" : "tomorrow"}${i.preferredTime ? ` at ${i.preferredTime}` : ""}`)
      ),
      all: data.viewings,
    },
    { title: "New leads not yet contacted (24h+)", items: data.untouched.map((i) => line(i)), all: data.untouched },
  ].filter((s) => s.all.length > 0);

  if (sections.length === 0) return { empty: true };

  const counts = {
    overdue: data.overdue.length, dueToday: data.dueToday.length,
    viewings: data.viewings.length, untouched: data.untouched.length,
  };
  const subjectBits = [];
  if (counts.overdue) subjectBits.push(`${counts.overdue}${counts.overdue > LIST_CAP ? "+" : ""} overdue`);
  if (counts.dueToday) subjectBits.push(`${counts.dueToday} due today`);
  if (counts.viewings) subjectBits.push(`${counts.viewings} viewing${counts.viewings > 1 ? "s" : ""}`);
  if (counts.untouched) subjectBits.push(`${counts.untouched} untouched`);
  const subject = headerSafe(`Daily digest: ${subjectBits.join(", ")}`, 120);

  const textLines = [`Zee Zafra Properties — ${data.today}`, ""];
  for (const s of sections) {
    textLines.push(s.title.toUpperCase());
    s.items.slice(0, LIST_CAP).forEach((l) => textLines.push(`- ${l.text}`));
    if (s.items.length > LIST_CAP) textLines.push(`- …and more (open the inbox)`);
    textLines.push("");
  }
  if (adminBaseUrl) textLines.push(`Open inbox: ${adminBaseUrl}/admin/inquiries`);

  const body = sections
    .map(
      (s) =>
        `<h2 style="margin:20px 0 8px;font-size:14px;color:#0B1F3A;">${escapeHtml(s.title)} (${s.all.length}${s.all.length > LIST_CAP ? "+" : ""})</h2>` +
        `<ul style="margin:0;padding-left:18px;font-size:14px;line-height:1.6;color:#0B1F3A;">` +
        s.items
          .slice(0, LIST_CAP)
          .map((l) => {
            const nameHtml = adminBaseUrl
              ? `<a href="${escapeHtml(adminBaseUrl)}/admin/inquiries/${escapeHtml(l.id)}" style="color:#0B1F3A;font-weight:600;">${escapeHtml(l.name)}</a>`
              : `<strong>${escapeHtml(l.name)}</strong>`;
            return `<li>${nameHtml}${escapeHtml(l.prop)} <span style="color:#6b7280;">(${escapeHtml(l.contact)})</span>${l.extra ? ` — ${escapeHtml(l.extra)}` : ""}</li>`;
          })
          .join("") +
        `</ul>`
    )
    .join("");

  const html = wrapEmail({
    eyebrow: "Daily digest",
    heading: "Your leads today",
    bodyHtml: body + (adminBaseUrl ? button(`${adminBaseUrl}/admin/inquiries`, "Open inbox") : ""),
  });

  return { empty: false, subject, text: textLines.join("\n"), html };
}

/** Returns { sent, skipped?, reason? } — never throws. */
async function sendDailyDigest() {
  try {
    if (!isEmailEnabled()) return { sent: false, skipped: true, reason: "email-disabled" };
    const to = getOwnerRecipients();
    if (to.length === 0) return { sent: false, skipped: true, reason: "no-recipient" };

    const digest = buildDigest(await collectDigestData(), getSiteUrl());
    if (digest.empty) return { sent: false, skipped: true, reason: "nothing-to-report" };

    const result = await sendEmail({ to, subject: digest.subject, text: digest.text, html: digest.html });
    if (!result.ok) console.error(`[digest] send failed: ${result.error}`);
    return { sent: result.ok, ...(result.ok ? {} : { reason: result.error }) };
  } catch (err) {
    console.error("[digest] unexpected error:", err);
    return { sent: false, reason: "error" };
  }
}

module.exports = { sendDailyDigest, buildDigest, collectDigestData };
