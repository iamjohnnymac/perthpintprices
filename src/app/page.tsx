import { Metadata } from 'next'
import HomeClient from './HomeClient'
import { getSiteStats } from '@/lib/supabase'
import { getCachedPubs } from '@/lib/cachedPubs'
import { slimPubForList } from '@/lib/pubPhoto'
import { pubUrl, suburbUrl, BASE_URL } from '@/lib/urls'
import { buildOrganizationJsonLd, buildWebSiteJsonLd } from '@/lib/siteJsonLd'

export async function generateMetadata(): Promise<Metadata> {
  const stats = await getSiteStats()
  const title = "Perth Pint Prices | Perth's pints, sorted."
  const description = `What a pint costs across ${stats.venueCount} Perth pubs — checked, dated, and sorted cheapest first.`

  return {
    title: {
      absolute: title,
    },
    description,
    alternates: {
      canonical: 'https://perthpintprices.com/',
    },
    openGraph: {
      title,
      description: `${stats.venueCount} Perth pubs, sorted cheapest first. Average $${stats.avgPrice}, cheapest $${stats.cheapestPrice} — each price dated.`,
      url: 'https://perthpintprices.com/',
      siteName: 'Perth Pint Prices',
      locale: 'en_AU',
      type: 'website',
      images: [
        {
          url: 'https://perthpintprices.com/og-image.png',
          width: 1200,
          height: 630,
          alt: "Perth Pint Prices | Perth's pints, sorted",
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: `What a pint costs across ${stats.venueCount} Perth pubs — checked and sorted cheapest first.`,
    },
  }
}

// JSON-LD structured data for homepage. One @graph carries the canonical brand
// entities (Organization + WebSite — Google reads these for the domain from the
// homepage) plus the homepage FAQ, all interlinked by @id.
function HomeJsonLd() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      buildOrganizationJsonLd(),
      buildWebSiteJsonLd(),
      {
        '@type': 'FAQPage',
        '@id': `${BASE_URL}/#faq`,
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
              text: 'Absolutely. Hit "Report a price" in the top nav or use the Report button on any pub page.',
            },
          },
          {
            '@type': 'Question',
            name: 'Why is a pub showing "Price TBC"?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'We only display prices we\'ve confirmed. "Price TBC" means we know the pub exists but haven\'t verified its current pint price yet. You can help by submitting it.',
            },
          },
          {
            '@type': 'Question',
            name: 'Is Perth Pint Prices free?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: '100%. No app download. No sign-up. Just prices.',
            },
          },
        ],
      },
    ],
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  )
}

export const revalidate = 300

export default async function HomePage() {
  const pubsFull = await getCachedPubs()
  const stats = await getSiteStats(pubsFull)

  // The homepage list/cards never show photos, opening hours, ratings or the
  // other Google enrichment, so drop those fields before serialising ~850 pubs
  // into the HTML. Shipping the full objects pushed the page past Googlebot's
  // 2MB crawl limit.
  const pubs = pubsFull.map(slimPubForList)

  // Get unique suburbs from pub data for server-rendered links
  const suburbs = Array.from(new Set(pubs.map(p => p.suburb))).sort()

  return (
    <>
      <HomeJsonLd />

      {/* ═══ SERVER-RENDERED CRAWLABLE LINKS ═══
          These render in the initial HTML so Googlebot can discover all pages.
          The client component overlays this with the interactive UI on hydration. */}
      {/* aria-hidden hides these from the a11y tree, so the anchors carry
          tabIndex={-1} to stay out of the keyboard focus order too. href is
          untouched, so Googlebot still discovers every page from here. */}
      <div id="ssr-links" className="sr-only" aria-hidden="true">
        <nav>
          <a href="/" tabIndex={-1}>Home</a>
          <a href="/discover" tabIndex={-1}>Discover</a>
          <a href="/happy-hour" tabIndex={-1}>Happy Hours</a>
          <a href="/suburbs" tabIndex={-1}>All Suburbs</a>
        </nav>

        <h2>Perth Suburbs</h2>
        {suburbs.map(suburb => (
          <a key={suburb} href={suburbUrl(suburb)} tabIndex={-1}>{suburb}</a>
        ))}

        <h2>Perth Pubs - Cheapest Pints</h2>
        {pubs.slice(0, 50).map(pub => (
          <a key={pub.slug} href={pubUrl(pub)} tabIndex={-1}>
            {pub.name} - {pub.suburb}
            {pub.price ? ` - $${pub.price.toFixed(2)}` : ''}
          </a>
        ))}
      </div>

      <HomeClient initialPubs={pubs} initialStats={stats} />
    </>
  )
}
