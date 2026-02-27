import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Guides — Curated Perth Pub Picks for Every Occasion | Arvo',
  description: "Perth's best pub guides: beer weather picks, sunset spots, dad-friendly pubs, TAB venues, rainy day refuges, and more. Curated for every occasion.",
  alternates: { canonical: 'https://perthpintprices.com/guides' },
  openGraph: {
    title: 'Curated Perth Pub Guides | Arvo',
    description: "Beer weather picks, sunset spots, dad-friendly pubs, and more curated guides.",
    type: 'website',
    siteName: 'Arvo',
  },
}

export default function GuidesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
