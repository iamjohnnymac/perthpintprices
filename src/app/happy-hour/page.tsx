import type { Metadata } from 'next'
import BreadcrumbJsonLd from '@/components/BreadcrumbJsonLd'
import HappyHourClient from './HappyHourClient'
import { getPubs } from '@/lib/supabase'

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
        <h1>Happy Hour Deals in Perth</h1>
        {happyHourPubs.map(pub => (
          <a key={pub.slug} href={`/pub/${pub.slug}`}>
            {pub.name} - {pub.suburb} - Happy Hour
          </a>
        ))}
      </div>

      <HappyHourClient initialPubs={happyHourPubs} />
    </>
  )
}
