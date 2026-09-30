const express = require("express");
const prisma = require("../lib/prisma");
const { sendEmail, isEmailEnabled } = require("../lib/email");
const {
  STRICT_EMAIL_RE,
  escapeHtml,
  getOwnerRecipients,
  wrapEmail,
  headerSafe,
} = require("../lib/emailUtils");
const { GUIDES, isValidGuide } = require("../lib/guides");
const { verifyTurnstile } = require("../lib/turnstile");
const { guideLimits } = require("../middleware/guideRateLimit");

const router = express.Router();

// POST /api/guides  { email, name?, guide, turnstileToken?, website (honeypot) }
// Public lead magnet. On success the frontend reveals the PDF download —
// this is a "soft gate" (the PDFs are static files), the value is the
// captured email, not access control. Asking for the same guide twice
// answers 200 without creating a second lead or a second notification.
router.post("/", guideLimits, async (req, res) => {
  const body = req.body || {};

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!STRICT_EMAIL_RE.test(email) || email.length > 200) {
    return res.status(400).json({ error: "Please enter a valid email address." });
  }

  const guide = typeof body.guide === "string" ? body.guide : "";
  if (!isValidGuide(guide)) {
    return res.status(400).json({ error: "Unknown guide." });
  }

  const name = typeof body.name === "string" && body.name.trim() ? headerSafe(body.name, 80) : null;

  const verification = await verifyTurnstile(body.turnstileToken, req.ip);
  if (!verification.ok) {
    return res.status(400).json({
      error: "We couldn't verify that you're human. Please complete the check and try again.",
    });
  }

  // Honeypot: pretend success, store nothing.
  if (body.website) return res.status(200).json({ ok: true, guide });

  try {
    const existing = await prisma.guideLead.findUnique({
      where: { email_guide: { email, guide } },
    });
    if (existing) return res.status(200).json({ ok: true, guide });

    await prisma.guideLead.create({ data: { email, name, guide } });

    // Fire-and-forget: tell Zee a new guide lead came in. Never blocks or
    // fails the visitor's download.
    if (isEmailEnabled()) {
      const to = getOwnerRecipients();
      if (to.length) {
        const title = GUIDES[guide];
        sendEmail({
          to,
          replyTo: email,
          subject: headerSafe(`New guide download — ${title}`, 120),
          text: `${name || "Someone"} <${email}> downloaded "${title}".`,
          html: wrapEmail({
            eyebrow: "New guide lead",
            heading: title,
            bodyHtml:
              `<p style="margin:0 0 8px;font-size:14px;color:#0B1F3A;"><strong>${escapeHtml(name || "(no name given)")}</strong></p>` +
              `<p style="margin:0;font-size:14px;color:#0B1F3A;">${escapeHtml(email)}</p>`,
          }),
        }).then((r) => {
          if (!r.ok) console.error(`[guides] Owner notification failed: ${r.error}`);
        });
      }
    }

    return res.status(201).json({ ok: true, guide });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Something went wrong. Please try again." });
  }
});

module.exports = router;
