import type { Metadata } from 'next'
import BreadcrumbJsonLd from '@/components/BreadcrumbJsonLd'
import DadBarPage from './DadBarPage'

export const metadata: Metadata = {
  title: 'The Dad Bar: Classic Perth Pubs for Dads',
  description: "No craft cocktails, no pretentious menus. Just honest Perth pubs where dads can enjoy a cold pint in peace. Kid-friendly spots included.",
  alternates: { canonical: 'https://perthpintprices.com/guides/dad-bar' },
  openGraph: {
    title: 'The Dad Bar: Classic Perth Pubs for Dads | Perth Pint Prices',
    description: "Honest Perth pubs where dads can enjoy a cold pint in peace.",
    url: 'https://perthpintprices.com/guides/dad-bar',
    type: 'website',
    siteName: 'Perth Pint Prices',
    locale: 'en_AU',
    images: [{ url: 'https://perthpintprices.com/og-image.png', width: 1200, height: 630, alt: 'The Dad Bar - Classic Perth Pubs | Perth Pint Prices' }],
  },
  twitter: { card: 'summary_large_image' },
}

export default function Page() {
  return (
    <>
      <BreadcrumbJsonLd items={[
        { name: 'Home', url: 'https://perthpintprices.com' },
        { name: 'Discover', url: 'https://perthpintprices.com/discover' },
        { name: 'The Dad Bar', url: 'https://perthpintprices.com/guides/dad-bar' },
      ]} />
      <div className="sr-only" aria-hidden="true">
        <h1>The Dad Bar - Classic Perth Pubs</h1>
        <p>No craft cocktails, no pretentious menus. Find honest Perth pubs where you can enjoy a cold pint in peace. Includes kid-friendly spots with cheap prices and classic pub vibes.</p>
        <a href="/">Home</a>
        <a href="/discover">Discover</a>
        <a href="/happy-hour">Happy Hours</a>
      </div>
      <DadBarPage />
    </>
  )
}
