// Phase 26. "Thanks, I got your message" email to the VISITOR, sent after a
// real (non-spam, non-duplicate) inquiry is saved. Mirrors the shape of
// inquiryNotification.js: fire-and-forget, never throws.
//
// IMPORTANT deployment note: while RESEND_FROM_EMAIL is unset, mail goes out
// from Resend's sandbox sender, which can only deliver to the Resend
// account's own address — so visitors will NOT receive this until a domain
// is verified in Resend. Failures are logged, never surfaced to the visitor.
//
// Env (all optional):
//   AUTO_REPLY_ENABLED        "false" turns it off (default on)
//   AUTO_REPLY_RESPONSE_TIME  promise shown in the email (default "within 24 hours")
//   REPLY_TO_EMAIL            where visitor replies go (default: first owner address)
//   AGENT_NAME                sign-off name (default "Zee Zafra")
//   CHAT_MESSENGER_URL / CHAT_INSTAGRAM_URL / CHAT_WHATSAPP_URL
//                             "Prefer to chat?" links. Set one to "" to hide it.

const prisma = require("./prisma");
const { sendEmail, isEmailEnabled } = require("./email");
const {
  STRICT_EMAIL_RE,
  escapeHtml,
  formatRefNo,
  getSiteUrl,
  getOwnerRecipients,
  wrapEmail,
  button,
  headerSafe,
} = require("./emailUtils");

// Where the visitor can continue the conversation. Defaults mirror
// CHAT_LINKS / SOCIAL_LINKS in frontend/lib/siteConfig.ts; override via env
// on Render if they change. Empty string = channel hidden.
function getChatChannels() {
  const pick = (envKey, fallback) =>
    process.env[envKey] === undefined ? fallback : String(process.env[envKey]).trim();
  return [
    { label: "Messenger", url: pick("CHAT_MESSENGER_URL", "https://m.me/61594137604570") },
    { label: "Instagram", url: pick("CHAT_INSTAGRAM_URL", "https://www.instagram.com/zeezafrarealestatelistings/") },
    { label: "WhatsApp", url: pick("CHAT_WHATSAPP_URL", "https://wa.me/639918801873") },
  ].filter((c) => /^https?:\/\//i.test(c.url));
}

function isEnabled() {
  return String(process.env.AUTO_REPLY_ENABLED || "true").toLowerCase() !== "false";
}

function firstName(name) {
  return headerSafe(name, 40).split(" ")[0] || "there";
}

function buildAutoReply(inquiry, property, { siteUrl, responseTime, agentName }) {
  const isViewing = Boolean(inquiry.preferredDate || inquiry.preferredTime);
  const isSeller = inquiry.type === "SELLER";
  const hi = `Hi ${firstName(inquiry.name)},`;

  const propertyLabel = property ? `${formatRefNo(property.refNo)} — ${property.title}` : null;
  const propertyUrl = property && siteUrl ? `${siteUrl}/properties/${property.id}` : null;

  let intro;
  let next;
  if (isViewing) {
    intro = `Thanks for requesting a viewing${propertyLabel ? ` of ${propertyLabel}` : ""}.`;
    next = `I'll check the schedule and get back to you ${responseTime} to confirm a time. Your requested slot isn't confirmed until I do.`;
  } else if (isSeller) {
    intro = "Thanks for reaching out about selling your property.";
    next = `I'll review the details you sent and get back to you ${responseTime}.`;
  } else {
    intro = `Thanks for your inquiry${propertyLabel ? ` about ${propertyLabel}` : ""}.`;
    next = `I've received your message and will reply ${responseTime}.`;
  }
  const closing = "In the meantime, you're welcome to just reply to this email if you have anything to add.";
  const channels = getChatChannels();
  const chatIntro = "Prefer to chat? Message me directly on:";

  const subject = headerSafe(
    isViewing
      ? "We received your viewing request"
      : isSeller
        ? "Thanks — we received your details"
        : "Thanks for your inquiry"
  ) + " — Zee Zafra Properties";

  const textLines = [hi, "", intro, next, closing];
  if (propertyUrl) textLines.push(`Listing: ${propertyUrl}`);
  if (channels.length) {
    textLines.push("", chatIntro, ...channels.map((c) => `${c.label}: ${c.url}`));
  }
  textLines.push("", `— ${agentName}`, "Zee Zafra Properties");
  const text = textLines.join("\n");

  const html = wrapEmail({
    eyebrow: "Message received",
    heading: `Thanks, ${firstName(inquiry.name)}!`,
    bodyHtml:
      `<p style="margin:0 0 12px;font-size:14px;line-height:1.6;color:#0B1F3A;">${escapeHtml(intro)}</p>` +
      `<p style="margin:0 0 12px;font-size:14px;line-height:1.6;color:#0B1F3A;">${escapeHtml(next)}</p>` +
      `<p style="margin:0 0 12px;font-size:14px;line-height:1.6;color:#0B1F3A;">${escapeHtml(closing)}</p>` +
      (propertyUrl ? button(propertyUrl, "View the listing") : "") +
      (channels.length
        ? `<p style="margin:24px 0 8px;font-size:14px;line-height:1.6;color:#0B1F3A;">${escapeHtml(chatIntro)}</p>` +
          `<p style="margin:0;font-size:14px;line-height:1.9;color:#0B1F3A;">` +
          channels
            .map(
              (c) =>
                `<a href="${escapeHtml(c.url)}" style="color:#0B1F3A;font-weight:600;text-decoration:underline;">${escapeHtml(c.label)}</a>`
            )
            .join(" &nbsp;·&nbsp; ") +
          `</p>`
        : "") +
      `<p style="margin:24px 0 0;font-size:14px;color:#0B1F3A;">— ${escapeHtml(agentName)}<br>Zee Zafra Properties</p>`,
    footerHtml: "You're receiving this because you submitted a form on the Zee Zafra Properties website.",
  });

  return { subject, text, html };
}

async function sendAutoReply(inquiry) {
  try {
    if (!isEnabled() || !isEmailEnabled()) return;
    if (!inquiry.email || !STRICT_EMAIL_RE.test(inquiry.email)) return; // phone-only leads: nothing to send to

    let property = null;
    if (inquiry.propertyId) {
      try {
        property = await prisma.property.findUnique({
          where: { id: inquiry.propertyId },
          select: { id: true, title: true, refNo: true },
        });
      } catch (err) {
        console.error("[autoreply] Property lookup failed, sending without it:", err.message);
      }
    }

    const message = buildAutoReply(inquiry, property, {
      siteUrl: getSiteUrl(),
      responseTime: process.env.AUTO_REPLY_RESPONSE_TIME || "within 24 hours",
      agentName: process.env.AGENT_NAME || "Zee Zafra",
    });

    const replyTo = process.env.REPLY_TO_EMAIL || getOwnerRecipients()[0];
    const result = await sendEmail({ to: inquiry.email, replyTo, ...message });
    if (!result.ok) {
      console.error(`[autoreply] Failed for inquiry ${inquiry.id}: ${result.error}`);
    }
  } catch (err) {
    console.error(`[autoreply] Unexpected error for inquiry ${inquiry && inquiry.id}:`, err);
  }
}

module.exports = { sendAutoReply, buildAutoReply };
