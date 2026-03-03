import type { Metadata } from 'next'
import BreadcrumbJsonLd from '@/components/BreadcrumbJsonLd'
import TonightsBestBetsPage from './TonightsBestBetsPage'

export const metadata: Metadata = {
  title: "Tonight's Best Pints in Perth — Where to Drink Now | Arvo",
  description: "Find the cheapest pints in Perth right now. Live happy hour deals, tonight's best bets, and where to get the most value on your next round.",
  alternates: { canonical: 'https://perthpintprices.com/insights/tonights-best-bets' },
  openGraph: {
    title: "Tonight's Best Pints in Perth | Arvo",
    description: "Find the cheapest pints in Perth right now. Live happy hour deals and best value picks.",
    url: 'https://perthpintprices.com/insights/tonights-best-bets',
    type: 'website',
    siteName: 'Arvo',
  },
}

export default function Page() {
  return (
    <>
      <BreadcrumbJsonLd items={[
        { name: 'Home', url: 'https://perthpintprices.com' },
        { name: 'Insights', url: 'https://perthpintprices.com/insights' },
        { name: "Tonight's Best Bets" },
      ]} />
      <TonightsBestBetsPage />
    </>
  )
}
