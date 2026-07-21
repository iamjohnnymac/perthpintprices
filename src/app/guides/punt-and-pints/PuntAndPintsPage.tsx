'use client'

import type { ReactNode } from 'react'
import FeaturePageShell from '@/components/FeaturePageShell'
import type { Pub } from '@/types/pub'
import PuntNPints from '@/components/PuntNPints'

export default function PuntAndPintsPage({ initialPubs, beforeContent }: { initialPubs?: Pub[]; beforeContent?: ReactNode }) {
  return (
    <FeaturePageShell initialPubs={initialPubs} beforeContent={beforeContent} breadcrumbs={[
      { label: 'Discover', href: '/discover' },
      { label: 'Punt & Pints' },
    ]}>
      {({ pubs, userLocation }) => (
        <PuntNPints pubs={pubs} userLocation={userLocation} />
      )}
    </FeaturePageShell>
  )
}
