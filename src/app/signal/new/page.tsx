import type { Metadata } from 'next'
import { getCachedPubs } from '@/lib/cachedPubs'
import { slimPubForList } from '@/lib/pubPhoto'
import NewSignalClient from './NewSignalClient'

export const metadata: Metadata = {
  title: 'Light a Pint Signal',
  description: 'Pick the pub, pick the time, send the link. The crew answers before it burns out.',
  robots: { index: false, follow: false },
}

export const revalidate = 300

export default async function NewSignalPage() {
  const pubs = (await getCachedPubs()).map(slimPubForList)

  return <NewSignalClient pubs={pubs} />
}
