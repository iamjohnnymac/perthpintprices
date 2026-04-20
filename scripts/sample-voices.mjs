#!/usr/bin/env node
/**
 * Generate voice samples of Andrew saying a representative greeting, for A/B
 * picking. Creates MP3 files in public/voice-samples/ that get deployed to
 * perthpintprices.com for easy listening.
 *
 * Covers:
 *   - Current Andrew (baseline)
 *   - 5 other stock Aussie voices from the ElevenLabs library
 *   - 3 Voice Design outputs with different character prompts
 *
 * Usage: node scripts/sample-voices.mjs
 */
import { writeFileSync, mkdirSync } from 'node:fs'
import { config } from 'dotenv'

config({ path: '.env.local' })

const KEY = process.env.ELEVENLABS_API_KEY
if (!KEY) {
  console.error('Missing ELEVENLABS_API_KEY')
  process.exit(1)
}

// Short, representative sample line — captures the opener, intro, and ask
const SAMPLE_TEXT =
  "Hi, is this The Sail and Anchor? Awesome. Andrew here from Perth Pint Prices dot com — free site for the cheap pints around Perth. Would you be able to help me out with a quick price check? What's your cheapest pint, what it is, and any happy hour you run?"

const MODEL = 'eleven_flash_v2'
const OUT = 'public/voice-samples'

mkdirSync(OUT, { recursive: true })

// Stock voices from the ElevenLabs shared library — all Australian or British-male
const STOCK_VOICES = [
  { id: 'IRuDCTQL6MMy1qvcsue1', filename: '01-andrew-current.mp3', label: 'Andrew (current)' },
  { id: 'hIreuBly94QFepU63yel', filename: '02-scotty.mp3', label: 'Scotty — friendly AU narrator' },
  { id: '4uJW3zTppOdNDWtKUtux', filename: '03-jordan.mp3', label: 'Jordan — Aussie cobba' },
  { id: '0fHJvHo80Z8DDSm3NApj', filename: '04-al.mp3', label: 'Al — subtle AU accent' },
  { id: 'QLOrGSLtlFUlfQRSaOtQ', filename: '05-gary.mp3', label: 'Gary — gritty AU narrator' },
  { id: '8HOgpuH7Mid4fwQK1Jln', filename: '06-bruce.mp3', label: 'Bruce — mature AU baritone' },
]

// Voice Design prompts — generate unique voices from text descriptions
const DESIGN_PROMPTS = [
  {
    filename: '07-design-suburban-bloke.mp3',
    label: 'Designed — 35yo suburban Perth bloke',
    description:
      'A 35-year-old Australian suburban male with a natural Perth accent. Warm, casual, slightly dry sense of humour. Relaxed phone voice, not performative. Not a radio announcer, just a regular bloke.',
  },
  {
    filename: '08-design-tradie.mp3',
    label: 'Designed — relaxed Aussie tradie',
    description:
      'A 40-year-old Australian man, tradie-style voice. Practical, low-key, unpolished. Slight Perth accent. Sounds like someone phoning from a worksite smoko, not a call centre.',
  },
  {
    filename: '09-design-country-pub.mp3',
    label: 'Designed — country pub character',
    description:
      'A 45-year-old Australian man with a broader regional WA accent. Grounded, patient, pragmatic. Sounds like a bloke who owns a country pub, not city slick.',
  },
]

async function ttsForVoice(voiceId, text, filename) {
  const res = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_22050_32`,
    {
      method: 'POST',
      headers: {
        'xi-api-key': KEY,
        'Content-Type': 'application/json',
        Accept: 'audio/mpeg',
      },
      body: JSON.stringify({
        text,
        model_id: MODEL,
        voice_settings: { stability: 0.4, similarity_boost: 0.85, speed: 0.95 },
      }),
    }
  )
  if (!res.ok) throw new Error(`${res.status}: ${(await res.text()).slice(0, 200)}`)
  const buf = Buffer.from(await res.arrayBuffer())
  writeFileSync(`${OUT}/${filename}`, buf)
  return buf.length
}

async function designVoice(description, text, filename) {
  // ElevenLabs Voice Design: POST /v1/text-to-voice/create-previews
  // Returns preview voice_id + base64 audio. We use the first preview.
  const res = await fetch('https://api.elevenlabs.io/v1/text-to-voice/create-previews', {
    method: 'POST',
    headers: { 'xi-api-key': KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      voice_description: description,
      text,
      auto_generated_text: false,
    }),
  })
  if (!res.ok) throw new Error(`${res.status}: ${(await res.text()).slice(0, 200)}`)
  const json = await res.json()
  const previews = json.previews || []
  if (!previews.length) throw new Error('no previews returned')
  const preview = previews[0]
  const audio = Buffer.from(preview.audio_base_64, 'base64')
  writeFileSync(`${OUT}/${filename}`, audio)
  return { size: audio.length, generatedVoiceId: preview.generated_voice_id }
}

const manifest = []

for (const v of STOCK_VOICES) {
  process.stdout.write(`Rendering ${v.filename}... `)
  try {
    const size = await ttsForVoice(v.id, SAMPLE_TEXT, v.filename)
    manifest.push({ ...v, kind: 'stock', voice_id: v.id, size_kb: Math.round(size / 1024) })
    console.log(`${Math.round(size / 1024)}KB ✓`)
  } catch (e) {
    console.log(`FAIL — ${e.message}`)
  }
}

for (const d of DESIGN_PROMPTS) {
  process.stdout.write(`Designing ${d.filename}... `)
  try {
    const { size, generatedVoiceId } = await designVoice(d.description, SAMPLE_TEXT, d.filename)
    manifest.push({
      ...d,
      kind: 'design',
      generated_voice_id: generatedVoiceId,
      size_kb: Math.round(size / 1024),
    })
    console.log(`${Math.round(size / 1024)}KB ✓ voice_id=${generatedVoiceId}`)
  } catch (e) {
    console.log(`FAIL — ${e.message}`)
  }
}

// Write a manifest so we can map URLs back to voice IDs
writeFileSync(`${OUT}/manifest.json`, JSON.stringify(manifest, null, 2))

// Tiny HTML index for easy listening
const html = `<!doctype html>
<html><head><meta charset="utf-8"><title>Andrew voice samples</title>
<style>
body{font-family:system-ui,sans-serif;max-width:640px;margin:2rem auto;padding:0 1rem;background:#fffdf5}
h1{font-size:1.4rem}
.sample{border-bottom:1px solid #ccc;padding:1rem 0}
.label{font-weight:600;margin-bottom:.4rem}
.meta{font-size:.8rem;color:#666;margin-bottom:.5rem}
audio{width:100%}
</style></head><body>
<h1>Andrew voice samples</h1>
<p>Play each, pick whichever sounds most like a real Perth bloke on the phone.</p>
${manifest
  .map(
    (m, i) => `<div class="sample">
  <div class="label">${i + 1}. ${m.label}</div>
  <div class="meta">${m.kind === 'stock' ? `stock voice_id: ${m.voice_id}` : `designed voice_id: ${m.generated_voice_id}`} · ${m.size_kb}KB</div>
  <audio controls src="/voice-samples/${m.filename}"></audio>
</div>`
  )
  .join('\n')}
</body></html>`
writeFileSync(`${OUT}/index.html`, html)

console.log(`\nDone. ${manifest.length} samples written to ${OUT}/`)
console.log('Once deployed, listen at https://perthpintprices.com/voice-samples/')
