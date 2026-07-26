import { NextRequest, NextResponse } from 'next/server'
import crypto from 'node:crypto'
import {
  ANDREW_DEMO_ACTIVE_LOCK_ID,
  ANDREW_DEMO_RESERVED_SLUG,
  andrewDemoArchiveId,
  createAndrewDemoMetadata,
  isAndrewDemoCall,
  parseAndrewDemoMetadata,
} from '@/lib/andrewDemo'
import {
  parseAndrewDemoBeer,
  parseAndrewDemoConfidence,
  parseAndrewDemoHappyHour,
  parseAndrewDemoPrice,
} from '@/lib/andrewDemoFields'
import { normalizePriceConfidence } from '@/lib/priceProvenance'
import { normalizeVoicePintPrice, parseVoiceNumber, unwrapVoiceField } from '@/lib/voicePrice'

// ElevenLabs post-call webhook. Fired once per call with a full transcript,
// metadata, and cost. We log every call to phone_call_log for audit. If the
// mid-call record_price tool missed usable data, post-call data collection can
// persist it as a fallback.
//
// Auth: HMAC-SHA256 of the raw body using a shared webhook secret configured
// in the ElevenLabs post-call webhook settings, sent in
// `ElevenLabs-Signature: t=<timestamp>,v0=<hex>` header format.

interface PostCallBody {
  type: string
  event_timestamp: number
  data: {
    agent_id: string
    conversation_id: string
    status?: string
    failure_reason?: string
    call_duration_secs?: number
    transcript?: Array<{ role: string; message: string }>
    metadata?: Record<string, unknown>
    analysis?: {
      transcript_summary?: string
      call_successful?: string
      evaluation_criteria_results?: Record<string, unknown>
      data_collection_results?: Record<string, unknown>
    }
    conversation_initiation_client_data?: {
      dynamic_variables?: {
        pub_slug?: string
        pub_name?: string
        suburb?: string
        last_price?: string
        demo_mode?: string
      }
    }
  }
}

interface PubPhoneRow {
  id: number
  phone: string | null
}

const WEBHOOK_TIMESTAMP_TOLERANCE_SECONDS = 30 * 60
const DEMO_TRANSCRIPT_PLACEHOLDER = '[Demo transcript withheld for privacy]'

function parseString(value: unknown): string | null {
  const unwrapped = unwrapVoiceField(value)
  if (unwrapped == null) return null
  const s = String(unwrapped).trim()
  if (!s || s.toLowerCase() === 'null' || s.toLowerCase() === 'none') return null
  return s
}

function verifySignature(rawBody: string, header: string | null, secret: string, now: Date): boolean {
  if (!header) return false
  // ElevenLabs format: "t=<timestamp>,v0=<hex>"
  const parts = Object.fromEntries(header.split(',').map((p) => p.trim().split('=') as [string, string]))
  const t = parts.t
  const v0 = parts.v0
  if (!t || !v0) return false
  const timestamp = Number(t)
  if (!Number.isSafeInteger(timestamp)) return false
  const ageSeconds = Math.abs(Math.floor(now.getTime() / 1000) - timestamp)
  if (ageSeconds > WEBHOOK_TIMESTAMP_TOLERANCE_SECONDS) return false
  const signed = `${t}.${rawBody}`
  const expected = crypto.createHmac('sha256', secret).update(signed).digest('hex')
  const actualBuffer = Buffer.from(v0, 'hex')
  const expectedBuffer = Buffer.from(expected, 'hex')
  if (actualBuffer.length !== expectedBuffer.length) return false
  return crypto.timingSafeEqual(actualBuffer, expectedBuffer)
}

interface PostCallDeps {
  supabase?: {
    from(table: string): any
    rpc(fn: string, args: Record<string, unknown>): any
  }
  getSupabase?: () => {
    from(table: string): any
    rpc(fn: string, args: Record<string, unknown>): any
  }
  now?: Date
  signatureNow?: Date
}

