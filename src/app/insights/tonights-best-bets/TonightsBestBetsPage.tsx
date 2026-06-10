'use client'

import FeaturePageShell from '@/components/FeaturePageShell'
import type { Pub } from '@/types/pub'
import TonightsMoves from '@/components/TonightsMoves'

export default function TonightsBestBetsPage({ initialPubs }: { initialPubs?: Pub[] }) {
  return (
    <FeaturePageShell initialPubs={initialPubs} title="Tonight's Best Pints in Perth" breadcrumbs={[
      { label: 'Discover', href: '/discover' },
      { label: "Tonight's Best Bets" },
    ]}>
      {({ pubs, userLocation }) => (
        <TonightsMoves pubs={pubs} userLocation={userLocation} />
      )}
    </FeaturePageShell>
  )
}
