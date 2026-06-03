import type { Metadata } from 'next'
import TransportHubPage from '@/components/TransportHubPage'
import { requireTransportHub } from '@/lib/transportHubs'
import { BASE_URL } from '@/lib/urls'

const hub = requireTransportHub('pubs-near-elizabeth-quay')

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Pubs Near Elizabeth Quay',
  description: 'Pubs near Elizabeth Quay, ranked by direct proximity with verified pint prices where Perth Pint Prices has a checked row.',
  alternates: { canonical: `${BASE_URL}/${hub.slug}` },
  openGraph: {
    title: 'Pubs Near Elizabeth Quay | Perth Pint Prices',
    description: 'Nearby Elizabeth Quay pubs with direct-distance notes and checked pint prices where available.',
    url: `${BASE_URL}/${hub.slug}`,
    type: 'website',
    siteName: 'Perth Pint Prices',
    locale: 'en_AU',
    images: [{ url: `${BASE_URL}/og-image.png`, width: 1200, height: 630, alt: 'Perth Pint Prices' }],
  },
  twitter: { card: 'summary_large_image' },
}

export default function PubsNearElizabethQuayPage() {
  return <TransportHubPage hub={hub} />
}
