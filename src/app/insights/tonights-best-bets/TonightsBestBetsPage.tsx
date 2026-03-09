'use client'

import FeaturePageShell from '@/components/FeaturePageShell'
import TonightsMoves from '@/components/TonightsMoves'

export default function TonightsBestBetsPage() {
  return (
    <FeaturePageShell title="Tonight's Best Pints in Perth" breadcrumbs={[
      { label: 'Insights', href: '/insights' },
      { label: "Tonight's Best Bets" },
    ]}>
      {({ pubs, userLocation }) => (
        <TonightsMoves pubs={pubs} userLocation={userLocation} />
      )}
    </FeaturePageShell>
  )
}
