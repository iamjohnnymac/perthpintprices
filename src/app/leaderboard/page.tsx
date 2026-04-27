import BreadcrumbJsonLd from '@/components/BreadcrumbJsonLd'
import LeaderboardClient from './LeaderboardClient'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Price Scout Leaderboard: Perth Pint Reporters',
  description: "Perth's top price reporters helping keep Perth Pint Prices accurate. Report pint prices to climb the leaderboard and earn bragging rights!",
  alternates: { canonical: 'https://perthpintprices.com/leaderboard' },
  openGraph: {
    title: 'Price Scout Leaderboard | Perth Pint Prices',
    description: "Perth's top price reporters helping keep Perth Pint Prices accurate. Report pint prices to climb the leaderboard!",
    url: 'https://perthpintprices.com/leaderboard',
    type: 'website',
    siteName: 'Perth Pint Prices',
    locale: 'en_AU',
    images: [{ url: 'https://perthpintprices.com/og-image.png', width: 1200, height: 630, alt: 'Price Scout Leaderboard | Perth Pint Prices' }],
  },
  twitter: { card: 'summary_large_image' },
}

export default function LeaderboardPage() {
  return (
    <>
      <BreadcrumbJsonLd items={[
        { name: 'Home', url: 'https://perthpintprices.com' },
        { name: 'Leaderboard', url: 'https://perthpintprices.com/leaderboard' },
      ]} />
      <LeaderboardClient />
    </>
  )
}
