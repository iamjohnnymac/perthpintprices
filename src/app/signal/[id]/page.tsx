import type { Metadata } from 'next'
import { anonClient } from '@/lib/supabaseGateway'
import { getHappyHourStatus } from '@/lib/happyHourLive'
import {
  formatClockLabel,
  formatMeetTimeLabel,
  isExpired,
  shortPubName,
  type Signal,
  type SignalAnswer,
} from '@/lib/signals'
import SignalClient, { type SignalView } from './SignalClient'

// Signals are live, semi-private objects — never cache, never index.
export const dynamic = 'force-dynamic'

interface SignalPub {
  name: string
  slug: string
  suburb: string | null
  address: string | null
  price: number | null
  happy_hour_price: number | null
  happy_hour_days: string | null
  happy_hour_start: string | null
  happy_hour_end: string | null
}

async function fetchSignal(id: string): Promise<Signal | null> {
  try {
    const { data, error } = await anonClient()
      .from('signals')
      .select('id, pub_slug, crew_name, lit_by, meet_at, expires_at, created_at')
      .eq('id', id)
      .single()
    // Any error (including "relation does not exist" before the schema is
    // applied) degrades to the not-found state.
    if (error || !data) return null
    return data as Signal
  } catch {
    return null
  }
}

async function fetchAnswers(id: string): Promise<SignalAnswer[]> {
  try {
    const { data, error } = await anonClient()
      .from('signal_answers')
      .select('id, signal_id, name, answer, note, created_at')
      .eq('signal_id', id)
      .order('created_at', { ascending: true })
    if (error || !data) return []
    return data as SignalAnswer[]
  } catch {
    return []
  }
}

async function fetchPub(slug: string): Promise<SignalPub | null> {
  try {
    const { data, error } = await anonClient()
      .from('pubs')
      .select('name, slug, suburb, address, price, happy_hour_price, happy_hour_days, happy_hour_start, happy_hour_end')
      .eq('slug', slug)
      .single()
    if (error || !data) return null
    return data as SignalPub
  } catch {
    return null
  }
}

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const signal = await fetchSignal(params.id)
  const pub = signal ? await fetchPub(signal.pub_slug) : null
  const title = signal
    ? `Pint Signal — ${pub?.name || signal.pub_slug} ${formatMeetTimeLabel(signal.meet_at)}`
    : 'Pint Signal'
  return {
    title,
    description: 'One mate lit the signal. Answer it before it burns out.',
    robots: { index: false, follow: false },
  }
}

export default async function SignalPage({ params }: { params: { id: string } }) {
  const signal = await fetchSignal(params.id)

  if (!signal) {
    return <SignalClient view={null} initialAnswers={[]} state="missing" />
  }

  const [answers, pub] = await Promise.all([
    fetchAnswers(signal.id),
    fetchPub(signal.pub_slug),
  ])

  const meetAt = new Date(signal.meet_at)
  const price = pub?.price != null ? Number(pub.price) : null
  const hhPrice = pub?.happy_hour_price != null ? Number(pub.happy_hour_price) : null

  // Only pitch the happy hour when it actually covers the meet time.
  let hhLine: string | null = null
  if (pub && hhPrice != null && Number.isFinite(meetAt.getTime())) {
    const hhAtMeet = getHappyHourStatus({
      price,
      happyHourPrice: hhPrice,
      happyHourDays: pub.happy_hour_days,
      happyHourStart: pub.happy_hour_start,
      happyHourEnd: pub.happy_hour_end,
    }, meetAt)
    const endLabel = formatClockLabel(pub.happy_hour_end)
    if (hhAtMeet.isActive && endLabel) {
      hhLine = `$${hhPrice.toFixed(2)} till ${endLabel}`
    }
  }

  const view: SignalView = {
    id: signal.id,
    pubName: pub?.name || signal.pub_slug,
    pubShortName: shortPubName(pub?.name || signal.pub_slug),
    suburb: pub?.suburb || null,
    crewName: signal.crew_name,
    litBy: signal.lit_by,
    meetLabel: formatMeetTimeLabel(signal.meet_at),
    meetAt: signal.meet_at,
    expiresAt: signal.expires_at,
    priceLine: price != null ? `$${price.toFixed(2)} pints` : null,
    hhLine,
  }

  return (
    <SignalClient
      view={view}
      initialAnswers={answers}
      state={isExpired(signal) ? 'expired' : 'live'}
    />
  )
}
