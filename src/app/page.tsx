import { Metadata } from 'next'
import HomeClient from './HomeClient'
import { getSiteStats, getPubs } from '@/lib/supabase'

export async function generateMetadata(): Promise<Metadata> {
  const stats = await getSiteStats()
  const title = "Arvo | Perth's pint prices, sorted."
  const description = `Perth's pint prices, sorted. Real prices from real people across ${stats.venueCount}+ venues and ${stats.suburbCount} suburbs.`

  return {
    title,
    description,
    alternates: {
      canonical: 'https://perthpintprices.com/',
    },
    openGraph: {
      title,
      description: `Perth's pint prices, sorted. ${stats.venueCount}+ venues. Avg: $${stats.avgPrice}. Cheapest: $${stats.cheapestPrice}.`,
      url: 'https://perthpintprices.com/',
      siteName: 'Arvo',
      locale: 'en_AU',
      type: 'website',
      images: [
        {
          url: 'https://perthpintprices.com/og-image.png',
          width: 1200,
          height: 630,
          alt: "Arvo | Perth's pint prices, sorted",
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: `Perth's pint prices, sorted. ${stats.venueCount}+ venues. Find cheap pints near you.`,
    },
  }
}

// JSON-LD structured data for homepage
function HomeJsonLd() {
  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'Arvo',
      alternateName: 'Perth Pint Prices',
      url: 'https://perthpintprices.com',
      description: "Perth's pint prices, sorted. Real prices from real people.",
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'How accurate are the prices?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Prices are checked through community submissions, menu checks, and direct calls. If we haven\'t confirmed a price, you\'ll see "Price TBC" instead of a guess.',
          },
        },
        {
          '@type': 'Question',
          name: 'How often are prices updated?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Prices get updated as the community submits them and we verify existing listings. Each price shows a "last verified" date so you know how fresh it is.',
          },
        },
        {
          '@type': 'Question',
          name: 'What does the price represent?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'All prices shown are for a standard pint (570ml) of the cheapest tap beer available at each venue. Happy hour prices are shown when they\'re currently active.',
          },
        },
        {
          '@type': 'Question',
          name: 'Can I submit a price?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Absolutely. Hit "Submit a Price" in the top nav or use the Report button on any pub page.',
          },
        },
        {
          '@type': 'Question',
          name: 'Why is a pub showing "Price TBC"?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'We only display prices we\'ve confirmed. "Price TBC" means we know the pub exists but haven\'t verified its current pint price yet. You can help by submitting it!',
          },
        },
        {
          '@type': 'Question',
          name: 'Is Arvo free?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: '100%. No app download. No sign-up. Just prices.',
          },
        },
      ],
    },
  ]

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  )
}

export const revalidate = 300

export default async function HomePage() {
  const [pubs, stats] = await Promise.all([getPubs(), getSiteStats()])
  return (
    <>
      <HomeJsonLd />
      <HomeClient initialPubs={pubs} initialStats={stats} />
    </>
  )
}
