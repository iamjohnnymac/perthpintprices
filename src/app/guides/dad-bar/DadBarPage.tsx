'use client'

import FeaturePageShell from '@/components/FeaturePageShell'
import type { Pub } from '@/types/pub'
import DadBar from '@/components/DadBar'

export default function DadBarPage({ initialPubs }: { initialPubs?: Pub[] }) {
  return (
    <FeaturePageShell initialPubs={initialPubs} title="Classic Perth Pubs for Dads" breadcrumbs={[
      { label: 'Discover', href: '/discover' },
      { label: 'The Dad Bar' },
    ]}>
      {({ pubs, userLocation }) => (
        <DadBar pubs={pubs} userLocation={userLocation} />
      )}
    </FeaturePageShell>
  )
}
