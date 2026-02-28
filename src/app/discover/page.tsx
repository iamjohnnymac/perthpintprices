import { Metadata } from 'next'
import DiscoverClient from './DiscoverClient'

export const metadata: Metadata = {
  title: 'Discover — Perth Pint Guides, Stats & Pub Picks | Arvo',
  description: 'Live pint data, suburb rankings, sunset spots, dad bars, and more. Everything beyond the price table.',
}

export default function DiscoverPage() {
  return <DiscoverClient />
}
