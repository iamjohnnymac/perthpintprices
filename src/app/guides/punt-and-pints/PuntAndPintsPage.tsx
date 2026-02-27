'use client'

import FeaturePageShell from '@/components/FeaturePageShell'
import PuntNPints from '@/components/PuntNPints'

export default function PuntAndPintsPage() {
  return (
    <FeaturePageShell breadcrumbs={[
      { label: 'Guides', href: '/guides' },
      { label: 'Punt & Pints' },
    ]}>
      {({ pubs, userLocation }) => (
        <PuntNPints pubs={pubs} userLocation={userLocation} />
      )}
    </FeaturePageShell>
  )
}
