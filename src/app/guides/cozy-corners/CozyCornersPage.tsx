'use client'

import FeaturePageShell from '@/components/FeaturePageShell'
import type { Pub } from '@/types/pub'
import RainyDay from '@/components/RainyDay'

export default function CozyCornersPage({ initialPubs }: { initialPubs?: Pub[] }) {
  return (
    <FeaturePageShell initialPubs={initialPubs} breadcrumbs={[
      { label: 'Discover', href: '/discover' },
      { label: 'Cosy Corners' },
    ]}>
      {({ pubs, userLocation }) => (
        <RainyDay pubs={pubs} userLocation={userLocation} />
      )}
    </FeaturePageShell>
  )
}
