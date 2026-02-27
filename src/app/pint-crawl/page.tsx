import { getPubs } from '@/lib/supabase'
import BreadcrumbJsonLd from '@/components/BreadcrumbJsonLd'
import PintCrawlClient from './PintCrawlClient'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: "Pint Crawl Perth — Plan Your Perfect Pub Crawl | Arvo",
  description: "Plan the perfect pub crawl in Perth. Set your budget, pick your stops, and get an optimized walking route with real pint prices from 300+ venues.",
  alternates: { canonical: 'https://perthpintprices.com/pint-crawl' },
  openGraph: {
    title: "Pint Crawl Perth — Plan Your Route | Arvo",
    description: "Plan your perfect Perth pub crawl with budget-aware route planning.",
    url: 'https://perthpintprices.com/pint-crawl',
    type: 'website',
    siteName: 'Arvo',
  }
}

export const revalidate = 3600

export default async function PintCrawlPage() {
  const pubs = await getPubs()
  return (
    <>
      <BreadcrumbJsonLd items={[
        { name: 'Home', url: 'https://perthpintprices.com' },
        { name: 'Pint Crawl' },
      ]} />
      <PintCrawlClient pubs={pubs} />
    </>
  )
}
