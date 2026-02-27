import type { Metadata } from 'next'
import BreadcrumbJsonLd from '@/components/BreadcrumbJsonLd'
import DadBarPage from './DadBarPage'

export const metadata: Metadata = {
  title: "The Dad Bar — Classic Perth Pubs for Dads | Arvo",
  description: "No craft cocktails, no pretentious menus. Just honest Perth pubs where dads can enjoy a cold pint in peace. Kid-friendly spots included.",
  alternates: { canonical: 'https://perthpintprices.com/guides/dad-bar' },
  openGraph: {
    title: "The Dad Bar — Classic Perth Pubs for Dads | Arvo",
    description: "Honest Perth pubs where dads can enjoy a cold pint in peace.",
    url: 'https://perthpintprices.com/guides/dad-bar',
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
        { name: 'The Dad Bar' },
      ]} />
      <DadBarPage />
    </>
  )
}
