import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Twilio hits this endpoint twice per call: once with the recording
// (immediately after <Record> completes) and a second time with the
// transcription (after Twilio's transcribe="true" finishes ASR).
// We treat whichever payload contains TranscriptionText as the "final"
// call, parse it with Claude, and write the price to Supabase.

interface ParsedPrice {
  price: number | null
  beer_type: string | null
  happy_hour_mention: string | null
  confidence: 'high' | 'medium' | 'low'
  raw_notes: string
}

async function parseTranscript(transcript: string, pubName: string): Promise<ParsedPrice> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': process.env.ANTHROPIC_API_KEY || '',
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 300,
      system:
        'Extract structured beer-price info from a short phone transcript. Output ONLY valid JSON, no prose. Schema: {"price": number|null, "beer_type": string|null, "happy_hour_mention": string|null, "confidence": "high"|"medium"|"low", "raw_notes": string}. price is the cheapest pint in AUD the bartender mentioned. beer_type is what brand/tap (e.g. "Swan Draught", "Coopers Pale"). happy_hour_mention is any HH info they volunteered. confidence is high if a single clear price was stated, medium if partial, low if unclear or refused. raw_notes captures anything else useful.',
      messages: [
        {
          role: 'user',
          content: `Pub: ${pubName}\nTranscript: "${transcript}"`,
        },
      ],
    }),
  })
  if (!res.ok) {
    const body = await res.text()
    console.error('Claude parse failed:', res.status, body)
    return { price: null, beer_type: null, happy_hour_mention: null, confidence: 'low', raw_notes: 'parse failed' }
  }
  const json = await res.json()
  const text = json.content?.[0]?.text ?? '{}'
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    return JSON.parse(jsonMatch ? jsonMatch[0] : text)
  } catch {
    return { price: null, beer_type: null, happy_hour_mention: null, confidence: 'low', raw_notes: text.slice(0, 200) }
  }
}

export async function POST(req: NextRequest) {
  const form = await req.formData()
  const transcript = (form.get('TranscriptionText') as string) || ''
  const recordingUrl = (form.get('RecordingUrl') as string) || ''
  const callSid = (form.get('CallSid') as string) || ''
  const pubId = req.nextUrl.searchParams.get('pubId') || ''

  // Twilio sends the recording webhook first (no TranscriptionText) and then a
  // separate transcription webhook. Only act on the transcription one.
  if (!transcript) {
    console.log(`[twilio] recording for pub=${pubId} call=${callSid} url=${recordingUrl}`)
    return new NextResponse('OK', { status: 200 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ifxkoblvgttelzboenpi.supabase.co',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  )

  const { data: pub } = await supabase.from('pubs').select('id, name, price').eq('id', pubId).single()
  if (!pub) {
    console.error(`[twilio] no pub for id=${pubId}`)
    return new NextResponse('OK', { status: 200 })
  }

  const parsed = await parseTranscript(transcript, pub.name)
  console.log(`[twilio] pub=${pub.name} transcript="${transcript}" parsed=`, parsed)

  // Only write if we got a plausible price and pub didn't already have one.
  // This keeps the agent non-destructive: it fills gaps, never overwrites.
  const MIN_PLAUSIBLE = 5
  const MAX_PLAUSIBLE = 20
  if (
    parsed.price != null &&
    parsed.price >= MIN_PLAUSIBLE &&
    parsed.price <= MAX_PLAUSIBLE &&
    parsed.confidence !== 'low' &&
    pub.price == null
  ) {
    const updates: Record<string, unknown> = {
      price: parsed.price,
      price_verified: false, // flag for human spot-check
      last_verified: new Date().toISOString(),
    }
    if (parsed.beer_type) updates.beer_type = parsed.beer_type
    const { error } = await supabase.from('pubs').update(updates).eq('id', pub.id)
    if (error) console.error(`[twilio] supabase update failed:`, error.message)
    else console.log(`[twilio] wrote price=${parsed.price} beer=${parsed.beer_type} for ${pub.name}`)

    // Also append to price_history for trend charts
    await supabase.from('price_history').insert({
      pub_id: pub.id,
      price: parsed.price,
      beer_type: parsed.beer_type,
      change_type: 'phone_agent',
      source: `Call ${callSid}`,
    })
  }

  // Always log the raw transcript result for audit/debugging
  await supabase.from('phone_call_log').insert({
    pub_id: pub.id,
    call_sid: callSid,
    transcript,
    recording_url: recordingUrl,
    parsed_price: parsed.price,
    parsed_beer_type: parsed.beer_type,
    parsed_confidence: parsed.confidence,
    parsed_notes: parsed.raw_notes,
  }).then(({ error }) => {
    if (error && !error.message.includes('does not exist')) {
      console.error('[twilio] phone_call_log insert failed:', error.message)
    }
  })

  return new NextResponse('OK', { status: 200 })
}
