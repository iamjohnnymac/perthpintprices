import type { Metadata } from 'next'
import BreadcrumbJsonLd from '@/components/BreadcrumbJsonLd'
import TonightsBestBetsPage from './TonightsBestBetsPage'

export const metadata: Metadata = {
  title: "Tonight's Best Pints in Perth | Arvo",
  description: "Find the cheapest pints in Perth right now. Live happy hour deals, tonight's best bets, and where to get the most value on your next round.",
  alternates: { canonical: 'https://perthpintprices.com/insights/tonights-best-bets' },
  openGraph: {
    title: "Tonight's Best Pints in Perth | Arvo",
    description: "Find the cheapest pints in Perth right now. Live happy hour deals and best value picks.",
    url: 'https://perthpintprices.com/insights/tonights-best-bets',
    type: 'website',
    siteName: 'Arvo',
    locale: 'en_AU',
    images: [{ url: 'https://perthpintprices.com/og-image.png', width: 1200, height: 630, alt: 'Tonight\'s Best Pints in Perth' }],
  },
  twitter: { card: 'summary_large_image' },
}

export default function Page() {
  return (
    <>
      <BreadcrumbJsonLd items={[
        { name: 'Home', url: 'https://perthpintprices.com' },
        { name: 'Discover', url: 'https://perthpintprices.com/discover' },
        { name: "Tonight's Best Bets", url: 'https://perthpintprices.com/insights/tonights-best-bets' },
      ]} />
      <div className="sr-only" aria-hidden="true">
        <h1>Tonight&#39;s Best Pints in Perth</h1>
        <p>Find the cheapest pints available in Perth right now. Live happy hour deals, tonight&#39;s best value picks, and real-time pricing across 300+ Perth venues.</p>
        <a href="/">Home</a>
        <a href="/discover">Discover</a>
        <a href="/happy-hour">Happy Hours</a>
      </div>
      <TonightsBestBetsPage />
    </>
  )
}
