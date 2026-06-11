import { NextRequest, NextResponse } from 'next/server'
import { serviceClient } from '@/lib/supabaseGateway'
import { generateSignalId } from '@/lib/signalId'
import { expiresAtFrom, isMeetAtInWindow } from '@/lib/signals'
import { hashRequestIp } from './ipHash'

// Max signals one IP can light per hour.
const RATE_LIMIT_PER_HOUR = 5

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const pubSlug = typeof body.pubSlug === 'string' ? body.pubSlug.trim() : ''
  const litBy = typeof body.litBy === 'string' ? body.litBy.trim() : ''
  const crewName = typeof body.crewName === 'string' ? body.crewName.trim().slice(0, 60) : null
  const meetAtRaw = typeof body.meetAt === 'string' ? body.meetAt : ''

  if (!pubSlug) {
    return NextResponse.json({ error: 'Pick a pub first.' }, { status: 400 })
  }
  if (litBy.length < 1 || litBy.length > 30) {
    return NextResponse.json({ error: 'Add your name (up to 30 characters).' }, { status: 400 })
  }

  const meetAt = new Date(meetAtRaw)
  const now = new Date()
  if (!Number.isFinite(meetAt.getTime())) {
    return NextResponse.json({ error: 'That meet time does not parse.' }, { status: 400 })
  }
  if (!isMeetAtInWindow(meetAt, now)) {
    return NextResponse.json({ error: 'Pick a time between now and tomorrow night.' }, { status: 400 })
  }

  // Construct the privileged client inside the handler — CI builds without the
  // service key, so doing this at import time would crash `next build`.
  let supabase
  try {
    supabase = serviceClient()
  } catch (err) {
    console.error('Signal route missing service client:', err)
    return NextResponse.json({ error: 'Signals are down right now. Try again shortly.' }, { status: 500 })
  }

  try {
    const { data: pub, error: pubError } = await supabase
      .from('pubs')
      .select('id, slug')
      .eq('slug', pubSlug)
      .single()

    if (pubError || !pub) {
      return NextResponse.json({ error: 'We do not know that pub.' }, { status: 404 })
    }

    const ipHash = hashRequestIp(req)
    const hourAgo = new Date(now.getTime() - 3600000).toISOString()
    const { data: recent } = await supabase
      .from('signals')
      .select('id')
      .eq('ip_hash', ipHash)
      .gte('created_at', hourAgo)

    if (recent && recent.length >= RATE_LIMIT_PER_HOUR) {
      return NextResponse.json({ error: 'You have lit enough signals for now. Try again in an hour.' }, { status: 429 })
    }

    const id = generateSignalId()
    const { error: insertError } = await supabase.from('signals').insert({
      id,
      pub_slug: pubSlug,
      crew_name: crewName || null,
      lit_by: litBy,
      meet_at: meetAt.toISOString(),
      expires_at: expiresAtFrom(meetAt).toISOString(),
      ip_hash: ipHash,
    })

    if (insertError) {
      console.error('Error inserting signal:', insertError)
      return NextResponse.json({ error: 'Could not light the signal. Try again.' }, { status: 500 })
    }

    // The lighter is automatically IN — no empty-room signals.
    const { error: answerError } = await supabase.from('signal_answers').insert({
      signal_id: id,
      name: litBy,
      answer: 'in',
      note: 'lit the signal',
      ip_hash: ipHash,
    })
    if (answerError) {
      console.error('Error inserting lighter answer:', answerError)
    }

    return NextResponse.json({ id })
  } catch (err) {
    console.error('Signal route error:', err)
    return NextResponse.json({ error: 'Could not light the signal. Try again.' }, { status: 500 })
  }
}
