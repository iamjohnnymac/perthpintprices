import type { Metadata } from 'next'
import BreadcrumbJsonLd from '@/components/BreadcrumbJsonLd'
import CozyCornersPage from './CozyCornersPage'

export const metadata: Metadata = {
  title: 'Cozy Corners Perth: Best Rainy Day Pubs',
  description: "When Perth's weather turns, these cozy pubs have you covered. Find warm, sheltered venues with fireplaces, covered areas, and comfort food.",
  alternates: { canonical: 'https://perthpintprices.com/guides/cozy-corners' },
  openGraph: {
    title: 'Cozy Corners Perth: Best Rainy Day Pubs | Perth Pint Prices',
    description: "Perth's cosiest pubs for rainy days. Warm, sheltered, and perfect for a pint.",
    url: 'https://perthpintprices.com/guides/cozy-corners',
    type: 'website',
    siteName: 'Perth Pint Prices',
    locale: 'en_AU',
    images: [{ url: 'https://perthpintprices.com/og-image.png', width: 1200, height: 630, alt: 'Cozy Corners Perth - Best Rainy Day Pubs | Perth Pint Prices' }],
  },
  twitter: { card: 'summary_large_image' },
}

export default function Page() {
  return (
    <>
      <BreadcrumbJsonLd items={[
        { name: 'Home', url: 'https://perthpintprices.com' },
        { name: 'Discover', url: 'https://perthpintprices.com/discover' },
        { name: 'Cozy Corners', url: 'https://perthpintprices.com/guides/cozy-corners' },
      ]} />
      <div className="sr-only" aria-hidden="true">
        <h1>Cozy Corners Perth - Best Rainy Day Pubs</h1>
        <p>Perth&apos;s cosiest pubs for when the weather turns. Discover sheltered venues with fireplaces, covered beer gardens, and warm indoor spaces perfect for a pint on a rainy day.</p>
        <a href="/">Home</a>
        <a href="/discover">Discover</a>
        <a href="/happy-hour">Happy Hours</a>
      </div>
      <CozyCornersPage />
    </>
  )
}
