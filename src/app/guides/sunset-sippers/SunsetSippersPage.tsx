'use client'

import type { ReactNode } from 'react'
import FeaturePageShell from '@/components/FeaturePageShell'
import type { Pub } from '@/types/pub'
import SunsetSippers from '@/components/SunsetSippers'

export default function SunsetSippersPage({ initialPubs, beforeContent }: { initialPubs?: Pub[]; beforeContent?: ReactNode }) {
  return (
    <FeaturePageShell initialPubs={initialPubs} beforeContent={beforeContent} breadcrumbs={[
      { label: 'Discover', href: '/discover' },
      { label: 'Sunset Sippers' },
    ]}>
      {({ pubs, userLocation }) => (
        <SunsetSippers pubs={pubs} userLocation={userLocation} />
      )}
    </FeaturePageShell>
  )
}
