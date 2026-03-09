import { Suspense } from 'react'
import { getPubs } from '@/lib/supabase'
import BreadcrumbJsonLd from '@/components/BreadcrumbJsonLd'
import PintCrawlClient from './PintCrawlClient'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: "Pint Crawl Perth: Plan Your Pub Crawl | Arvo",
  description: "Plan a pub crawl in Perth. Set your budget, pick your stops, and get a walking route with real pint prices from 300+ venues.",
  alternates: { canonical: 'https://perthpintprices.com/pint-crawl' },
  openGraph: {
    title: "Pint Crawl Perth | Arvo",
    description: "Plan a Perth pub crawl with budget-aware route planning.",
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
      <Suspense fallback={
        <div className="min-h-screen bg-[#FDF8F0] flex items-center justify-center">
          <p className="font-mono text-gray-mid animate-pulse text-sm">Loading crawl planner...</p>
        </div>
      }>
        <PintCrawlClient pubs={pubs} />
      </Suspense>
    </>
  )
}
