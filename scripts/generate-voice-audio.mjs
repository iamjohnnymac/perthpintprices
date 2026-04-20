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
const VOICE = process.env.ELEVENLABS_VOICE_ID || 'IRuDCTQL6MMy1qvcsue1' // Andrew — Sydney suburban
if (!KEY) {
  console.error('Missing ELEVENLABS_API_KEY')
  process.exit(1)
}

// eleven_multilingual_v2 is the most natural-sounding English model.
// Turbo sounds robotic on phone lines; multilingual_v2 is what you want
// for conversation-style TTS even though it's called "multilingual".
const MODEL = 'eleven_multilingual_v2'

// Script written in the voice of a 30-45yo suburban Aussie bloke ringing a
// pub about the cheap pint. Dropped Gs on -ing words so TTS matches delivery.
// Avoids telemarketer giveaways (self-ID, "sorry to bother") and cringe
// stereotypes (crikey / strewth / cobber). "Yeah look" + "just a quick one"
// signals low-effort ask and defuses survey vibe.
const CLIPS = {
  'greeting.mp3':
    "G'day mate, how ya goin'? Yeah look, just a quick one — was wonderin' what ya cheapest pint is at the moment, and what's on tap for it? Cheers.",
  'thanks.mp3': "Nice one, cheers mate. Ta.",
  'thanks-no-answer.mp3': "No dramas, cheers anyway mate.",
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
        // Slightly steadier than a young voice — Andrew is a 30-45yo suburban
        // bloke, not hyped up. Still enough style for conversational tone.
        stability: 0.4,
        similarity_boost: 0.85,
        style: 0.5,
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
