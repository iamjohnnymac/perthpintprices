import { readFileSync } from 'node:fs'
import { isDeepStrictEqual } from 'node:util'
import path from 'node:path'

export function assertAndrewDemoVoiceContract(productionConfig, demoConfig) {
  const productionTts = productionConfig?.conversation_config?.tts
  const demoTts = demoConfig?.conversation_config?.tts
  if (!productionTts || !demoTts || !isDeepStrictEqual(demoTts, productionTts)) {
    throw new Error('Andrew demo TTS contract must exactly match agents/andrew.json')
  }
  return demoTts
}

export function readAndrewDemoVoiceContract(rootDir = process.cwd()) {
  const productionConfig = JSON.parse(readFileSync(path.join(rootDir, 'agents/andrew.json'), 'utf8'))
  const demoConfig = JSON.parse(readFileSync(path.join(rootDir, 'agents/andrew-demo.json'), 'utf8'))
  return assertAndrewDemoVoiceContract(productionConfig, demoConfig)
}
