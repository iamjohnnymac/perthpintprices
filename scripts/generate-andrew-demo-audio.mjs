#!/usr/bin/env node

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'
import { config } from 'dotenv'

config({ path: process.env.ELEVENLABS_ENV_FILE || '.env.local', quiet: true })

const apiKey = process.env.ELEVENLABS_API_KEY
if (!apiKey) {
  console.error('Missing ELEVENLABS_API_KEY')
  process.exit(1)
}

const agent = JSON.parse(readFileSync('agents/andrew.json', 'utf8'))
const tts = agent.conversation_config.tts
// Conversational AI uses a channel-specific v3 model ID; the equivalent
// Text-to-Speech API model is `eleven_v3`.
const modelId = tts.model_id === 'eleven_v3_conversational' ? 'eleven_v3' : tts.model_id
const outputPath = 'public/audio/andrew-price-check.mp3'
const text =
  'Hi, is this the Example Arms? Andrew here from Perth Pint Prices. Would you be able to help me with your cheapest pint today, what it is, and any happy hour you run?'

const response = await fetch(
  `https://api.elevenlabs.io/v1/text-to-speech/${tts.voice_id}?output_format=mp3_44100_128`,
  {
    method: 'POST',
    headers: {
      'xi-api-key': apiKey,
      'Content-Type': 'application/json',
      Accept: 'audio/mpeg',
    },
    body: JSON.stringify({
      text,
      model_id: modelId,
      voice_settings: {
        stability: tts.stability,
        similarity_boost: tts.similarity_boost,
        speed: tts.speed,
      },
    }),
  },
)

if (!response.ok) {
  throw new Error(`ElevenLabs TTS failed with status ${response.status}`)
}

const audio = Buffer.from(await response.arrayBuffer())
mkdirSync(dirname(outputPath), { recursive: true })
writeFileSync(outputPath, audio)
console.log(`Created ${outputPath} (${Math.round(audio.length / 1024)} KB)`)
