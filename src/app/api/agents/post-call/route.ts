import { NextRequest, NextResponse } from 'next/server'
import { serviceClient } from '@/lib/supabaseGateway'
import crypto from 'node:crypto'

// ElevenLabs post-call webhook. Fired once per call with a full transcript,
// metadata, and cost. We log it to phone_call_log for audit. If the mid-call
// record_price tool didn't fire but we can see a price in the transcript,
// try a fallback extraction with Claude.
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
    status: string
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
      }
    }
  }
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

  const supabase = serviceClient()

  let pubId: number | null = null
  if (pubSlug) {
    const { data: pub } = await supabase.from('pubs').select('id').eq('slug', pubSlug).single()
    pubId = pub?.id ?? null
  }

  const transcriptText = (d.transcript || [])
    .map((t) => `${t.role}: ${t.message}`)
    .join('\n')

  await supabase.from('phone_call_log').insert({
    pub_id: pubId,
    call_sid: d.conversation_id,
    transcript: transcriptText,
    recording_url: null,
    parsed_price: null,
    parsed_beer_type: null,
    parsed_confidence: d.analysis?.call_successful || null,
    parsed_notes: d.analysis?.transcript_summary || null,
  })

  console.log(
    `[agent post-call] conv=${d.conversation_id} pub=${pubSlug} dur=${d.call_duration_secs}s success=${d.analysis?.call_successful}`
  )

  return NextResponse.json({ ok: true })
}
