import assert from 'node:assert/strict'
import { inspectAccessBundle, validateOnlineAccess } from './lib/agent-access.mjs'

assert.deepEqual(inspectAccessBundle('elevenlabs-webhook', {
  ELEVENLABS_POST_CALL_WEBHOOK_SECRET: 'set-but-never-printed',
}), [{ name: 'ELEVENLABS_POST_CALL_WEBHOOK_SECRET', present: true }])

assert.deepEqual(inspectAccessBundle('supabase-admin', {}), [
  { name: 'NEXT_PUBLIC_SUPABASE_URL', present: false },
  { name: 'SUPABASE_SERVICE_ROLE_KEY', present: false },
])

assert.throws(() => inspectAccessBundle('everything', {}), /Unknown access bundle/)

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
