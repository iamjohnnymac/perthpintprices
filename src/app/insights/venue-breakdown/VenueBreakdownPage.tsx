'use client'

import FeaturePageShell from '@/components/FeaturePageShell'
import VenueIntel from '@/components/VenueIntel'

export default function VenueBreakdownPage() {
  return (
    <FeaturePageShell title="Perth Pub Prices by Bracket" breadcrumbs={[
      { label: 'Insights', href: '/insights' },
      { label: 'Venue Breakdown' },
    ]}>
      {({ pubs, userLocation }) => (
        <VenueIntel pubs={pubs} userLocation={userLocation} />
      )}
    </FeaturePageShell>
  )
}
