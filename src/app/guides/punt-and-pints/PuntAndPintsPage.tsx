'use client'

import FeaturePageShell from '@/components/FeaturePageShell'
import type { Pub } from '@/types/pub'
import PuntNPints from '@/components/PuntNPints'

export default function PuntAndPintsPage({ initialPubs }: { initialPubs?: Pub[] }) {
  return (
    <FeaturePageShell initialPubs={initialPubs} breadcrumbs={[
      { label: 'Discover', href: '/discover' },
      { label: 'Punt & Pints' },
    ]}>
      {({ pubs, userLocation }) => (
        <PuntNPints pubs={pubs} userLocation={userLocation} />
      )}
    </FeaturePageShell>
  )
}
