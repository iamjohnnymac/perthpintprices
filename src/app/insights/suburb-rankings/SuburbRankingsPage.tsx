'use client'

import FeaturePageShell from '@/components/FeaturePageShell'
import type { Pub } from '@/types/pub'
import SuburbLeague from '@/components/SuburbLeague'

export default function SuburbRankingsPage({ initialPubs }: { initialPubs?: Pub[] }) {
  return (
    <FeaturePageShell initialPubs={initialPubs} title="Perth Suburb Pint Rankings" breadcrumbs={[
      { label: 'Discover', href: '/discover' },
      { label: 'Suburb Rankings' },
    ]}>
      {({ pubs }) => (
        <SuburbLeague pubs={pubs} />
      )}
    </FeaturePageShell>
  )
}
