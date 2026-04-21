import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'node:crypto'

// ElevenLabs post-call webhook. Fired once per call with a full transcript,
// metadata, and cost. We log every call to `phone_call_log` for audit, then
// pull structured fields out of the `analysis.data_collection_results` block
// that ElevenLabs fills in based on the agent's configured data-collection
// schema (see agents/andrew.json -> platform_settings.data_collection).
//
// If the mid-call `record_price` tool never fired but the post-call analysis
// extracted a usable price, write it to `pubs` as a fallback so the capture
// isn't lost (happens when a call drops mid-utterance or the agent sums up
// without firing the tool).
//
// Auth: HMAC-SHA256 of the raw body using a shared webhook secret configured
// in the ElevenLabs post-call webhook settings, sent in
// `ElevenLabs-Signature: t=<timestamp>,v0=<hex>` header format.

interface DataCollectionField {
  value?: unknown
  rationale?: string
  json_schema?: unknown
}

interface PostCallBody {
  type: string
  event_timestamp: number
  data: {
    agent_id: string
    conversation_id: string
    status: string
    call_duration_secs?: number
    transcript?: Array<{ role: string; message: string }>
    metadata?: Record<string, unknown>
    analysis?: {
      transcript_summary?: string
      call_successful?: string
      evaluation_criteria_results?: Record<string, unknown>
      data_collection_results?: Record<string, DataCollectionField | unknown>
    }
    conversation_initiation_client_data?: {
      dynamic_variables?: {
        pub_slug?: string
        pub_name?: string
        suburb?: string
        last_price?: string
      }
    }
  }
}

// ElevenLabs returns each data_collection field as either a primitive or a
// { value, rationale } object. Normalise to the primitive.
function extractValue(field: unknown): unknown {
  if (field && typeof field === 'object' && 'value' in (field as Record<string, unknown>)) {
    return (field as DataCollectionField).value
  }
  return field
}

function parseNumber(v: unknown): number | null {
  if (v == null) return null
  const n = typeof v === 'number' ? v : parseFloat(String(v))
  return Number.isFinite(n) ? n : null
}

function parseString(v: unknown): string | null {
  if (v == null) return null
  const s = String(v).trim()
  return s && s.toLowerCase() !== 'null' && s.toLowerCase() !== 'none' ? s : null
}

function verifySignature(rawBody: string, header: string | null, secret: string): boolean {
  if (!header) return false
  // ElevenLabs format: "t=<timestamp>,v0=<hex>"
  const parts = Object.fromEntries(header.split(',').map((p) => p.trim().split('=') as [string, string]))
  const t = parts.t
  const v0 = parts.v0
  if (!t || !v0) return false
  const signed = `${t}.${rawBody}`
  const expected = crypto.createHmac('sha256', secret).update(signed).digest('hex')
  // constant-time comparison
  return crypto.timingSafeEqual(Buffer.from(v0, 'hex'), Buffer.from(expected, 'hex'))
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text()
  const secret = process.env.AGENT_WEBHOOK_SECRET
  if (!secret) {
    return NextResponse.json({ ok: false, error: 'server misconfigured' }, { status: 500 })
  }

  const sig = req.headers.get('elevenlabs-signature')
  // During initial setup the webhook might not have HMAC configured yet — also
  // accept the same shared-secret header the record-price route uses, as a
  // fallback so we can test without fiddling with HMAC first.
  const shared = req.headers.get('x-agent-secret')
  const ok = verifySignature(rawBody, sig, secret) || shared === secret
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

  if (body.type !== 'post_call_transcription') {
    return NextResponse.json({ ok: true, ignored: body.type })
  }

  const d = body.data
  const pubSlug = d.conversation_initiation_client_data?.dynamic_variables?.pub_slug || null

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ifxkoblvgttelzboenpi.supabase.co',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  )

  let pubId: number | null = null
  let existingPrice: number | null = null
  let priceVerified = false
  if (pubSlug) {
    const { data: pub } = await supabase
      .from('pubs')
      .select('id, price, price_verified')
      .eq('slug', pubSlug)
      .single()
    pubId = pub?.id ?? null
    existingPrice = pub?.price ?? null
    priceVerified = !!pub?.price_verified
  }

  const transcriptText = (d.transcript || [])
    .map((t) => `${t.role}: ${t.message}`)
    .join('\n')

  // Extract structured fields from ElevenLabs' data_collection_results.
  // Field names match the data_collection schema declared in agents/andrew.json.
  const dcr = d.analysis?.data_collection_results || {}
  const parsedPrice = parseNumber(extractValue(dcr['price']))
  const parsedBeerType = parseString(extractValue(dcr['beer_type']))
  const parsedHappyHour = parseString(extractValue(dcr['happy_hour']))
  const parsedUnit = parseString(extractValue(dcr['unit']))
  const parsedConfidence =
    parseString(extractValue(dcr['confidence'])) || d.analysis?.call_successful || null

  await supabase.from('phone_call_log').insert({
    pub_id: pubId,
    call_sid: d.conversation_id,
    transcript: transcriptText,
    recording_url: null,
    parsed_price: parsedPrice,
    parsed_beer_type: parsedBeerType,
    parsed_confidence: parsedConfidence,
    parsed_notes: d.analysis?.transcript_summary || null,
  })

  // Fallback persistence: if the mid-call record_price tool never fired
  // (existing pub has no human-verified price) but the post-call analysis
  // extracted usable data, write it to `pubs` ourselves. Price range check
  // mirrors record-price/[slug].
  let fallbackWrote = false
  if (pubId && !priceVerified) {
    const hasPrice = parsedPrice != null
    const hasHH = !!parsedHappyHour
    const hasBrand = !!parsedBeerType
    if (hasPrice || hasHH || hasBrand) {
      const UNIT_TO_PINT: Record<string, number> = {
        pint: 1,
        schooner: 570 / 425,
        pot: 570 / 285,
      }
      const mult = UNIT_TO_PINT[(parsedUnit || 'pint').toLowerCase()] ?? 1
      let pintPrice: number | null = hasPrice ? Number((parsedPrice! * mult).toFixed(2)) : null
      if (pintPrice != null && (pintPrice < 5 || pintPrice > 20)) pintPrice = null

      const updates: Record<string, unknown> = {}
      if (pintPrice != null && pintPrice !== existingPrice) {
        updates.price = pintPrice
        updates.price_verified = true
        updates.last_verified = new Date().toISOString()
      }
      if (hasBrand) updates.beer_type = parsedBeerType
      if (hasHH) updates.happy_hour = parsedHappyHour

      if (Object.keys(updates).length > 0) {
        const { error: upErr } = await supabase.from('pubs').update(updates).eq('id', pubId)
        if (upErr) {
          console.error('[agent post-call] fallback update failed:', upErr.message)
        } else {
          fallbackWrote = true
          if (pintPrice != null) {
            await supabase.from('price_history').insert({
              pub_id: pubId,
              price: pintPrice,
              beer_type: parsedBeerType,
              change_type: 'phone_agent',
              source: `ElevenLabs ${d.conversation_id} (post-call fallback)`,
            })
          }
        }
      }
    }
  }

  console.log(
    `[agent post-call] conv=${d.conversation_id} pub=${pubSlug} dur=${d.call_duration_secs}s success=${d.analysis?.call_successful} price=${parsedPrice ?? 'n/a'} beer=${parsedBeerType ?? 'n/a'} fallback=${fallbackWrote}`
  )

  return NextResponse.json({ ok: true, fallback_wrote: fallbackWrote })
}
