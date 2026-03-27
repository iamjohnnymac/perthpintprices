// Arvo — perthpintprices.com | Production deploy v2
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  headers: async () => [
    {
      // Service worker must not be cached so browsers always get the latest version
      source: '/sw.js',
      headers: [
        { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
        { key: 'Service-Worker-Allowed', value: '/' },
      ],
    },
    {
      // Static assets with content hashes — cache aggressively
      source: '/_next/static/:path*',
      headers: [
        { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
      ],
    },
    {
      // Font files
      source: '/fonts/:path*',
      headers: [
        { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
      ],
    },
  ],
  redirects: async () => [
    {
      // Old suburb URL structure: /suburb/{slug} → /{slug}
      source: '/suburb/:slug',
      destination: '/:slug',
      permanent: true,
    },
  ],
}

module.exports = nextConfig
