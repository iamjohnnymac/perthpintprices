'use client'

import FeaturePageShell from '@/components/FeaturePageShell'
import TonightsMoves from '@/components/TonightsMoves'

export default function TonightsBestBetsPage() {
  return (
    <FeaturePageShell breadcrumbs={[
      { label: 'Insights', href: '/insights' },
      { label: "Tonight's Best Bets" },
    ]}>
      {({ pubs, userLocation }) => (
        <TonightsMoves pubs={pubs} userLocation={userLocation} />
      )}
    </FeaturePageShell>
  )
}
