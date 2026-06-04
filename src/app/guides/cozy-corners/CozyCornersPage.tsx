'use client'

import FeaturePageShell from '@/components/FeaturePageShell'
import RainyDay from '@/components/RainyDay'

export default function CozyCornersPage() {
  return (
    <FeaturePageShell title="Cosy Corners Perth" breadcrumbs={[
      { label: 'Discover', href: '/discover' },
      { label: 'Cosy Corners' },
    ]}>
      {({ pubs, userLocation }) => (
        <RainyDay pubs={pubs} userLocation={userLocation} />
      )}
    </FeaturePageShell>
  )
}
