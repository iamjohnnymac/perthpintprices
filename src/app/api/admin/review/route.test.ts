import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { NextRequest } from 'next/server'
import { handleAdminReview } from './route'

describe('admin review authentication', () => {
  it('uses the shared durable limiter before privileged writes', async () => {
    process.env.ADMIN_PASSWORD = 'correct-password'
    const client = {
      async rpc(name: string) {
        assert.equal(name, 'reserve_admin_auth_attempt')
        return { data: { allowed: false, retry_after_seconds: 700 }, error: null }
      },
    }
    const response = await handleAdminReview(new NextRequest('http://localhost/api/admin/review', {
      method: 'POST',
      headers: { authorization: 'Bearer wrong-password', 'x-forwarded-for': '192.0.2.3' },
      body: '{}',
    }), { getServiceClient: () => client as never })

    assert.equal(response.status, 429)
    assert.equal(response.headers.get('retry-after'), '700')
  })
})
