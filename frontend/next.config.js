/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      // Placeholder hero/portrait/profile imagery until real photography
      // is supplied.
      { protocol: "https", hostname: "placehold.co" },
      // Property photos uploaded via the Phase 4 admin panel.
      { protocol: "https", hostname: "res.cloudinary.com" },
    ],
  },
};

module.exports = nextConfig;
