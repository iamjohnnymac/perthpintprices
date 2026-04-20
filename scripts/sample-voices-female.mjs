#!/usr/bin/env node
/**
 * Female voice samples — same pattern as sample-voices.mjs but for a female
 * agent "Andie" (or whatever we name her). Writes to public/voice-samples-female/.
 *
 * Usage: node scripts/sample-voices-female.mjs
 */
import { writeFileSync, mkdirSync } from 'node:fs'
import { config } from 'dotenv'

config({ path: '.env.local' })

const KEY = process.env.ELEVENLABS_API_KEY
if (!KEY) {
  console.error('Missing ELEVENLABS_API_KEY')
  process.exit(1)
}

const SAMPLE_TEXT =
  "Hi, is this The Sail and Anchor? Awesome. Andie here from Perth Pint Prices dot com — free site for the cheap pints around Perth. Would you be able to help me out with a quick price check? What's your cheapest pint, what it is, and any happy hour you run?"

const MODEL = 'eleven_flash_v2'
const OUT = 'public/voice-samples-female'

mkdirSync(OUT, { recursive: true })

// Stock AU female voices from the shared library, including some not surfaced
// by the library's "Australian accent" filter but confirmed AU-female via
// community databases / research.
const STOCK_VOICES = [
  { id: 'aEO01A4wXwd1O8GPgGlF', filename: '01-arabella.mp3', label: 'Arabella — young AU female' },
  { id: 'ZkDZ5VCyH0GGbxO7o4aO', filename: '02-anne.mp3', label: 'Anne — friendly & relaxed AU' },
  { id: 'XuvMi7mpVgif9dcUzS0s', filename: '03-keira.mp3', label: 'Keira — calm, natural AU' },
  { id: 'cvpTJfe9LINpHIOmB2Hp', filename: '04-charlotte-warm.mp3', label: 'Charlotte — warm & conversational AU' },
  { id: 'xt3wCRKY70KCKXOqNH5h', filename: '05-isla.mp3', label: 'Isla — soft, natural AU' },
  { id: 'ZqZk4opejOmuQh96jYMp', filename: '06-annalise.mp3', label: 'Annalise — mature, educated AU' },
  { id: 'M7ya1YbaeFaPXljg9BpK', filename: '07-hannah.mp3', label: 'Hannah — natural AU (community favourite)' },
  { id: '319bKIhetA5g6tmywrwj', filename: '08-gemma.mp3', label: 'Gemma — young AU female' },
]

// Skipped Voice Design this round — the prompt-to-voice outputs keep
// slipping into American vowels despite Aussie-accent prompts.
const DESIGN_PROMPTS = []

async function ttsForVoice(voiceId, text, filename) {
  const res = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_22050_32`,
    {
      method: 'POST',
      headers: { 'xi-api-key': KEY, 'Content-Type': 'application/json', Accept: 'audio/mpeg' },
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
  const res = await fetch('https://api.elevenlabs.io/v1/text-to-voice/create-previews', {
    method: 'POST',
    headers: { 'xi-api-key': KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ voice_description: description, text, auto_generated_text: false }),
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
    manifest.push({ ...d, kind: 'design', generated_voice_id: generatedVoiceId, size_kb: Math.round(size / 1024) })
    console.log(`${Math.round(size / 1024)}KB ✓ voice_id=${generatedVoiceId}`)
  } catch (e) {
    console.log(`FAIL — ${e.message}`)
  }
}

writeFileSync(`${OUT}/manifest.json`, JSON.stringify(manifest, null, 2))

const html = `<!doctype html>
<html><head><meta charset="utf-8"><title>Andie voice samples</title>
<style>
body{font-family:system-ui,sans-serif;max-width:640px;margin:2rem auto;padding:0 1rem;background:#fffdf5}
h1{font-size:1.4rem}
.sample{border-bottom:1px solid #ccc;padding:1rem 0}
.label{font-weight:600;margin-bottom:.4rem}
.meta{font-size:.8rem;color:#666;margin-bottom:.5rem}
audio{width:100%}
</style></head><body>
<h1>Andie (female) voice samples</h1>
<p>Play each, pick whichever sounds most like a real Perth woman on the phone.</p>
${manifest
  .map(
    (m, i) => `<div class="sample">
  <div class="label">${i + 1}. ${m.label}</div>
  <div class="meta">${m.kind === 'stock' ? `stock voice_id: ${m.voice_id}` : `designed voice_id: ${m.generated_voice_id}`} · ${m.size_kb}KB</div>
  <audio controls src="/voice-samples-female/${m.filename}"></audio>
</div>`
  )
  .join('\n')}
</body></html>`
writeFileSync(`${OUT}/index.html`, html)

console.log(`\nDone. ${manifest.length} samples written to ${OUT}/`)
console.log('Once deployed, listen at https://perthpintprices.com/voice-samples-female/')
