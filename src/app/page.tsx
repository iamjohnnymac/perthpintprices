import { Metadata } from 'next'
import HomeClient from './HomeClient'
import { getSiteStats } from '@/lib/supabase'

export async function generateMetadata(): Promise<Metadata> {
  const stats = await getSiteStats()
  const title = "Arvo — Perth's pint prices, sorted."
  const description = `Perth's pint prices, sorted. Real prices from real people across ${stats.venueCount}+ venues and ${stats.suburbCount} suburbs.`

  return {
    title,
    description,
    alternates: {
      canonical: 'https://www.perthpintprices.com/',
    },
    openGraph: {
      title,
      description: `Perth's pint prices, sorted. ${stats.venueCount}+ venues. Avg: $${stats.avgPrice}. Cheapest: $${stats.cheapestPrice}.`,
      url: 'https://www.perthpintprices.com/',
      siteName: 'Arvo',
      locale: 'en_AU',
      type: 'website',
      images: [
        {
          url: 'https://www.perthpintprices.com/og-image.png',
          width: 1200,
          height: 630,
          alt: "Arvo — Perth's pint prices, sorted",
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: `Perth's pint prices, sorted. ${stats.venueCount}+ venues — find cheap pints near you.`,
    },
  }
}

// JSON-LD structured data for homepage
function HomeJsonLd() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Arvo',
    alternateName: 'Perth Pint Prices',
    url: 'https://www.perthpintprices.com',
    description: "Perth's pint prices, sorted. Real prices from real people.",
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  )
}

export const revalidate = 300

export default function HomePage() {
  return (
    <>
      <HomeJsonLd />
      <HomeClient />
    </>
  )
}
