import { Metadata } from 'next'
import { getAllSuburbs } from '@/lib/supabase'
import BreadcrumbJsonLd from '@/components/BreadcrumbJsonLd'
import SuburbsClient from './SuburbsClient'

export const metadata: Metadata = {
  title: 'All Suburbs | Arvo',
  description: 'Browse pint prices across every Perth suburb. Find the cheapest pints near you.',
  alternates: { canonical: 'https://perthpintprices.com/suburbs' },
}

export const revalidate = 300

export default async function SuburbsPage() {
  const suburbs = await getAllSuburbs()
  return (
    <>
      <BreadcrumbJsonLd items={[
        { name: 'Home', url: 'https://perthpintprices.com' },
        { name: 'All Suburbs' },
      ]} />
      <SuburbsClient suburbs={suburbs} />
    </>
  )
}
