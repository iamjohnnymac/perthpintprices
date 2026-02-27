'use client'

import FeaturePageShell from '@/components/FeaturePageShell'
import VenueIntel from '@/components/VenueIntel'

export default function VenueBreakdownPage() {
  return (
    <FeaturePageShell breadcrumbs={[
      { label: 'Insights', href: '/insights' },
      { label: 'Venue Breakdown' },
    ]}>
      {({ pubs, userLocation }) => (
        <VenueIntel pubs={pubs} userLocation={userLocation} />
      )}
    </FeaturePageShell>
  )
}
