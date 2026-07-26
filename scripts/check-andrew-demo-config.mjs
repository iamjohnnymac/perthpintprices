#!/usr/bin/env node

import { readAndrewDemoVoiceContract } from './lib/andrew-demo-config.mjs'

try {
  readAndrewDemoVoiceContract()
  console.log('[andrew-demo-config] PASS: demo TTS matches the production Andrew voice contract')
} catch (error) {
  console.error(`[andrew-demo-config] FAIL: ${error.message}`)
  process.exit(1)
}
