import LeaderboardClient from './LeaderboardClient'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: "Price Scout Leaderboard — Arvo",
  description: "Perth's top price reporters helping keep Arvo accurate. Report pint prices to climb the leaderboard!",
  openGraph: {
    title: "Price Scout Leaderboard — Arvo",
    description: "Perth's top price reporters helping keep Arvo accurate. Report pint prices to climb the leaderboard!",
    type: 'website',
    siteName: 'Arvo',
  },
}

export default function LeaderboardPage() {
  return <LeaderboardClient />
}
