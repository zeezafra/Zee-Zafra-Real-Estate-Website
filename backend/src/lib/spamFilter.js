// Phase 20. Content-based spam detection for the public inquiry endpoint,
// layered behind Turnstile rather than replacing it — CAPTCHA stops
// automated submissions, this catches the hand-typed SEO/crypto spam that
// solves a CAPTCHA just fine.
//
// Key design decision: a flagged submission is STORED with spam = true,
// not rejected. Two reasons — a false positive would otherwise silently
// destroy a real lead with no way to recover it, and returning a normal
// success response means a bot gets no signal about what tripped the
// filter. Zee reviews flagged rows in the inbox's Spam view and can
// un-flag one back into the main inbox.

// Deliberately short and boring — the cost of a false positive here is a
// lost lead, so this only lists terms that have no plausible reason to
// appear in an inquiry about a Philippine property listing.
const SPAM_KEYWORDS = [
  "seo service",
  "seo expert",
  "backlink",
  "guest post",
  "link building",
  "casino",
  "viagra",
  "cialis",
  "porn",
  "webcam",
  "forex",
  "binary option",
  "crypto invest",
  "bitcoin invest",
  "make money fast",
  "work from home",
  "earn $",
  "click here now",
  "increase your traffic",
  "rank your website",
];

// Two copies on purpose: the /g one is only ever used with String.match
// (which resets lastIndex), the plain one with .test(). Sharing a single
// /g regex between the two would make .test() stateful across calls —
// a classic source of "every other submission is flagged" bugs.
const URL_MATCH_RE = /(https?:\/\/|www\.)\S+/gi;
const URL_TEST_RE = /(https?:\/\/|www\.)\S+/i;

/**
 * @param {{name?: string, email?: string, message?: string, honeypot?: unknown}} input
 * @returns {{spam: boolean, reason: string|null}}
 */
function detectSpam({ name = "", email = "", message = "", honeypot } = {}) {
  // 1. Honeypot. The frontend renders a visually-hidden, aria-hidden,
  // autocomplete-off "website" field that no sighted or screen-reader
  // user ever fills. Form-filling bots fill every input they find.
  if (typeof honeypot === "string" && honeypot.trim()) {
    return { spam: true, reason: "honeypot" };
  }

  const haystack = `${name} ${email} ${message}`.toLowerCase();

  // 2. Keyword match.
  const keyword = SPAM_KEYWORDS.find((term) => haystack.includes(term));
  if (keyword) {
    return { spam: true, reason: `keyword:${keyword}` };
  }

  // 3. Links. One link is plausible (a visitor pasting a listing URL from
  // Facebook Marketplace); two or more in a short message is the shape of
  // link spam, not a property question.
  const links = message.match(URL_MATCH_RE) || [];
  if (links.length >= 2) {
    return { spam: true, reason: "excessive-links" };
  }

  // 4. A URL in the *name* field has no legitimate explanation.
  if (URL_TEST_RE.test(name)) {
    return { spam: true, reason: "link-in-name" };
  }

  // 5. Long unbroken string with no whitespace — base64-ish payloads and
  // keyboard mashing, never a real sentence in any language this site
  // serves.
  if (message.length > 60 && !/\s/.test(message)) {
    return { spam: true, reason: "no-whitespace" };
  }

  return { spam: false, reason: null };
}

module.exports = { detectSpam, SPAM_KEYWORDS };
