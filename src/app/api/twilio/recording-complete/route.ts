import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Twilio hits this endpoint once the <Record> verb finishes, posting a
// RecordingUrl. We download the MP3, transcribe it with ElevenLabs Scribe
// (far better than Twilio's built-in ASR for noisy phone audio), then parse
// the transcript with Claude into structured price data.

interface ParsedPrice {
  price: number | null
  beer_type: string | null
  happy_hour_mention: string | null
  confidence: 'high' | 'medium' | 'low'
  raw_notes: string
}

async function downloadRecording(url: string): Promise<Blob> {
  // Twilio recording URLs require basic auth with Account SID / Auth Token.
  const sid = process.env.TWILIO_ACCOUNT_SID || ''
  const tok = process.env.TWILIO_AUTH_TOKEN || ''
  const auth = Buffer.from(`${sid}:${tok}`).toString('base64')
  // Append .mp3 so Twilio returns the MP3 render (defaults to WAV otherwise).
  const mp3Url = url.endsWith('.mp3') ? url : `${url}.mp3`
  const res = await fetch(mp3Url, { headers: { Authorization: `Basic ${auth}` } })
  if (!res.ok) throw new Error(`Twilio recording fetch failed: ${res.status}`)
  return res.blob()
}

async function transcribeWithScribe(audio: Blob): Promise<string> {
  const form = new FormData()
  form.append('file', audio, 'recording.mp3')
  form.append('model_id', 'scribe_v1')
  const res = await fetch('https://api.elevenlabs.io/v1/speech-to-text', {
    method: 'POST',
    headers: { 'xi-api-key': process.env.ELEVENLABS_API_KEY || '' },
    body: form,
  })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Scribe failed: ${res.status} ${body.slice(0, 200)}`)
  }
  const json = await res.json()
  return json.text || ''
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
        'Extract structured beer-price info from a short phone transcript of an Australian bartender. Output ONLY valid JSON, no prose. Schema: {"price": number|null, "beer_type": string|null, "happy_hour_mention": string|null, "confidence": "high"|"medium"|"low", "raw_notes": string}. price is the cheapest pint in AUD the bartender mentioned (ignore pots/schooners if a pint price was stated, but treat schooner price as the answer if pint was not specified). beer_type is the brand/tap they quoted (e.g. "Swan Draught", "Coopers Pale", "XXXX Gold", "Great Northern"). happy_hour_mention is any HH info they volunteered. confidence is high if a single clear price was stated, medium if partial or unclear units, low if unclear/refused/irrelevant. raw_notes captures anything else useful.',
      messages: [{ role: 'user', content: `Pub: ${pubName}\nTranscript: "${transcript}"` }],
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
  const recordingUrl = (form.get('RecordingUrl') as string) || ''
  const callSid = (form.get('CallSid') as string) || ''
  const recordingDuration = parseInt((form.get('RecordingDuration') as string) || '0', 10)
  const pubId = req.nextUrl.searchParams.get('pubId') || ''

  console.log(`[twilio] recording for pub=${pubId} call=${callSid} dur=${recordingDuration}s url=${recordingUrl}`)

  if (!recordingUrl) {
    return new NextResponse('OK', { status: 200 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ifxkoblvgttelzboenpi.supabase.co',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  )

  // Transcribe + parse, but don't block the Twilio response — kick off async.
  ;(async () => {
    let transcript = ''
    let parsed: ParsedPrice = { price: null, beer_type: null, happy_hour_mention: null, confidence: 'low', raw_notes: '' }
    try {
      const audio = await downloadRecording(recordingUrl)
      transcript = await transcribeWithScribe(audio)
      console.log(`[twilio] scribe transcript: "${transcript}"`)
    } catch (e) {
      console.error('[twilio] transcription failed:', (e as Error).message)
    }

    // For test calls (pubId='test'), skip DB operations entirely.
    if (pubId === 'test') {
      if (transcript) {
        parsed = await parseTranscript(transcript, 'TEST')
        console.log('[twilio] test parse:', parsed)
      }
      return
    }

    const { data: pub } = await supabase.from('pubs').select('id, name, price').eq('id', pubId).single()
    if (!pub) {
      console.error(`[twilio] no pub for id=${pubId}`)
      return
    }

    if (transcript) {
      parsed = await parseTranscript(transcript, pub.name)
      console.log(`[twilio] pub=${pub.name} parsed=`, parsed)
    }

    // Only write if plausible price and pub doesn't already have one.
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
        price_verified: false,
        last_verified: new Date().toISOString(),
      }
      if (parsed.beer_type) updates.beer_type = parsed.beer_type
      const { error } = await supabase.from('pubs').update(updates).eq('id', pub.id)
      if (error) console.error(`[twilio] supabase update failed:`, error.message)
      else console.log(`[twilio] wrote price=${parsed.price} beer=${parsed.beer_type} for ${pub.name}`)

      await supabase.from('price_history').insert({
        pub_id: pub.id,
        price: parsed.price,
        beer_type: parsed.beer_type,
        change_type: 'phone_agent',
        source: `Call ${callSid}`,
      })
    }

    await supabase.from('phone_call_log').insert({
      pub_id: pub.id,
      call_sid: callSid,
      transcript,
      recording_url: recordingUrl,
      parsed_price: parsed.price,
      parsed_beer_type: parsed.beer_type,
      parsed_confidence: parsed.confidence,
      parsed_notes: parsed.raw_notes,
    })
  })().catch((e) => console.error('[twilio] async processing failed:', (e as Error).message))

  return new NextResponse('OK', { status: 200 })
}
