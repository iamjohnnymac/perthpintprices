import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'node:crypto'

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
  skipOpenCheck?: boolean
  cooldownHours?: number
}

interface PubRow {
  id: number
  name: string
  slug: string
  suburb: string | null
  phone: string | null
  price: number | null
  price_verified: boolean | null
  place_id: string | null
}

interface PhoneCallLogRow {
  pub_id: number | null
  call_sid: string | null
  parsed_confidence: string | null
  created_at: string | null
}

interface KickoffDeps {
  supabase?: {
    from(table: string): any
  }
  getSupabase?: () => {
    from(table: string): any
  }
  now?: Date
  fetchFn?: typeof fetch
  reservationId?: string
}

const PHONE_LOG_PAGE_SIZE = 1000
const MIN_COOLDOWN_HOURS = 72

export async function handleKickoff(req: NextRequest, deps: KickoffDeps) {
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
      { status: 500 },
    )
  }

  const supabase = deps.supabase ?? deps.getSupabase?.()
  if (!supabase) return NextResponse.json({ ok: false, error: 'server misconfigured' }, { status: 500 })

  // Eligible pubs: have a phone, and either missing a price or the price isn't
  // human-verified (phone-agent data is still marked verified=true on write, so
  // we skip those).
  const { data: candidatePubs, error } = await supabase
    .from('pubs')
    .select('id, name, slug, suburb, phone, price, price_verified, place_id')
    .not('phone', 'is', null)
    .or('price.is.null,price_verified.eq.false')
    .order('id')

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })

  const cooldownHours = Math.max(body.cooldownHours ?? MIN_COOLDOWN_HOURS, MIN_COOLDOWN_HOURS)
  const now = deps.now ?? new Date()
  const cooldownCutoff = new Date(now.getTime() - cooldownHours * 3600 * 1000).toISOString()

  const logLookup = await getCallSafetyRows(supabase, cooldownCutoff)
  if (logLookup.error) {
    console.error('[kickoff] phone_call_log query failed:', logLookup.error.message)
    return NextResponse.json({ ok: false, error: `cooldown lookup failed: ${logLookup.error.message}` }, { status: 500 })
  }

  const excludePubIds = new Set<number>()
  const dncPubIds = new Set<number>()
  for (const row of logLookup.rows) {
    if (row.pub_id == null) continue
    excludePubIds.add(row.pub_id)
    if (row.parsed_confidence === 'do_not_call') dncPubIds.add(row.pub_id)
  }

  const pubs = ((candidatePubs || []) as PubRow[]).filter((p) => !excludePubIds.has(p.id))
  const excludedTotal = (candidatePubs?.length ?? 0) - pubs.length

  const limit = body.limit ?? 200

  // Optionally filter to only currently-open pubs via Google Places.
  // Skipped if a `skipOpenCheck` flag is passed (useful for scheduled
  // batches that run at a known-open window and don't want the ~200
  // extra Places API calls).
  const googleKey = process.env.GOOGLE_PLACES_API_KEY
  let shortlist = pubs
  if (!body.skipOpenCheck && googleKey) {
    const filtered: PubRow[] = []
    for (const p of pubs) {
      if (filtered.length >= limit * 1.2) break // take a 20% buffer then trim to `limit`
      if (!p.place_id) continue
      try {
        const res = await (deps.fetchFn ?? fetch)(`https://places.googleapis.com/v1/places/${p.place_id}`, {
          headers: {
            'X-Goog-Api-Key': googleKey,
            'X-Goog-FieldMask': 'businessStatus,currentOpeningHours.openNow',
          },
        })
        if (!res.ok) continue
        const d = await res.json()
        if (d.businessStatus === 'OPERATIONAL' && d.currentOpeningHours?.openNow === true) {
          filtered.push(p)
        }
      } catch {
        // Silently skip — don't block the batch on a single lookup error.
      }
    }
    shortlist = filtered.slice(0, limit)
  } else {
    shortlist = pubs.slice(0, limit)
  }

  const callCandidates = shortlist
    .map((p) => {
      const e164 = toE164(p.phone!)
      if (!e164) return null
      return {
        pub: p,
        recipient: {
          phone_number: e164,
          conversation_initiation_client_data: {
            dynamic_variables: {
              pub_slug: p.slug,
              pub_name: p.name,
              suburb: p.suburb || 'Perth',
              last_price: p.price ? `$${Number(p.price).toFixed(2)}` : '',
            },
          },
        },
      }
    })
    .filter((r): r is NonNullable<typeof r> => r != null)
  const recipients = callCandidates.map((c) => c.recipient)

  if (body.dry_run) {
    return NextResponse.json({
      ok: true,
      dry_run: true,
      would_call: recipients.length,
      excluded: {
        by_cooldown_or_dnc: excludedTotal,
        dnc_marked: dncPubIds.size,
        cooldown_hours: cooldownHours,
      },
      first_10: recipients.slice(0, 10).map((r) => ({
        phone: r.phone_number,
        pub: r.conversation_initiation_client_data.dynamic_variables.pub_name,
      })),
    })
  }

  const submitBody = {
    call_name: `Pint Sweep — ${now.toISOString().slice(0, 16)}`,
    agent_id: agentId,
    agent_phone_number_id: phoneNumberId,
    recipients,
    // Default: schedule for 2pm AWST today (or tomorrow if already past).
    scheduled_time_unix: body.scheduled_time_unix ?? nextPerthAfternoonUnix(now),
    timezone: 'Australia/Perth',
    target_concurrency_limit: 8,
    telephony_call_config: { ring_timeout: 25 },
  }

  const reservationSid = deps.reservationId ?? `pintsweep-${now.getTime()}-${randomUUID()}`
  const reservationRows = callCandidates.map((c) => ({
    pub_id: c.pub.id,
    call_sid: `${reservationSid}-${c.pub.id}`,
    transcript: null,
    recording_url: null,
    parsed_price: null,
    parsed_beer_type: null,
    parsed_confidence: 'queued',
    parsed_notes: `pintsweep kickoff reservation ${reservationSid}`,
  }))

  const { error: reservationErr } = await supabase.from('phone_call_log').insert(reservationRows)
  if (reservationErr) {
    console.error('[kickoff] reservation insert failed:', reservationErr.message)
    return NextResponse.json({ ok: false, error: `reservation failed: ${reservationErr.message}` }, { status: 500 })
  }

  const reservedSids = new Set(reservationRows.map((row) => row.call_sid))
  const reservedPubIds = new Set(callCandidates.map((c) => c.pub.id))
  const postReservationLookup = await getCallSafetyRows(supabase, cooldownCutoff)
  if (postReservationLookup.error) {
    await supabase.from('phone_call_log').delete().like('call_sid', `${reservationSid}-%`)
    console.error('[kickoff] post-reservation cooldown query failed:', postReservationLookup.error.message)
    return NextResponse.json(
      { ok: false, error: `cooldown lookup failed: ${postReservationLookup.error.message}` },
      { status: 500 },
    )
  }

  const conflictingReservation = postReservationLookup.rows.find(
    (row) => row.pub_id != null && reservedPubIds.has(row.pub_id) && !reservedSids.has(row.call_sid || ''),
  )
  if (conflictingReservation) {
    await supabase.from('phone_call_log').delete().like('call_sid', `${reservationSid}-%`)
    return NextResponse.json(
      { ok: false, error: 'call reservation conflict; retry later' },
      { status: 409 },
    )
  }

  const res = await (deps.fetchFn ?? fetch)('https://api.elevenlabs.io/v1/convai/batch-calling/submit', {
    method: 'POST',
    headers: { 'xi-api-key': xiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify(submitBody),
  })
  const result = await res.json()
  if (!res.ok) {
    console.error('[kickoff] batch submit failed', result)
    await supabase.from('phone_call_log').delete().like('call_sid', `${reservationSid}-%`)
    return NextResponse.json({ ok: false, error: result }, { status: 502 })
  }

  return NextResponse.json({
    ok: true,
    queued: recipients.length,
    excluded: {
      by_cooldown_or_dnc: excludedTotal,
      dnc_marked: dncPubIds.size,
      cooldown_hours: cooldownHours,
    },
    batch: result,
  })
}

