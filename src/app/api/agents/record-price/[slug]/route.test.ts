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
  it('returns a sandbox proposal for the reserved slug without touching Supabase', async () => {
    process.env.ELEVENLABS_RECORD_PRICE_TOOL_SECRET = 'test-secret'
    let getSupabaseCalled = false

    const response = await handleRecordPrice(
      jsonRequest({
        price: 9,
        beer_type: 'Swan Draught',
        happy_hour: 'Mon-Fri 4-6pm',
        confidence: 'high',
      }),
      { params: { slug: '__ai-demo-no-write__' } },
      {
        getSupabase: () => {
          getSupabaseCalled = true
          throw new Error('sandbox must not create a Supabase client')
        },
      },
    )
    const body = await response.json()

    assert.equal(response.status, 200)
    assert.equal(getSupabaseCalled, false)
    assert.deepEqual(body, {
      ok: true,
      sandbox: true,
      recorded: false,
      proposed: {
        pint_price: 9,
        unit: 'pint',
        beer_type: 'Swan Draught',
        happy_hour: 'Mon–Fri · 4–6pm',
        confidence: 'high',
      },
    })
  })

  it('returns only strict demo fields when provider tool input contains personal details', async () => {
    process.env.ELEVENLABS_RECORD_PRICE_TOOL_SECRET = 'test-secret'
    let getSupabaseCalled = false
    const unsafeValues = [
      'Jane Person',
      '44 King Street',
      'zero four one two three four five six seven eight',
      'jane@example.com',
      'conv_Jane_Person_0412345678',
    ]

    const response = await handleRecordPrice(
      jsonRequest({
        price: 9,
        unit: 'pint',
        beer_type: 'Swan Draught Jane Person at 44 King Street',
        happy_hour: 'Mon-Fri 4-6pm call zero four one two three four five six seven eight',
        confidence: 'high Jane Person',
        raw_quote: 'This is Jane Person at 44 King Street; jane@example.com',
        conversation_id: 'conv_Jane_Person_0412345678',
      }),
      { params: { slug: '__ai-demo-no-write__' } },
      {
        getSupabase: () => {
          getSupabaseCalled = true
          throw new Error('sandbox must not create a Supabase client')
        },
      },
    )
    const body = await response.json()
    const serialized = JSON.stringify(body)

    assert.equal(response.status, 200)
    assert.equal(getSupabaseCalled, false)
    assert.deepEqual(body, {
      ok: true,
      sandbox: true,
      recorded: false,
      proposed: {
        pint_price: 9,
        unit: 'pint',
        beer_type: null,
        happy_hour: null,
        confidence: null,
      },
    })
    for (const unsafeValue of unsafeValues) {
      assert.equal(serialized.includes(unsafeValue), false, `${unsafeValue} leaked into provider tool response metadata`)
    }
  })

  it('keeps validation active for an unusable reserved-slug capture without touching Supabase', async () => {
    process.env.ELEVENLABS_RECORD_PRICE_TOOL_SECRET = 'test-secret'
    let getSupabaseCalled = false

    const response = await handleRecordPrice(
      jsonRequest({
        price: '99 Jane Person at 44 King Street',
        beer_type: 'This is Jane Person speaking',
        happy_hour: 'Call zero four one two three four five six seven eight',
        raw_quote: 'Jane Person, 44 King Street',
      }),
      { params: { slug: '__ai-demo-no-write__' } },
      {
        getSupabase: () => {
          getSupabaseCalled = true
          throw new Error('sandbox must not create a Supabase client')
        },
      },
    )

    const body = await response.json()
    const serialized = JSON.stringify(body)

    assert.equal(response.status, 400)
    assert.equal(getSupabaseCalled, false)
    assert.equal(serialized.includes('Jane Person'), false)
    assert.equal(serialized.includes('44 King Street'), false)
  })

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

  it('keeps the real-slug read and transaction path unchanged', async () => {
    process.env.ELEVENLABS_RECORD_PRICE_TOOL_SECRET = 'test-secret'
    const tables: string[] = []
    const rpcs: string[] = []
    const supabase = {
      from(table: string) {
        tables.push(table)
        return pubsQuery({
          pub: { id: 7, slug: 'real-pub', suburb: 'Perth', name: 'Real Pub', price: 12, price_verified: true },
          onUpdate: () => {},
        })
      },
      rpc(fn: string) {
        rpcs.push(fn)
        return Promise.resolve({ data: null, error: null })
      },
    }

    const response = await handleRecordPrice(
      jsonRequest({ price: 11, beer_type: 'Emu Export' }),
      { params: { slug: 'real-pub' } },
      { supabase },
    )

    assert.equal(response.status, 200)
    assert.deepEqual(tables, ['pubs'])
    assert.deepEqual(rpcs, ['record_agent_price'])
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
