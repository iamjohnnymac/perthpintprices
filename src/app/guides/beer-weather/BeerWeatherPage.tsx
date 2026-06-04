'use client'

import FeaturePageShell from '@/components/FeaturePageShell'
import BeerWeather from '@/components/BeerWeather'

export default function BeerWeatherPage() {
  return (
    <FeaturePageShell title="Beer Weather Perth" breadcrumbs={[
      { label: 'Discover', href: '/discover' },
      { label: 'Beer Weather' },
    ]}>
      {({ pubs, userLocation }) => (
        <BeerWeather pubs={pubs} userLocation={userLocation} />
      )}
    </FeaturePageShell>
  )
}
