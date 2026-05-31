import type { Metadata } from 'next'
import BreadcrumbJsonLd from '@/components/BreadcrumbJsonLd'
import { buildArticleJsonLd } from '@/lib/articleJsonLd'
import { getAllPubLastModifiedPairs } from '@/lib/supabase'
import PintIndexPage from './PintIndexPage'

const canonical = 'https://perthpintprices.com/insights/pint-index'
const description = "The median pint in Perth, tracked across the pubs we cover and updated as prices come in — the spread by suburb, the quarter's moves, and who's still under $10."
const fallbackModified = '2026-05-31T00:00:00.000Z'

export const metadata: Metadata = {
  title: 'Perth Pint Index™: Live Beer Price Tracker',
  description,
  alternates: { canonical },
  openGraph: {
    title: 'Perth Pint Index™: Live Beer Price Tracker | Perth Pint Prices',
    description: "Track Perth's average pint price over time across 300+ venues.",
    url: canonical,
    type: 'website',
    siteName: 'Perth Pint Prices',
    locale: 'en_AU',
    images: [{ url: 'https://perthpintprices.com/og-image.png', width: 1200, height: 630, alt: 'Perth Pint Index - Live Beer Price Tracker' }],
  },
  twitter: { card: 'summary_large_image' },
}

function latestModifiedDate(values: Array<{ lastModified: string | null }>): string {
  return values
    .map(value => {
      if (!value.lastModified) return null
      const date = new Date(value.lastModified)
      return Number.isNaN(date.getTime()) ? null : date.toISOString()
    })
    .filter((value): value is string => Boolean(value))
    .sort()
    .at(-1) || fallbackModified
}

export default async function Page() {
  const latestPubModified = latestModifiedDate(await getAllPubLastModifiedPairs())
  const articleJsonLd = buildArticleJsonLd({
    url: canonical,
    headline: 'Perth Pint Index: Live Beer Price Tracker',
    description,
    dateModified: latestPubModified,
    dateReviewed: latestPubModified,
  })

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd).replace(/</g, '\\u003c') }}
      />
      <BreadcrumbJsonLd items={[
        { name: 'Home', url: 'https://perthpintprices.com' },
        { name: 'Discover', url: 'https://perthpintprices.com/discover' },
        { name: 'Perth Pint Index™', url: canonical },
      ]} />
      <div className="sr-only" aria-hidden="true">
        <h1>Perth Pint Index - Live Beer Price Tracker</h1>
        <p>The median pint in Perth, tracked across every pub we cover and updated as prices come in. The Index shows the spread by suburb, which way prices moved this quarter, and the pubs still holding under $10.</p>
        <a href="/">Home</a>
        <a href="/discover">Discover</a>
        <a href="/happy-hour">Happy Hours</a>
      </div>
      <PintIndexPage />
    </>
  )
}
