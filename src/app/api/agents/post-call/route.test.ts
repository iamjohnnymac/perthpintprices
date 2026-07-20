import assert from 'node:assert/strict'
import crypto from 'node:crypto'
import { describe, it } from 'node:test'
import { NextRequest } from 'next/server'

import { handlePostCall } from './handler'

function jsonRequest(body: unknown, timestamp = Math.floor(Date.now() / 1000).toString()) {
  const rawBody = JSON.stringify(body)
  const signature = crypto.createHmac('sha256', 'test-secret').update(`${timestamp}.${rawBody}`).digest('hex')
  return new NextRequest('http://localhost/api/agents/post-call', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'elevenlabs-signature': `t=${timestamp},v0=${signature}`,
    },
    body: rawBody,
  })
}

describe('post-call webhook', () => {
  it('rejects the legacy shared-secret header without an HMAC signature', async () => {
    process.env.ELEVENLABS_POST_CALL_WEBHOOK_SECRET = 'test-secret'
    const response = await handlePostCall(new NextRequest('http://localhost/api/agents/post-call', {
      method: 'POST',
      headers: { 'x-agent-secret': 'test-secret' },
      body: JSON.stringify(postCallBody()),
    }), {})

    assert.equal(response.status, 401)
  })

  it('rejects a valid signature with a stale timestamp', async () => {
    process.env.ELEVENLABS_POST_CALL_WEBHOOK_SECRET = 'test-secret'
    const staleTimestamp = (Math.floor(Date.now() / 1000) - 31 * 60).toString()
    const response = await handlePostCall(jsonRequest(postCallBody(), staleTimestamp), {})

    assert.equal(response.status, 401)
  })

  it('writes extracted price data when the mid-call tool missed it', async () => {
    process.env.ELEVENLABS_POST_CALL_WEBHOOK_SECRET = 'test-secret'

    let rpcArgs: Record<string, unknown> | null = null
    const supabase = {
      from(table: string) {
        if (table === 'pubs') {
          return pubsQuery({
            pub: { id: 42, price: null, price_verified: false },
            onUpdate: () => {},
          })
        }
        throw new Error(`Unexpected table ${table}`)
      },
      rpc(fn: string, args: Record<string, unknown>) {
        assert.equal(fn, 'process_agent_post_call')
        rpcArgs = args
        return Promise.resolve({ data: { processed: true, fallback_written: true }, error: null })
      },
    }

    const response = await handlePostCall(jsonRequest(postCallBody()), {
      supabase,
      now: new Date('2026-05-31T00:00:00.000Z'),
    })
    const body = await response.json()

    assert.equal(response.status, 200)
    assert.equal(body.ok, true)
    assert.equal(body.fallback_wrote, true)
    assert.ok(rpcArgs)
    const callLogInsert = (rpcArgs as Record<string, unknown>).p_call_log as Record<string, unknown>
    const pubUpdate = (rpcArgs as Record<string, unknown>).p_pub_updates as Record<string, unknown>
    const historyInsert = (rpcArgs as Record<string, unknown>).p_price_history as Record<string, unknown>
    assert.equal(callLogInsert.parsed_price, 9)
    assert.equal(callLogInsert.parsed_beer_type, 'Swan Draught')
    assert.deepEqual(pubUpdate, {
      price: 9,
      price_verified: true,
      last_verified: '2026-05-31T00:00:00.000Z',
      price_verified_at: '2026-05-31T00:00:00.000Z',
      price_source: 'andrew',
      price_confidence: 'high',
      beer_type: 'Swan Draught',
      happy_hour: 'Mon-Fri 4-6pm',
    })
    assert.deepEqual(historyInsert, {
      pub_id: 42,
      price: 9,
      beer_type: 'Swan Draught',
      change_type: 'phone_agent',
      source: 'ElevenLabs conv_123 (post-call fallback)',
      verified_at: '2026-05-31T00:00:00.000Z',
      confidence: 'high',
    })
  })

  it('logs call initiation failures so failed attempts count toward cooldown', async () => {
    process.env.ELEVENLABS_POST_CALL_WEBHOOK_SECRET = 'test-secret'

    let callLogInsert: Record<string, unknown> | null = null
    const supabase = {
      from(table: string) {
        if (table === 'pubs') return pubPhoneQuery([{ id: 42, phone: '0400 000 003' }])
        if (table === 'phone_call_log') {
          return insertQuery((row) => {
            callLogInsert = row
          })
        }
        throw new Error(`Unexpected table ${table}`)
      },
      rpc() {
        throw new Error('RPC is not used for call initiation failures')
      },
    }

    const response = await handlePostCall(jsonRequest(callInitiationFailureBody()), { supabase })
    const body = await response.json()

    assert.equal(response.status, 200)
    assert.equal(body.ok, true)
    assert.equal(body.logged, 'call_initiation_failure')
    assert.ok(callLogInsert)
    assert.equal((callLogInsert as Record<string, unknown>).pub_id, 42)
    assert.equal((callLogInsert as Record<string, unknown>).call_sid, 'conv_failed_123')
    assert.equal((callLogInsert as Record<string, unknown>).parsed_confidence, 'call_initiation_failure')
  })

  it('returns a server error when call logging fails', async () => {
    process.env.ELEVENLABS_POST_CALL_WEBHOOK_SECRET = 'test-secret'

    const supabase = {
      from(table: string) {
        if (table === 'pubs') {
          return pubsQuery({
            pub: { id: 42, price: null, price_verified: false },
            onUpdate: () => {},
          })
        }
        throw new Error(`Unexpected table ${table}`)
      },
      rpc() {
        return Promise.resolve({ data: null, error: { message: 'transaction failed' } })
      },
    }

    const response = await handlePostCall(jsonRequest(postCallBody()), { supabase })
    const body = await response.json()

    assert.equal(response.status, 500)
    assert.equal(body.ok, false)
    assert.match(body.error, /transaction failed/)
  })

  it('does not claim the delivery when the pub lookup fails', async () => {
    process.env.ELEVENLABS_POST_CALL_WEBHOOK_SECRET = 'test-secret'
    let rpcCalled = false
    const supabase = {
      from(table: string) {
        assert.equal(table, 'pubs')
        return pubsQuery({
          pub: null,
          error: { message: 'database unavailable' },
          onUpdate: () => {},
        })
      },
      rpc() {
        rpcCalled = true
        return Promise.resolve({ data: { processed: true, fallback_written: true }, error: null })
      },
    }

    const response = await handlePostCall(jsonRequest(postCallBody()), { supabase })

    assert.equal(response.status, 500)
    assert.equal(rpcCalled, false)
  })

  it('acknowledges a duplicate delivery without repeating price side effects', async () => {
    process.env.ELEVENLABS_POST_CALL_WEBHOOK_SECRET = 'test-secret'
    let rpcCallCount = 0
    const supabase = {
      from(table: string) {
        if (table === 'pubs') {
          return pubsQuery({
            pub: { id: 42, price: null, price_verified: false },
            onUpdate: () => {},
          })
        }
        throw new Error(`Unexpected table ${table}`)
      },
      rpc() {
        rpcCallCount += 1
        return Promise.resolve({ data: { processed: false, fallback_written: false }, error: null })
      },
    }

    const response = await handlePostCall(jsonRequest(postCallBody()), { supabase })
    const body = await response.json()

    assert.equal(response.status, 200)
    assert.equal(body.duplicate, true)
    assert.equal(rpcCallCount, 1)
  })
})

