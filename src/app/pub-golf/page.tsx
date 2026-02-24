import { getPubs } from '@/lib/supabase'
import PubGolfClient from './PubGolfClient'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: "Pub Golf — Arvo",
  description: "Play pub golf across Perth's best pubs. Pick a course, track your scores, and see how much your round costs.",
  openGraph: {
    title: "Pub Golf — Arvo",
    description: "Play pub golf across Perth's best pubs with real pint prices.",
  }
}

export const revalidate = 3600

export default async function PubGolfPage() {
  const pubs = await getPubs()
  return <PubGolfClient pubs={pubs} />
}
