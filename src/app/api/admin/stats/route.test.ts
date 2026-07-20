import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { NextRequest } from 'next/server'
import { handleAdminStats } from './route'

describe('admin stats authentication', () => {
  it('reserves a failed attempt using the durable database limiter', async () => {
    process.env.ADMIN_PASSWORD = 'correct-password'
    const rpcCalls: string[] = []
    const client = {
      async rpc(name: string) {
        rpcCalls.push(name)
        return { data: { allowed: true }, error: null }
      },
      from() {
        return { insert: async () => ({ error: null }) }
      },
    }

    const response = await handleAdminStats(new NextRequest('http://localhost/api/admin/stats', {
      headers: { authorization: 'Bearer wrong-password', 'x-forwarded-for': '192.0.2.1' },
    }), { getServiceClient: () => client as never })

    assert.equal(response.status, 401)
    assert.deepEqual(rpcCalls, ['reserve_admin_auth_attempt'])
  })

  it('returns 429 when the failed attempt crosses the durable limit', async () => {
    process.env.ADMIN_PASSWORD = 'correct-password'
    const client = {
      async rpc(name: string) {
        assert.equal(name, 'reserve_admin_auth_attempt')
        return { data: { allowed: false, retry_after_seconds: 900 }, error: null }
      },
      from() {
        return { insert: async () => ({ error: null }) }
      },
    }

    const response = await handleAdminStats(new NextRequest('http://localhost/api/admin/stats', {
      headers: { authorization: 'Bearer wrong-password', 'x-forwarded-for': '192.0.2.2' },
    }), { getServiceClient: () => client as never })

    assert.equal(response.status, 429)
    assert.equal(response.headers.get('retry-after'), '900')
  })
})
