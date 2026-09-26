import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { NextRequest } from 'next/server'
import { POST } from './route'

describe('pub submission validation', () => {
  it('rejects incomplete submissions before database access', async () => {
    const response = await POST(new NextRequest('http://localhost/api/pub-submission', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ pub_name: 'Test Pub' }),
    }))

    assert.equal(response.status, 400)
  })

  it('rejects implausible prices before database access', async () => {
    const response = await POST(new NextRequest('http://localhost/api/pub-submission', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ pub_name: 'Test Pub', suburb: 'Perth', price: '100' }),
    }))

    assert.equal(response.status, 400)
  })

  it('rejects malformed JSON as a bad request', async () => {
    const response = await POST(new NextRequest('http://localhost/api/pub-submission', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: 'not-json',
    }))

    assert.equal(response.status, 400)
  })

  it('treats a missing service-role key as a server error, not a bad request', async () => {
    const original = process.env.SUPABASE_SERVICE_ROLE_KEY
    delete process.env.SUPABASE_SERVICE_ROLE_KEY
    try {
      const response = await POST(new NextRequest('http://localhost/api/pub-submission', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ pub_name: 'Test Pub', suburb: 'Perth', price: '9' }),
      }))

      assert.equal(response.status, 500)
    } finally {
      if (original !== undefined) process.env.SUPABASE_SERVICE_ROLE_KEY = original
    }
  })
})
