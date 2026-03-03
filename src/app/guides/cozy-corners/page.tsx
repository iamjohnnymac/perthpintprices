import type { Metadata } from 'next'
import BreadcrumbJsonLd from '@/components/BreadcrumbJsonLd'
import CozyCornersPage from './CozyCornersPage'

export const metadata: Metadata = {
  title: "Cozy Corners Perth — Best Rainy Day Pubs | Arvo",
  description: "When Perth's weather turns, these cozy pubs have you covered. Find warm, sheltered venues with fireplaces, covered areas, and comfort food.",
  alternates: { canonical: 'https://perthpintprices.com/guides/cozy-corners' },
  openGraph: {
    title: "Cozy Corners Perth — Best Rainy Day Pubs | Arvo",
    description: "Perth's cosiest pubs for rainy days. Warm, sheltered, and perfect for a pint.",
    url: 'https://perthpintprices.com/guides/cozy-corners',
    type: 'website',
    siteName: 'Arvo',
  },
}

export default function Page() {
  return (
    <>
      <BreadcrumbJsonLd items={[
        { name: 'Home', url: 'https://perthpintprices.com' },
        { name: 'Guides', url: 'https://perthpintprices.com/guides' },
        { name: 'Cozy Corners' },
      ]} />
      <CozyCornersPage />
    </>
  )
}
