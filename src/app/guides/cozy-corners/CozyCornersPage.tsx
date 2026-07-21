'use client'

import type { ReactNode } from 'react'
import FeaturePageShell from '@/components/FeaturePageShell'
import type { Pub } from '@/types/pub'
import RainyDay from '@/components/RainyDay'

export default function CozyCornersPage({ initialPubs, beforeContent }: { initialPubs?: Pub[]; beforeContent?: ReactNode }) {
  return (
    <FeaturePageShell initialPubs={initialPubs} beforeContent={beforeContent} breadcrumbs={[
      { label: 'Discover', href: '/discover' },
      { label: 'Cosy Corners' },
    ]}>
      {({ pubs, userLocation }) => (
        <RainyDay pubs={pubs} userLocation={userLocation} />
      )}
    </FeaturePageShell>
  )
}
