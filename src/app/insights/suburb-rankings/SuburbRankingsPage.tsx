'use client'

import FeaturePageShell from '@/components/FeaturePageShell'
import SuburbLeague from '@/components/SuburbLeague'

export default function SuburbRankingsPage() {
  return (
    <FeaturePageShell breadcrumbs={[
      { label: 'Insights', href: '/insights' },
      { label: 'Suburb Rankings' },
    ]}>
      {({ pubs }) => (
        <SuburbLeague pubs={pubs} />
      )}
    </FeaturePageShell>
  )
}
