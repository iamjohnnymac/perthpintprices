import type { Metadata } from 'next'
import BreadcrumbJsonLd from '@/components/BreadcrumbJsonLd'
import { getCachedPubs } from '@/lib/cachedPubs'
import { slimPubForFeature } from '@/lib/pubPhoto'
import TonightsBestBetsPage from './TonightsBestBetsPage'
import Link from 'next/link'

export const metadata: Metadata = {
  title: "Tonight's Best Pints in Perth",
  description: "The cheapest pints and live happy hours in Perth right now, updating as the night moves — what's on, what it costs, and where.",
  alternates: { canonical: 'https://perthpintprices.com/insights/tonights-best-bets' },
  openGraph: {
    title: "Tonight's Best Pints in Perth | Perth Pint Prices",
    description: "Find the cheapest pints in Perth right now. Live happy hour deals and best value picks.",
    url: 'https://perthpintprices.com/insights/tonights-best-bets',
    type: 'website',
    siteName: 'Perth Pint Prices',
    locale: 'en_AU',
    images: [{ url: 'https://perthpintprices.com/og-image.png', width: 1200, height: 630, alt: 'Tonight\'s Best Pints in Perth' }],
  },
  twitter: { card: 'summary_large_image' },
}

export const revalidate = 300

export default async function Page() {
  // Server-fetch so the page content ships in the initial HTML instead of
  // spinning while the browser round-trips to Supabase. Slimmed to keep the
  // serialised payload under crawl limits.
  const initialPubs = (await getCachedPubs()).map(slimPubForFeature)

  return (
    <>
      <BreadcrumbJsonLd items={[
        { name: 'Home', url: 'https://perthpintprices.com' },
        { name: 'Discover', url: 'https://perthpintprices.com/discover' },
        { name: "Tonight's Best Bets", url: 'https://perthpintprices.com/insights/tonights-best-bets' },
      ]} />
      <div className="sr-only" aria-hidden="true">
        <p>The cheapest pints and live happy hours in Perth right now. What&#39;s on, what the pint costs, and where — updated as the night moves.</p>
        <Link href="/">Home</Link>
        <Link href="/discover">Discover</Link>
        <Link href="/happy-hour">Happy Hours</Link>
      </div>
      <TonightsBestBetsPage initialPubs={initialPubs} />
    </>
  )
}