export async function handlePostCall(req: NextRequest, deps: PostCallDeps) {
  const rawBody = await req.text()
  const secret = process.env.ELEVENLABS_POST_CALL_WEBHOOK_SECRET
  if (!secret) {
    return NextResponse.json({ ok: false, error: 'server misconfigured' }, { status: 500 })
  }

  const sig = req.headers.get('elevenlabs-signature')
  const ok = verifySignature(rawBody, sig, secret, deps.signatureNow ?? new Date())
  if (!ok) {
    console.warn('[agent post-call] bad signature')
    return NextResponse.json({ ok: false, error: 'unauthorised' }, { status: 401 })
  }

  let body: PostCallBody
  try {
    body = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ ok: false, error: 'bad json' }, { status: 400 })
  }

  const supabase = deps.supabase ?? deps.getSupabase?.()
  if (!supabase) return NextResponse.json({ ok: false, error: 'server misconfigured' }, { status: 500 })

  const d = body.data
  const pubSlug = d.conversation_initiation_client_data?.dynamic_variables?.pub_slug || null
  const reservation = await findDemoReservation(supabase, d.conversation_id)
  if (reservation.error) {
    return NextResponse.json({ ok: false, error: 'demo reservation lookup failed' }, { status: 500 })
  }
  const demoCall = reservation.matched
    || isAndrewDemoCall(pubSlug, d.agent_id, process.env.ELEVENLABS_DEMO_AGENT_ID)

  if (body.type === 'call_initiation_failure') {
    return demoCall
      ? handleDemoCallTerminal(body, supabase, 'failed')
      : handleCallInitiationFailure(body, supabase)
  }

  if (body.type !== 'post_call_transcription') {
    return NextResponse.json({ ok: true, ignored: body.type })
  }

  if (demoCall) {
    return handleDemoCallTerminal(body, supabase, 'done')
  }

  let pubId: number | null = null
  if (pubSlug) {
    const { data: pub, error: pubError } = await supabase
      .from('pubs')
      .select('id')
      .eq('slug', pubSlug)
      .maybeSingle()
    if (pubError) {
      console.error('[agent post-call] pub lookup failed:', pubError.message)
      return NextResponse.json({ ok: false, error: `pub lookup failed: ${pubError.message}` }, { status: 500 })
    }
    pubId = pub?.id ?? null
  }

  const transcriptText = (d.transcript || [])
    .map((t) => `${t.role}: ${t.message}`)
    .join('\n')

  const collection = d.analysis?.data_collection_results || {}
  const parsedPrice = parseVoiceNumber(collection.price)
  const parsedBeerType = parseString(collection.beer_type)
  const parsedHappyHour = parseString(collection.happy_hour)
  const parsedConfidence = parseString(collection.confidence) || d.analysis?.call_successful || null
  const priceConfidence = normalizePriceConfidence(parsedConfidence)

  const callLog = {
    pub_id: pubId,
    call_sid: d.conversation_id,
    transcript: transcriptText,
    recording_url: null,
    parsed_price: parsedPrice,
    parsed_beer_type: parsedBeerType,
    parsed_confidence: parsedConfidence,
    parsed_notes: d.analysis?.transcript_summary || null,
  }

  const updates: Record<string, unknown> = {}
  let priceHistory: Record<string, unknown> | null = null
  if (pubId) {
    const hasPrice = parsedPrice != null
    const hasHH = !!parsedHappyHour
    const hasBrand = !!parsedBeerType

    if (hasPrice || hasHH || hasBrand) {
      const pintPrice = hasPrice ? normalizeVoicePintPrice(collection.price, collection.unit) : null

      const verifiedAt = (deps.now ?? new Date()).toISOString()
      if (pintPrice != null) {
        updates.price = pintPrice
        updates.price_verified = true
        updates.last_verified = verifiedAt
        updates.price_verified_at = verifiedAt
        updates.price_source = 'andrew'
        updates.price_confidence = priceConfidence
      }
      if (hasBrand) updates.beer_type = parsedBeerType
      if (hasHH) updates.happy_hour = parsedHappyHour

      if (pintPrice != null) {
        priceHistory = {
          pub_id: pubId,
          price: pintPrice,
          beer_type: parsedBeerType,
          change_type: 'phone_agent',
          source: `ElevenLabs ${d.conversation_id} (post-call fallback)`,
          verified_at: verifiedAt,
          confidence: priceConfidence,
        }
      }
    }
  }

  const { data: processResult, error: processError } = await supabase.rpc('process_agent_post_call', {
    p_call_log: callLog,
    p_pub_id: pubId,
    p_pub_updates: updates,
    p_price_history: priceHistory,
  })
  if (processError) {
    console.error('[agent post-call] transaction failed:', processError.message)
    return NextResponse.json({ ok: false, error: `post-call transaction failed: ${processError.message}` }, { status: 500 })
  }
  if (processResult?.processed === false) {
    return NextResponse.json({ ok: true, duplicate: true })
  }

  const fallbackWrote = processResult?.fallback_written === true

  console.log(
    `[agent post-call] conv=${d.conversation_id} pub=${pubSlug} dur=${d.call_duration_secs}s success=${d.analysis?.call_successful} price=${parsedPrice ?? 'n/a'} beer=${parsedBeerType ?? 'n/a'} fallback=${fallbackWrote}`,
  )

  return NextResponse.json({ ok: true, fallback_wrote: fallbackWrote })
}

