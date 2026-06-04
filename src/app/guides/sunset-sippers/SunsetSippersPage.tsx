'use client'

import FeaturePageShell from '@/components/FeaturePageShell'
import SunsetSippers from '@/components/SunsetSippers'

export default function SunsetSippersPage() {
  return (
    <FeaturePageShell title="Sunset Sippers Perth" breadcrumbs={[
      { label: 'Discover', href: '/discover' },
      { label: 'Sunset Sippers' },
    ]}>
      {({ pubs, userLocation }) => (
        <SunsetSippers pubs={pubs} userLocation={userLocation} />
      )}
    </FeaturePageShell>
  )
}
