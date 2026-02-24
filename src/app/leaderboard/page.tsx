import LeaderboardClient from './LeaderboardClient'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: "Price Scout Leaderboard — PintDex",
  description: "Perth's top price reporters helping keep PintDex accurate. Report pint prices to climb the leaderboard!",
}

export default function LeaderboardPage() {
  return <LeaderboardClient />
}
