import type { Metadata } from 'next'
import BreadcrumbJsonLd from '@/components/BreadcrumbJsonLd'
import HappyHourClient from './HappyHourClient'
import { getPubs, toSuburbSlug } from '@/lib/supabase'

export const revalidate = 60 // Revalidate every 60 seconds for fresh happy hour data

export const metadata: Metadata = {
  title: 'Happy Hours in Perth Right Now | Arvo',
  description:
    'Which Perth pubs have happy hour deals on right now. Live countdown timers, savings calculations, and the cheapest pints available today.',
  alternates: { canonical: 'https://perthpintprices.com/happy-hour' },
  openGraph: {
    title: 'Happy Hours Live Now in Perth | Arvo',
    description:
      'See which Perth pubs have happy hour deals running right now. Live countdown timers and the cheapest pints available today.',
    url: 'https://perthpintprices.com/happy-hour',
    type: 'website',
    siteName: 'Arvo',
    locale: 'en_AU',
    images: [{ url: 'https://perthpintprices.com/og-image.png', width: 1200, height: 630, alt: 'Happy Hours in Perth | Arvo' }],
  },
  twitter: { card: 'summary_large_image' },
}

export default async function HappyHourPage() {
  // Fetch pubs server-side so content appears in initial HTML
  const allPubs = await getPubs()
  const happyHourPubs = allPubs.filter(p => p.happyHour) // All pubs WITH happy hour info

  return (
    <>
      <BreadcrumbJsonLd items={[
        { name: 'Home', url: 'https://perthpintprices.com' },
        { name: 'Happy Hour', url: 'https://perthpintprices.com/happy-hour' },
      ]} />

      {/* Server-rendered links for crawlers */}
      <div className="sr-only" aria-hidden="true">
        <h2>Happy Hour Deals in Perth</h2>
        {happyHourPubs.map(pub => (
          <a key={pub.slug} href={`/${toSuburbSlug(pub.suburb)}/${pub.slug}`}>
            {pub.name} - {pub.suburb} - Happy Hour
          </a>
        ))}
      </div>

      <HappyHourClient initialPubs={happyHourPubs} />
    </>
  )
}
