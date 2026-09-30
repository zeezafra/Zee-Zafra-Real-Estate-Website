/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Phase 24 (UI/UX Phase 7 — Performance). Next serves WebP by default
    // already; AVIF is added ahead of it since it typically re-encodes
    // photographic content (every property photo here) noticeably smaller
    // than WebP at the same visual quality. Next tries formats in this
    // order and falls back to the original when a browser accepts neither.
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      // Placeholder hero/portrait/profile imagery until real photography
      // is supplied.
      { protocol: "https", hostname: "placehold.co" },
      // Property photos uploaded via the Phase 4 admin panel.
      { protocol: "https", hostname: "res.cloudinary.com" },
    ],
  },
  // Deployment fix: the admin session cookie is set by the API (Render) but
  // read by Next's server components (Vercel). A cookie set by another
  // domain is never sent to this one, so the dashboard bounced back to
  // login. Fix: the browser talks to /api/* on THIS domain (set
  // NEXT_PUBLIC_API_URL to the site's own URL) and Next proxies it to the
  // real backend (API_INTERNAL_URL, server-side only). Cookie becomes
  // first-party. Unset API_INTERNAL_URL (local dev) and no proxy is added.
  async rewrites() {
    const backend = (process.env.API_INTERNAL_URL || "").replace(/\/+$/, "");
    if (!backend) return [];
    return [{ source: "/api/:path*", destination: `${backend}/api/:path*` }];
  },
  // Phase 11 hardening — baseline headers a security/Lighthouse pass checks
  // for. Deliberately not a full Content-Security-Policy here: a CSP needs
  // to explicitly list every external source (Cloudinary images, any fonts
  // added later) and one wrong entry silently breaks the page, so that's
  // worth its own careful pass once the asset list is final rather than
  // shipping one unverified now.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
