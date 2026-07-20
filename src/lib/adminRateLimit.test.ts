import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { clearAdminRateLimit, hashAdminClient, reserveAdminAuthAttempt } from './adminRateLimit'

describe('admin rate limiter', () => {
  it('hashes client addresses with a secret before storage', () => {
    const hash = hashAdminClient('192.0.2.1', 'admin-secret')
    assert.equal(hash.length, 64)
    assert.equal(hash.includes('192.0.2.1'), false)
  })

  it('uses database RPCs to reserve and clear attempts', async () => {
    const calls: string[] = []
    const supabase = {
      async rpc(name: string) {
        calls.push(name)
        return { data: { allowed: false, retry_after_seconds: 900 }, error: null }
      },
    }
    assert.deepEqual(await reserveAdminAuthAttempt(supabase as never, 'hash'), {
      allowed: false,
      retryAfterSeconds: 900,
    })
    await clearAdminRateLimit(supabase as never, 'hash')
    assert.deepEqual(calls, ['reserve_admin_auth_attempt', 'clear_admin_rate_limit'])
  })
})
