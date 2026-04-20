#!/usr/bin/env node
/**
 * Pre-render call audio with ElevenLabs (Charlie voice).
 *
 * Outputs to public/voice/. These are fetched by Twilio during the outbound
 * call — hosting them in /public means they ship with the Vercel deploy and
 * are served as static files.
 *
 * Regenerate anytime by re-running. Costs ~300 chars total (well under free tier).
 *
 * Usage:
 *   node scripts/generate-voice-audio.mjs
 */
import { writeFileSync, mkdirSync } from 'node:fs'
import { config } from 'dotenv'

config({ path: '.env.local' })

const KEY = process.env.ELEVENLABS_API_KEY
const VOICE = process.env.ELEVENLABS_VOICE_ID || 'IKne3meq5aSn9XLyUdCD' // Charlie
if (!KEY) {
  console.error('Missing ELEVENLABS_API_KEY')
  process.exit(1)
}

// Model — eleven_turbo_v2_5 is cheapest with near-identical quality. Mono 22kHz MP3
// is plenty for a phone line.
const MODEL = 'eleven_turbo_v2_5'

const CLIPS = {
  'greeting.mp3':
    "G'day! This is Perth Pint Prices calling. We're a free website that tracks Perth pub prices — helping locals find a cheap pint. Quick question for you: what's your cheapest tap beer at the moment? Price and the brand, if you've got a sec. Cheers!",
  'thanks.mp3': "Brilliant, thanks so much. Have a good one.",
  'thanks-no-answer.mp3': "No worries, thanks anyway. Have a good one.",
}

mkdirSync('public/voice', { recursive: true })

for (const [filename, text] of Object.entries(CLIPS)) {
  process.stdout.write(`Rendering ${filename} (${text.length} chars)... `)
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE}?output_format=mp3_22050_32`, {
    method: 'POST',
    headers: {
      'xi-api-key': KEY,
      'Content-Type': 'application/json',
      Accept: 'audio/mpeg',
    },
    body: JSON.stringify({
      text,
      model_id: MODEL,
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.85,
        style: 0.3,
        use_speaker_boost: true,
      },
    }),
  })
  if (!res.ok) {
    const body = await res.text()
    console.log('FAIL')
    console.error(`  ${res.status}: ${body.slice(0, 200)}`)
    continue
  }
  const buf = Buffer.from(await res.arrayBuffer())
  const path = `public/voice/${filename}`
  writeFileSync(path, buf)
  console.log(`${(buf.length / 1024).toFixed(1)} KB → ${path}`)
}

console.log('\nDone. Files will be served at https://perthpintprices.com/voice/<file>.mp3 once deployed.')
