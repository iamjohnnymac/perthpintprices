import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Perth Pub Guides: Weather, Sunsets, Dad Bars & More',
  description: "Perth pub guides for every mood. Beer weather picks, sunset spots, dad-friendly pubs, TAB venues, rainy day refuges, and more.",
  alternates: { canonical: 'https://perthpintprices.com/guides' },
  openGraph: {
    title: 'Perth Pub Guides | Perth Pint Prices',
    description: "Beer weather picks, sunset spots, dad-friendly pubs, and more.",
    type: 'website',
    siteName: 'Perth Pint Prices',
  },
}

export default function GuidesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
