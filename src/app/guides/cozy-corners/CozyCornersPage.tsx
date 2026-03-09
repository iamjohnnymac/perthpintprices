'use client'

import FeaturePageShell from '@/components/FeaturePageShell'
import RainyDay from '@/components/RainyDay'

export default function CozyCornersPage() {
  return (
    <FeaturePageShell title="Cozy Corners Perth" breadcrumbs={[
      { label: 'Guides', href: '/guides' },
      { label: 'Cozy Corners' },
    ]}>
      {({ pubs, userLocation }) => (
        <RainyDay pubs={pubs} userLocation={userLocation} />
      )}
    </FeaturePageShell>
  )
}
