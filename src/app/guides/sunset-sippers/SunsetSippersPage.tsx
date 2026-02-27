'use client'

import FeaturePageShell from '@/components/FeaturePageShell'
import SunsetSippers from '@/components/SunsetSippers'

export default function SunsetSippersPage() {
  return (
    <FeaturePageShell breadcrumbs={[
      { label: 'Guides', href: '/guides' },
      { label: 'Sunset Sippers' },
    ]}>
      {({ pubs, userLocation }) => (
        <SunsetSippers pubs={pubs} userLocation={userLocation} />
      )}
    </FeaturePageShell>
  )
}
