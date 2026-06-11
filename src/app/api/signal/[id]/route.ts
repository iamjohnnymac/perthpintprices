import { NextRequest, NextResponse } from 'next/server'
import { anonClient } from '@/lib/supabaseGateway'
import { isExpired, type Signal, type SignalAnswer } from '@/lib/signals'

export const dynamic = 'force-dynamic'
// Without this, Next's data cache memoises the supabase REST fetches and the
// 30s poll serves stale answers (answers appeared, then vanished on poll).
export const fetchCache = 'force-no-store'

/**
 * GET /api/signal/[id] — the answer page polls this every 30s for fresh
 * answers. Public read via the anon client (RLS allows select only).
 */
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = anonClient()

  const { data: signal, error: signalError } = await supabase
    .from('signals')
    .select('id, pub_slug, crew_name, lit_by, meet_at, expires_at, created_at')
    .eq('id', params.id)
    .single()

  if (signalError || !signal) {
    return NextResponse.json({ error: 'Signal not found' }, { status: 404 })
  }

  const { data: answers, error: answersError } = await supabase
    .from('signal_answers')
    .select('id, signal_id, name, answer, note, created_at')
    .eq('signal_id', params.id)
    .order('created_at', { ascending: true })

  if (answersError) {
    return NextResponse.json({ error: 'Could not load answers' }, { status: 500 })
  }

  return NextResponse.json({
    signal: signal as Signal,
    answers: (answers || []) as SignalAnswer[],
    expired: isExpired(signal as Signal),
  })
}
