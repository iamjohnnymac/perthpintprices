'use client'

import FeaturePageShell from '@/components/FeaturePageShell'
import type { Pub } from '@/types/pub'
import VenueIntel from '@/components/VenueIntel'

export default function VenueBreakdownPage({ initialPubs }: { initialPubs?: Pub[] }) {
  return (
    <FeaturePageShell initialPubs={initialPubs} title="Perth Pub Prices by Bracket" breadcrumbs={[
      { label: 'Discover', href: '/discover' },
      { label: 'Venue Breakdown' },
    ]}>
      {({ pubs, userLocation }) => (
        <VenueIntel pubs={pubs} userLocation={userLocation} />
      )}
    </FeaturePageShell>
  )
}
