import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Kicks off a batch outbound sweep via ElevenLabs Batch Calling. Pulls pubs
// with a phone number and no verified price, builds per-recipient dynamic
// variables (pub name/suburb/slug), and submits a single batch scheduled for
// the next valid window.
//
// Protected by AGENT_WEBHOOK_SECRET — either send it as the `x-agent-secret`
// header or pass ?key=<secret> as a query string.
//
// Request body (optional):
//   { limit?: number, scheduled_time_unix?: number, dry_run?: boolean }

interface KickoffBody {
  limit?: number
  scheduled_time_unix?: number
  dry_run?: boolean
}

export async function POST(req: NextRequest) {
  const secret = process.env.AGENT_WEBHOOK_SECRET
  if (!secret) return NextResponse.json({ ok: false, error: 'server misconfigured' }, { status: 500 })

  const provided = req.headers.get('x-agent-secret') || req.nextUrl.searchParams.get('key')
  if (provided !== secret) {
    return NextResponse.json({ ok: false, error: 'unauthorised' }, { status: 401 })
  }

  const body: KickoffBody = await req.json().catch(() => ({}))

  const agentId = process.env.ELEVENLABS_AGENT_ID
  const phoneNumberId = process.env.ELEVENLABS_PHONE_NUMBER_ID
  const xiKey = process.env.ELEVENLABS_API_KEY
  if (!agentId || !phoneNumberId || !xiKey) {
    return NextResponse.json(
      { ok: false, error: 'missing ELEVENLABS_AGENT_ID / ELEVENLABS_PHONE_NUMBER_ID / ELEVENLABS_API_KEY' },
      { status: 500 }
    )
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ifxkoblvgttelzboenpi.supabase.co',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  )

  // Eligible pubs: have a phone, no verified price (we don't re-call verified pubs).
  const { data: pubs, error } = await supabase
    .from('pubs')
    .select('id, name, slug, suburb, phone, price, price_verified')
    .not('phone', 'is', null)
    .or('price.is.null,price_verified.eq.false')
    .order('id')

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })

  const limit = body.limit ?? 200
  const shortlist = pubs.slice(0, limit)

  const recipients = shortlist
    .map((p) => {
      const e164 = toE164(p.phone!)
      if (!e164) return null
      return {
        phone_number: e164,
        conversation_initiation_client_data: {
          dynamic_variables: {
            pub_slug: p.slug,
            pub_name: p.name,
            suburb: p.suburb || 'Perth',
            last_price: p.price ? `$${Number(p.price).toFixed(2)}` : '',
          },
        },
      }
    })
    .filter((r): r is NonNullable<typeof r> => r != null)

  if (body.dry_run) {
    return NextResponse.json({
      ok: true,
      dry_run: true,
      would_call: recipients.length,
      first_10: recipients.slice(0, 10).map((r) => ({
        phone: r.phone_number,
        pub: r.conversation_initiation_client_data.dynamic_variables.pub_name,
      })),
    })
  }

  const submitBody = {
    call_name: `Pint Sweep — ${new Date().toISOString().slice(0, 16)}`,
    agent_id: agentId,
    agent_phone_number_id: phoneNumberId,
    recipients,
    // Default: schedule for 2pm AWST today (or tomorrow if already past).
    scheduled_time_unix: body.scheduled_time_unix ?? nextPerthAfternoonUnix(),
    timezone: 'Australia/Perth',
    target_concurrency_limit: 8,
    telephony_call_config: { ring_timeout: 25 },
  }

  const res = await fetch('https://api.elevenlabs.io/v1/convai/batch-calling/submit', {
    method: 'POST',
    headers: { 'xi-api-key': xiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify(submitBody),
  })
  const result = await res.json()
  if (!res.ok) {
    console.error('[kickoff] batch submit failed', result)
    return NextResponse.json({ ok: false, error: result }, { status: 502 })
  }

  return NextResponse.json({ ok: true, queued: recipients.length, batch: result })
}

function toE164(raw: string): string | null {
  let n = String(raw).replace(/[^\d+]/g, '')
  if (n.startsWith('+')) return n
  if (n.startsWith('61')) return '+' + n
  if (n.startsWith('0')) return '+61' + n.slice(1)
  return null
}

function nextPerthAfternoonUnix(): number {
  // 2pm Perth (UTC+8 no DST) = 06:00 UTC. If already past today's window, tomorrow.
  const now = new Date()
  const todayTwoPmPerthMs = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 6, 0, 0)
  const target = now.getTime() > todayTwoPmPerthMs ? todayTwoPmPerthMs + 24 * 3600 * 1000 : todayTwoPmPerthMs
  return Math.floor(target / 1000)
}
