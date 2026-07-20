import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { NextRequest } from 'next/server'
import { POST } from './route'

describe('push send authentication', () => {
  it('rejects requests when PUSH_API_SECRET is missing', async () => {
    delete process.env.PUSH_API_SECRET
    const response = await POST(new NextRequest('http://localhost/api/push/send', {
      method: 'POST',
      headers: { authorization: 'Bearer undefined', 'content-type': 'application/json' },
      body: JSON.stringify({ title: 'Test', body: 'Test' }),
    }))

    assert.equal(response.status, 401)
  })
})
