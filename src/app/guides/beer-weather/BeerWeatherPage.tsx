'use client'

import FeaturePageShell from '@/components/FeaturePageShell'
import type { Pub } from '@/types/pub'
import BeerWeather from '@/components/BeerWeather'

export default function BeerWeatherPage({ initialPubs }: { initialPubs?: Pub[] }) {
  return (
    <FeaturePageShell
      initialPubs={initialPubs}
      title="Beer Weather Perth"
      intro="Today's forecast matched to the right pub — beer gardens and rooftops when the sun's out, a roof and a fireplace when it's bucketing down. Live weather, with the pint prices left in."
      breadcrumbs={[
        { label: 'Discover', href: '/discover' },
        { label: 'Beer Weather' },
      ]}>
      {({ pubs, userLocation }) => (
        <BeerWeather pubs={pubs} userLocation={userLocation} />
      )}
    </FeaturePageShell>
  )
}
