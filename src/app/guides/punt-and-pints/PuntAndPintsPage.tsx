'use client'

import FeaturePageShell from '@/components/FeaturePageShell'
import PuntNPints from '@/components/PuntNPints'

export default function PuntAndPintsPage() {
  return (
    <FeaturePageShell title="Perth Pubs with TAB Facilities" breadcrumbs={[
      { label: 'Discover', href: '/discover' },
      { label: 'Punt & Pints' },
    ]}>
      {({ pubs, userLocation }) => (
        <PuntNPints pubs={pubs} userLocation={userLocation} />
      )}
    </FeaturePageShell>
  )
}