async function findDemoReservation(
  supabase: { from(table: string): any },
  conversationId: string,
) {
  const { data, error } = await supabase
    .from('phone_call_log')
    .select('call_sid, parsed_notes')
    .is('pub_id', null)
    .order('created_at', { ascending: false })
    .limit(100)
  if (error) return { matched: false, error }
  const matched = (data || []).some((row: { call_sid?: string | null; parsed_notes?: string | null }) => {
    const metadata = parseAndrewDemoMetadata(row.parsed_notes || null)
    if (!metadata) return false
    if (metadata.conversation_id) return metadata.conversation_id === conversationId
    return row.call_sid === ANDREW_DEMO_ACTIVE_LOCK_ID
  })
  return {
    matched,
    error: null,
  }
}

async function handleDemoCallTerminal(
  body: PostCallBody,
  supabase: { from(table: string): any },
  status: 'done' | 'failed',
) {
  const d = body.data
  if (!/^[A-Za-z0-9_-]{8,160}$/.test(d.conversation_id)) {
    return NextResponse.json({ ok: false, error: 'invalid demo conversation' }, { status: 400 })
  }

  const { data: lockRow, error: lockError } = await supabase
    .from('phone_call_log')
    .select('call_sid, parsed_notes')
    .eq('call_sid', ANDREW_DEMO_ACTIVE_LOCK_ID)
    .maybeSingle()
  if (lockError) {
    return NextResponse.json({ ok: false, error: 'demo call lock lookup failed' }, { status: 500 })
  }

  const existingMetadata = parseAndrewDemoMetadata(lockRow?.parsed_notes || null)
  if (
    lockRow
    && (
      !existingMetadata
      || existingMetadata.agent_id !== d.agent_id
      || (existingMetadata.conversation_id && existingMetadata.conversation_id !== d.conversation_id)
    )
  ) {
    return NextResponse.json({ ok: false, error: 'demo call lock mismatch' }, { status: 409 })
  }

  const identity = existingMetadata || {
    kind: 'ai_demo_test_call' as const,
    agent_id: d.agent_id,
    destination_mask: 'not stored',
    destination_hash: 'not stored',
    status,
  }
  const collection = d.analysis?.data_collection_results || {}
  const confidence = status === 'done' ? parseAndrewDemoConfidence(collection.confidence) : null
  const parsedPrice = status === 'done' ? parseAndrewDemoPrice(collection.price, collection.unit) : null
  const parsedBeerType = status === 'done' ? parseAndrewDemoBeer(collection.beer_type) : null
  const parsedHappyHour = status === 'done' ? parseAndrewDemoHappyHour(collection.happy_hour) : null
  const archiveId = andrewDemoArchiveId(d.conversation_id, status)
  const safeMetadata = createAndrewDemoMetadata(identity, status, d.conversation_id)
  const safeLog = {
    pub_id: null,
    call_sid: archiveId,
    transcript: DEMO_TRANSCRIPT_PLACEHOLDER,
    recording_url: null,
    parsed_price: parsedPrice,
    parsed_beer_type: parsedBeerType,
    parsed_confidence: `ai_demo_${status}`,
    parsed_notes: JSON.stringify(safeMetadata),
  }

  const result = lockRow
    ? await supabase
      .from('phone_call_log')
      .update(safeLog)
      .eq('call_sid', ANDREW_DEMO_ACTIVE_LOCK_ID)
    : await supabase.from('phone_call_log').insert(safeLog)
  if (result.error) {
    if (result.error.code === '23505') return NextResponse.json({ ok: true, duplicate: true })
    return NextResponse.json({ ok: false, error: 'demo call log failed' }, { status: 500 })
  }

  console.log(`[agent post-call] demo_terminal conv=${d.conversation_id} status=${status}`)
  return NextResponse.json({ ok: true, sandbox: true, recorded: false })
}