async function getCallSafetyRows(
  supabase: { from(table: string): any },
  cooldownCutoff: string,
): Promise<{ rows: PhoneCallLogRow[]; error: { message: string } | null }> {
  const recent = await fetchPhoneCallLogPages((from, to) =>
    supabase
      .from('phone_call_log')
      .select('pub_id, call_sid, parsed_confidence, created_at')
      .not('pub_id', 'is', null)
      .gte('created_at', cooldownCutoff)
      .range(from, to),
  )
  if (recent.error) return recent

  const dnc = await fetchPhoneCallLogPages((from, to) =>
    supabase
      .from('phone_call_log')
      .select('pub_id, call_sid, parsed_confidence, created_at')
      .not('pub_id', 'is', null)
      .eq('parsed_confidence', 'do_not_call')
      .range(from, to),
  )
  if (dnc.error) return dnc

  return { rows: [...recent.rows, ...dnc.rows], error: null }
}

async function fetchPhoneCallLogPages(
  fetchPage: (from: number, to: number) => Promise<{ data: PhoneCallLogRow[] | null; error: { message: string } | null }>,
): Promise<{ rows: PhoneCallLogRow[]; error: { message: string } | null }> {
  const rows: PhoneCallLogRow[] = []
  for (let from = 0; ; from += PHONE_LOG_PAGE_SIZE) {
    const to = from + PHONE_LOG_PAGE_SIZE - 1
    const { data, error } = await fetchPage(from, to)
    if (error) return { rows: [], error }
    rows.push(...(data || []))
    if (!data || data.length < PHONE_LOG_PAGE_SIZE) return { rows, error: null }
  }
}

function toE164(raw: string): string | null {
  let n = String(raw).replace(/[^\d+]/g, '')
  if (n.startsWith('+')) return n
  if (n.startsWith('61')) return '+' + n
  if (n.startsWith('0')) return '+61' + n.slice(1)
  return null
}

function nextPerthAfternoonUnix(now = new Date()): number {
  // 2pm Perth (UTC+8 no DST) = 06:00 UTC. If already past today's window, tomorrow.
  const todayTwoPmPerthMs = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 6, 0, 0)
  const target = now.getTime() > todayTwoPmPerthMs ? todayTwoPmPerthMs + 24 * 3600 * 1000 : todayTwoPmPerthMs
  return Math.floor(target / 1000)
}
