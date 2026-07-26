import assert from 'node:assert/strict'
import { inspectAccessBundle, validateOnlineAccess } from './lib/agent-access.mjs'
import { assertAndrewDemoVoiceContract, readAndrewDemoVoiceContract } from './lib/andrew-demo-config.mjs'

assert.deepEqual(inspectAccessBundle('elevenlabs-webhook', {
  ELEVENLABS_POST_CALL_WEBHOOK_SECRET: 'set-but-never-printed',
}), [{ name: 'ELEVENLABS_POST_CALL_WEBHOOK_SECRET', present: true }])

assert.deepEqual(inspectAccessBundle('supabase-admin', {}), [
  { name: 'NEXT_PUBLIC_SUPABASE_URL', present: false },
  { name: 'SUPABASE_SERVICE_ROLE_KEY', present: false },
])

assert.throws(() => inspectAccessBundle('everything', {}), /Unknown access bundle/)

const ownerDemoEnv = {
  ELEVENLABS_API_KEY: 'set-but-never-printed',
  ELEVENLABS_AGENT_ID: 'agent_production',
  ELEVENLABS_DEMO_AGENT_ID: 'agent_demo',
  ELEVENLABS_PHONE_NUMBER_ID: 'phone_outbound',
  AI_DEMO_TEST_PHONE_E164: '+61999999999',
}
const ownerDemo = inspectAccessBundle('andrew-owner-demo', ownerDemoEnv)
assert.equal(ownerDemo.every(check => check.present), true)
assert.equal(JSON.stringify(ownerDemo).includes(ownerDemoEnv.AI_DEMO_TEST_PHONE_E164), false)
assert.equal(inspectAccessBundle('andrew-owner-demo', {
  ...ownerDemoEnv,
  ELEVENLABS_DEMO_AGENT_ID: ownerDemoEnv.ELEVENLABS_AGENT_ID,
}).find(check => check.name === 'ELEVENLABS_DEMO_AGENT_ID')?.present, false)
assert.equal(inspectAccessBundle('andrew-owner-demo', {
  ...ownerDemoEnv,
  AI_DEMO_TEST_PHONE_E164: '9999999999',
}).find(check => check.name === 'AI_DEMO_TEST_PHONE_E164')?.present, false)

const pinnedVoice = readAndrewDemoVoiceContract()
assert.equal(typeof pinnedVoice.voice_id, 'string')
assert.throws(() => assertAndrewDemoVoiceContract(
  { conversation_config: { tts: pinnedVoice } },
  { conversation_config: { tts: { ...pinnedVoice, speed: 1 } } },
), /must exactly match/)

let request
const online = await validateOnlineAccess('supabase-read', {
  NEXT_PUBLIC_SUPABASE_URL: 'https://project.supabase.co',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: 'public-key',
}, async (url, options) => {
  request = { url, options }
  return { ok: true, status: 200 }
})
assert.deepEqual(online, { verified: true, status: 200 })
assert.equal(request.url, 'https://project.supabase.co/rest/v1/pubs?select=id&limit=1')
assert.equal(request.options.headers.apikey, 'public-key')
await assert.rejects(validateOnlineAccess('elevenlabs-webhook', {}, async () => ({ ok: true })), /No safe online/)