async function handleCallInitiationFailure(
  body: PostCallBody,
  supabase: { from(table: string): any },
) {
  const d = body.data
  const targetNumber = failureTargetNumber(d.metadata)
  let pubId: number | null = null
  try {
    pubId = targetNumber ? await findPubIdByPhone(supabase, targetNumber) : null
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ ok: false, error: `pub phone lookup failed: ${message}` }, { status: 500 })
  }
  const { error: logErr } = await supabase.from('phone_call_log').insert({
    pub_id: pubId,
    call_sid: d.conversation_id,
    transcript: null,
    recording_url: null,
    parsed_price: null,
    parsed_beer_type: null,
    parsed_confidence: 'call_initiation_failure',
    parsed_notes: JSON.stringify({
      failure_reason: d.failure_reason || null,
      target_number: targetNumber,
      metadata: d.metadata || null,
    }),
  })

  if (logErr) {
    if (logErr.code === '23505') {
      return NextResponse.json({ ok: true, duplicate: true })
    }
    console.error('[agent post-call] initiation failure log insert failed:', logErr.message)
    return NextResponse.json({ ok: false, error: `call log insert failed: ${logErr.message}` }, { status: 500 })
  }

  console.log(
    `[agent post-call] initiation_failure conv=${d.conversation_id} pub=${pubId ?? 'n/a'} reason=${d.failure_reason ?? 'unknown'}`,
  )

  return NextResponse.json({ ok: true, logged: 'call_initiation_failure' })
}

function failureTargetNumber(metadata: Record<string, unknown> | undefined): string | null {
  const providerBody = metadata && typeof metadata.body === 'object' ? (metadata.body as Record<string, unknown>) : null
  if (!providerBody) return null
  return parseString(providerBody.To) || parseString(providerBody.Called) || parseString(providerBody.to_number)
}

async function findPubIdByPhone(supabase: { from(table: string): any }, targetNumber: string): Promise<number | null> {
  const target = toE164(targetNumber)
  if (!target) return null
  const { data, error } = await supabase.from('pubs').select('id, phone').not('phone', 'is', null)
  if (error) {
    throw new Error(error.message)
  }
  const match = ((data || []) as PubPhoneRow[]).find((pub) => pub.phone && toE164(pub.phone) === target)
  return match?.id ?? null
}

function toE164(raw: string): string | null {
  let n = String(raw).replace(/[^\d+]/g, '')
  if (n.startsWith('+')) return n
  if (n.startsWith('61')) return '+' + n
  if (n.startsWith('0')) return '+61' + n.slice(1)
  return null
}