function postCallBody() {
  return {
    type: 'post_call_transcription',
    event_timestamp: 1770000000,
    data: {
      agent_id: 'agent_123',
      conversation_id: 'conv_123',
      status: 'done',
      call_duration_secs: 42,
      transcript: [
        { role: 'agent', message: 'What is your cheapest pint?' },
        { role: 'user', message: 'Swan Draught is nine dollars, happy hour Mon-Fri 4-6pm.' },
      ],
      analysis: {
        transcript_summary: 'Captured Swan Draught for nine dollars.',
        call_successful: 'success',
        data_collection_results: {
          price: { value: 9 },
          beer_type: { value: 'Swan Draught' },
          unit: { value: 'pint' },
          happy_hour: { value: 'Mon-Fri 4-6pm' },
          confidence: { value: 'high' },
        },
      },
      conversation_initiation_client_data: {
        dynamic_variables: {
          pub_slug: 'test-pub',
        },
      },
    },
  }
}

function callInitiationFailureBody() {
  return {
    type: 'call_initiation_failure',
    event_timestamp: 1770000000,
    data: {
      agent_id: 'agent_123',
      conversation_id: 'conv_failed_123',
      failure_reason: 'busy',
      metadata: {
        type: 'twilio',
        body: {
          To: '+61400000003',
          CallSid: 'CA123',
          CallStatus: 'busy',
        },
      },
    },
  }
}

function pubsQuery(options: {
  pub: { id: number; price: number | null; price_verified: boolean } | null
  error?: { message: string } | null
  onUpdate: (updates: Record<string, unknown>) => void
}) {
  return {
    select() {
      return this
    },
    eq() {
      return this
    },
    maybeSingle() {
      return Promise.resolve({ data: options.pub, error: options.error ?? null })
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

function insertQuery(onInsert: (row: Record<string, unknown>) => void) {
  return {
    insert(row: Record<string, unknown>) {
      onInsert(row)
      return Promise.resolve({ error: null })
    },
  }
}

function pubPhoneQuery(rows: Array<{ id: number; phone: string | null }>) {
  return {
    select() {
      return this
    },
    not() {
      return Promise.resolve({ data: rows, error: null })
    },
  }
}
