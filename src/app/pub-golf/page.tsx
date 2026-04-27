import { getPubs } from '@/lib/supabase'
import BreadcrumbJsonLd from '@/components/BreadcrumbJsonLd'
import PubGolfClient from './PubGolfClient'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Pub Golf Perth: Score Your Pub Crawl',
  description: "Play pub golf across Perth's best pubs. Pick a course, track your scores, and see how much your round costs. Real prices from 300+ Perth venues.",
  alternates: { canonical: 'https://perthpintprices.com/pub-golf' },
  openGraph: {
    title: 'Pub Golf Perth: Score Your Crawl | Perth Pint Prices',
    description: "Play pub golf across Perth's best pubs with real pint prices.",
    url: 'https://perthpintprices.com/pub-golf',
    type: 'website',
    siteName: 'Perth Pint Prices',
    locale: 'en_AU',
    images: [{ url: 'https://perthpintprices.com/og-image.png', width: 1200, height: 630, alt: 'Pub Golf Perth | Perth Pint Prices' }],
  },
  twitter: { card: 'summary_large_image' },
}

export const revalidate = 3600

export default async function PubGolfPage() {
  const pubs = await getPubs()
  return (
    <>
      <BreadcrumbJsonLd items={[
        { name: 'Home', url: 'https://perthpintprices.com' },
        { name: 'Pub Golf', url: 'https://perthpintprices.com/pub-golf' },
      ]} />
      <PubGolfClient pubs={pubs} />
    </>
  )
}
