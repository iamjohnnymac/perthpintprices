// Perth Pint Prices — perthpintprices.com | Production deploy v2
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Serve AVIF/WebP from the image optimizer so the article PNGs ship far
  // smaller (PageSpeed flagged ~121 KiB of avoidable image bytes on mobile).
  images: {
    formats: ['image/avif', 'image/webp'],
  },
  // Emit source maps for production JS so debugging tools (and Lighthouse's
  // "valid source maps" best-practice audit) can map the minified bundles.
  productionBrowserSourceMaps: true,
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
}

module.exports = nextConfig
