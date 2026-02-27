'use client'

import FeaturePageShell from '@/components/FeaturePageShell'
import BeerWeather from '@/components/BeerWeather'

export default function BeerWeatherPage() {
  return (
    <FeaturePageShell breadcrumbs={[
      { label: 'Guides', href: '/guides' },
      { label: 'Beer Weather' },
    ]}>
      {({ pubs, userLocation }) => (
        <BeerWeather pubs={pubs} userLocation={userLocation} />
      )}
    </FeaturePageShell>
  )
}
