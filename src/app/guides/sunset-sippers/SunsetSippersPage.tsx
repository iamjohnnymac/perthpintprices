'use client'

import FeaturePageShell from '@/components/FeaturePageShell'
import type { Pub } from '@/types/pub'
import SunsetSippers from '@/components/SunsetSippers'

export default function SunsetSippersPage({ initialPubs }: { initialPubs?: Pub[] }) {
  return (
    <FeaturePageShell initialPubs={initialPubs} breadcrumbs={[
      { label: 'Discover', href: '/discover' },
      { label: 'Sunset Sippers' },
    ]}>
      {({ pubs, userLocation }) => (
        <SunsetSippers pubs={pubs} userLocation={userLocation} />
      )}
    </FeaturePageShell>
  )
}
