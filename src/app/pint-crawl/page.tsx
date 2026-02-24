import { getPubs } from '@/lib/supabase'
import PintCrawlClient from './PintCrawlClient'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: "Pint Crawl — Arvo",
  description: "Plan the perfect pub crawl in Perth. Set your budget, pick your stops, and get an optimized walking route with real pint prices.",
  openGraph: {
    title: "Pint Crawl — Arvo",
    description: "Plan your perfect Perth pub crawl with budget-aware route planning.",
  }
}

export const revalidate = 3600

export default async function PintCrawlPage() {
  const pubs = await getPubs()
  return <PintCrawlClient pubs={pubs} />
}
