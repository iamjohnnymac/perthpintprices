import BreadcrumbJsonLd from '@/components/BreadcrumbJsonLd'
import LeaderboardClient from './LeaderboardClient'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: "Price Scout Leaderboard — Top Perth Pint Reporters | Arvo",
  description: "Perth's top price reporters helping keep Arvo accurate. Report pint prices to climb the leaderboard and earn bragging rights!",
  alternates: { canonical: 'https://perthpintprices.com/leaderboard' },
  openGraph: {
    title: "Price Scout Leaderboard — Top Perth Pint Reporters | Arvo",
    description: "Perth's top price reporters helping keep Arvo accurate. Report pint prices to climb the leaderboard!",
    url: 'https://perthpintprices.com/leaderboard',
    type: 'website',
    siteName: 'Arvo',
  },
}

export default function LeaderboardPage() {
  return (
    <>
      <BreadcrumbJsonLd items={[
        { name: 'Home', url: 'https://perthpintprices.com' },
        { name: 'Leaderboard' },
      ]} />
      <LeaderboardClient />
    </>
  )
}
