import { NextRequest, NextResponse } from 'next/server'
import { serviceClient } from '@/lib/supabaseGateway'
import { isExpired } from '@/lib/signals'
import { hashRequestIp } from '../../ipHash'

// Max answers one IP can post per hour (across all signals).
const RATE_LIMIT_PER_HOUR = 10

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const name = typeof body.name === 'string' ? body.name.trim() : ''
  const answer = body.answer
  const note = typeof body.note === 'string' ? body.note.trim().slice(0, 60) : null

  if (name.length < 1 || name.length > 30) {
    return NextResponse.json({ error: 'Add your name (up to 30 characters).' }, { status: 400 })
  }
  if (answer !== 'in' && answer !== 'out') {
    return NextResponse.json({ error: 'Answer must be in or out.' }, { status: 400 })
  }

  // Construct the privileged client inside the handler — never at import time.
  let supabase
  try {
    supabase = serviceClient()
  } catch (err) {
    console.error('Signal answer route missing service client:', err)
    return NextResponse.json({ error: 'Signals are down right now. Try again shortly.' }, { status: 500 })
  }

  try {
    const { data: signal, error: signalError } = await supabase
      .from('signals')
      .select('id, expires_at')
      .eq('id', params.id)
      .single()

    if (signalError || !signal || isExpired(signal)) {
      return NextResponse.json({ error: 'This signal burned out.' }, { status: 410 })
    }

    const ipHash = hashRequestIp(req)
    const hourAgo = new Date(Date.now() - 3600000).toISOString()
    const { data: recent } = await supabase
      .from('signal_answers')
      .select('id')
      .eq('ip_hash', ipHash)
      .gte('created_at', hourAgo)

    if (recent && recent.length >= RATE_LIMIT_PER_HOUR) {
      return NextResponse.json({ error: 'Too many answers from here. Try again in an hour.' }, { status: 429 })
    }

    // One answer per person (per ip_hash) per signal — re-answering replaces
    // the earlier row rather than stacking duplicates.
    await supabase
      .from('signal_answers')
      .delete()
      .eq('signal_id', params.id)
      .eq('ip_hash', ipHash)

    const { error: insertError } = await supabase.from('signal_answers').insert({
      signal_id: params.id,
      name,
      answer,
      note: note || null,
      ip_hash: ipHash,
    })

    if (insertError) {
      console.error('Error inserting signal answer:', insertError)
      return NextResponse.json({ error: 'Could not save your answer. Try again.' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Signal answer route error:', err)
    return NextResponse.json({ error: 'Could not save your answer. Try again.' }, { status: 500 })
  }
}
