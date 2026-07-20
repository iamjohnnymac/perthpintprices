const { withSentryConfig } = require('@sentry/nextjs')

const contentSecurityPolicyReportOnly = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://www.clarity.ms https://*.vercel-insights.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://lh3.googleusercontent.com https://*.googleusercontent.com https://*.cartocdn.com",
  "font-src 'self' data:",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.open-meteo.com https://vitals.vercel-insights.com https://*.ingest.sentry.io https://www.google-analytics.com https://www.clarity.ms",
  "frame-src 'self' https://www.google.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "report-uri /api/csp-report",
].join('; ')

// Perth Pint Prices — perthpintprices.com | Production deploy v2
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Serve AVIF/WebP from the image optimizer so the article PNGs ship far
  // smaller (PageSpeed flagged ~121 KiB of avoidable image bytes on mobile).
  images: {
    formats: ['image/avif', 'image/webp'],
  },
  // Generate browser source maps only when the release pipeline can upload
  // them to Sentry; the SDK deletes client maps after upload by default.
  productionBrowserSourceMaps: Boolean(process.env.SENTRY_AUTH_TOKEN),
  headers: async () => [
    {
      source: '/(.*)',
      headers: [
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(self)' },
        { key: 'Content-Security-Policy-Report-Only', value: contentSecurityPolicyReportOnly },
      ],
    },
    {
      // Service worker must not be cached so browsers always get the latest version
      source: '/sw.js',
      headers: [
        { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
        { key: 'Service-Worker-Allowed', value: '/' },
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

module.exports = withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: true,
  sourcemaps: { disable: !process.env.SENTRY_AUTH_TOKEN },
})
