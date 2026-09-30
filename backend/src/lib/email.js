// Transactional email via Resend — the transport half. What to say lives in
// lib/inquiryNotification.js; this file only knows how to send.
//
// Same posture as lib/turnstile.js: the integration is OPTIONAL. With no
// RESEND_API_KEY the app boots and every caller keeps working — sending is
// simply skipped, and a warning is logged once at startup so a
// silently-mute production deploy is visible in Render's logs instead of
// invisible. That's what lets this ship before the key exists.
//
// sendEmail() NEVER throws and never rejects. Email is a side effect of a
// lead being saved, not part of saving it — a Resend outage, a bad key, or
// a rejected address must not turn a stored inquiry into a 500 for the
// visitor. Callers get a { ok, skipped?, error? } result and may ignore it.

const { Resend } = require("resend");

const apiKey = process.env.RESEND_API_KEY;

// Resend's shared sandbox sender. It works with no domain set up, but it
// can only deliver to the email address the Resend account was created
// with — fine for notifying Zee, not for emailing visitors. Once a domain
// is verified in Resend, set RESEND_FROM_EMAIL to an address on it.
const DEFAULT_FROM = "Zee Zafra Properties <onboarding@resend.dev>";
const from = process.env.RESEND_FROM_EMAIL || DEFAULT_FROM;

// `new Resend()` throws outright when given no key, so the client is only
// constructed when there is one — never at import time unconditionally,
// or a missing env var would crash the whole server on boot.
const client = apiKey ? new Resend(apiKey) : null;

if (!client) {
  console.warn(
    "[email] RESEND_API_KEY not set — email notifications are disabled. " +
      "Inquiries are still saved and appear in the admin inbox as normal."
  );
}

function isEmailEnabled() {
  return client !== null;
}

/**
 * @param {{ to: string | string[], subject: string, html: string, text: string, replyTo?: string, headers?: Record<string,string> }} message
 * @returns {Promise<{ok: boolean, skipped?: boolean, id?: string, error?: string}>}
 */
async function sendEmail({ to, subject, html, text, replyTo, headers }) {
  if (!client) {
    return { ok: true, skipped: true };
  }

  try {
    const { data, error } = await client.emails.send({
      from,
      to,
      subject,
      html,
      text,
      // Only present when the caller supplies one; an undefined key is
      // dropped by the SDK, so no conditional spread is needed.
      replyTo,
      // Phase 26: List-Unsubscribe on alert emails.
      headers,
    });

    if (error) {
      // Resend reports API-level failures (bad key, unverified sender,
      // sandbox-sender-to-a-stranger, rate limit) as a returned `error`
      // rather than a throw.
      return { ok: false, error: `${error.name}: ${error.message}` };
    }

    return { ok: true, id: data && data.id };
  } catch (err) {
    // Network failure / timeout. Same rule as above: report, don't throw.
    return { ok: false, error: err.message };
  }
}

module.exports = { sendEmail, isEmailEnabled };
