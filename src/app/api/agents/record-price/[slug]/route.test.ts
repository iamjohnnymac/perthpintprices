import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { NextRequest } from 'next/server'

import { handleRecordPrice } from './handler'

function jsonRequest(body: unknown) {
  return new NextRequest('http://localhost/api/agents/record-price/test-pub', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-agent-secret': 'test-secret',
    },
    body: JSON.stringify(body),
  })
}

describe('record-price route', () => {
  it('does not bump last_verified for happy-hour-only captures', async () => {
    process.env.ELEVENLABS_RECORD_PRICE_TOOL_SECRET = 'test-secret'

    let rpcArgs: Record<string, unknown> | null = null
    const supabase = {
      from(table: string) {
        if (table === 'pubs') {
          return pubsQuery({
            pub: { id: 42, name: 'Test Pub', price: 12, price_verified: true },
            onUpdate: () => {},
          })
        }
        throw new Error(`Unexpected table ${table}`)
      },
      rpc(fn: string, args: Record<string, unknown>) {
        assert.equal(fn, 'record_agent_price')
        rpcArgs = args
        return Promise.resolve({ data: null, error: null })
      },
    }

    const response = await handleRecordPrice(
      jsonRequest({ happy_hour: 'Mon-Fri 4-6pm $8 pints', confidence: 'medium' }),
      { params: { slug: 'test-pub' } },
      { supabase, now: new Date('2026-05-31T00:00:00.000Z') },
    )
    const body = await response.json()

    assert.equal(response.status, 200)
    assert.equal(body.ok, true)
    assert.ok(rpcArgs)
    assert.deepEqual((rpcArgs as Record<string, unknown>).p_pub_updates, { happy_hour: 'Mon-Fri 4-6pm $8 pints' })
    assert.equal((rpcArgs as Record<string, unknown>).p_price_history, null)
  })

  it('persists provenance when Andrew records a price', async () => {
    process.env.ELEVENLABS_RECORD_PRICE_TOOL_SECRET = 'test-secret'

    let rpcArgs: Record<string, unknown> | null = null
    const supabase = {
      from(table: string) {
        if (table === 'pubs') {
          return pubsQuery({
            pub: { id: 42, slug: 'test-pub', suburb: 'Perth', name: 'Test Pub', price: 12, price_verified: true },
            onUpdate: () => {},
          })
        }
        throw new Error(`Unexpected table ${table}`)
      },
      rpc(fn: string, args: Record<string, unknown>) {
        assert.equal(fn, 'record_agent_price')
        rpcArgs = args
        return Promise.resolve({ data: null, error: null })
      },
    }

    const response = await handleRecordPrice(
      jsonRequest({ price: 10, beer_type: 'Swan Draught', confidence: 'high', conversation_id: 'conv_123' }),
      { params: { slug: 'test-pub' } },
      { supabase, now: new Date('2026-05-31T00:00:00.000Z') },
    )
    const body = await response.json()

    assert.equal(response.status, 200)
    assert.equal(body.ok, true)
    assert.ok(rpcArgs)
    assert.deepEqual((rpcArgs as Record<string, unknown>).p_pub_updates, {
      price: 10,
      price_verified: true,
      last_verified: '2026-05-31T00:00:00.000Z',
      price_verified_at: '2026-05-31T00:00:00.000Z',
      price_source: 'andrew',
      price_confidence: 'high',
      beer_type: 'Swan Draught',
    })
    assert.deepEqual((rpcArgs as Record<string, unknown>).p_price_history, {
      pub_id: 42,
      price: 10,
      beer_type: 'Swan Draught',
      change_type: 'phone_agent',
      source: 'ElevenLabs conv_123',
      verified_at: '2026-05-31T00:00:00.000Z',
      confidence: 'high',
    })
  })
})

function pubsQuery(options: {
  pub: { id: number; slug?: string; suburb?: string; name: string; price: number; price_verified: boolean }
  onUpdate: (updates: Record<string, unknown>) => void
}) {
  return {
    select() {
      return this
    },
    eq() {
      return this
    },
    single() {
      return Promise.resolve({ data: options.pub, error: null })
    },
    update(updates: Record<string, unknown>) {
      options.onUpdate(updates)
      return this
    },
    then(resolve: (value: { error: null }) => void) {
      resolve({ error: null })
    },
  }
}
