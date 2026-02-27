import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Guides — Curated Perth Pub Picks | Arvo',
  description: 'Beer weather picks, sunset sippers, dad-friendly pubs, and more curated guides for Perth pub-goers.',
  openGraph: {
    title: 'Curated Perth Pub Guides | Arvo',
    description: 'Beer weather picks, sunset sippers, dad-friendly pubs, and more curated guides.',
    type: 'website',
    siteName: 'Arvo',
  },
}

export default function GuidesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
