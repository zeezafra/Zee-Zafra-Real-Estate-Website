// Phase 20. Cloudflare Turnstile verification for the public inquiry
// endpoint — the CAPTCHA half of the roadmap's spam-protection task.
//
// Turnstile was chosen over reCAPTCHA because it's free with no usage
// ceiling, needs no Google account, and renders a non-interactive
// challenge for most real visitors (nothing to click), which matters on a
// lead form where every added step costs real inquiries.
//
// Deliberately NOT middleware: it needs the request body's token AND has
// to run after payload validation (no point spending a network round-trip
// verifying a submission that's going to 400 anyway), so it's called
// inline from the route instead.

const TURNSTILE_VERIFY_URL =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify";

const secret = process.env.TURNSTILE_SECRET_KEY;

// When TURNSTILE_SECRET_KEY isn't set, verification is skipped entirely
// and the route falls back to its other defenses (rate limiting,
// honeypot, heuristics, duplicate detection). That's deliberate: local
// dev and the first deploy shouldn't hard-fail on a missing key, and the
// form has to keep working for real visitors if the key is ever rotated
// badly. Logged once at startup so a silently-unprotected production
// deploy is visible in Render's logs rather than invisible.
function isTurnstileEnabled() {
  return Boolean(secret);
}

if (!secret) {
  console.warn(
    "[turnstile] TURNSTILE_SECRET_KEY not set — CAPTCHA verification is disabled. " +
      "Rate limiting, honeypot, and spam heuristics still apply."
  );
}

/**
 * @returns {Promise<{ok: boolean, skipped?: boolean, error?: string}>}
 */
async function verifyTurnstile(token, ip) {
  if (!secret) {
    return { ok: true, skipped: true };
  }

  // Node 18+ ships a global fetch. Render's default runtime is well past
  // that, but guard rather than crash the one public write endpoint if
  // this ever runs somewhere older.
  if (typeof fetch !== "function") {
    console.warn("[turnstile] global fetch unavailable — skipping verification");
    return { ok: true, skipped: true };
  }

  if (typeof token !== "string" || !token.trim()) {
    return { ok: false, error: "missing-input-response" };
  }

  const body = new URLSearchParams({ secret, response: token.trim() });
  if (ip) {
    body.set("remoteip", ip);
  }

  try {
    const res = await fetch(TURNSTILE_VERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
      // Cloudflare is fast; a hung request shouldn't hold a visitor's
      // form submission open indefinitely.
      signal: AbortSignal.timeout(8000),
    });

    const data = await res.json();

    if (data.success) {
      return { ok: true };
    }

    return {
      ok: false,
      error: Array.isArray(data["error-codes"])
        ? data["error-codes"].join(", ")
        : "verification-failed",
    };
  } catch (err) {
    // Fail OPEN on a network/timeout failure, and only there. A rejected
    // token (above) is a hard fail; Cloudflare being unreachable is not
    // the visitor's fault, and silently dropping a genuine lead is worse
    // for this site than letting one bot through — the honeypot,
    // heuristics, and rate limiter are all still in play on that path.
    console.error("[turnstile] verification request failed, allowing through:", err.message);
    return { ok: true, skipped: true, error: "verification-unavailable" };
  }
}

module.exports = { verifyTurnstile, isTurnstileEnabled };
