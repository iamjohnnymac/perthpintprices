'use client'

import FeaturePageShell from '@/components/FeaturePageShell'
import DadBar from '@/components/DadBar'

export default function DadBarPage() {
  return (
    <FeaturePageShell title="Classic Perth Pubs for Dads" breadcrumbs={[
      { label: 'Guides', href: '/guides' },
      { label: 'The Dad Bar' },
    ]}>
      {({ pubs, userLocation }) => (
        <DadBar pubs={pubs} userLocation={userLocation} />
      )}
    </FeaturePageShell>
  )
}
