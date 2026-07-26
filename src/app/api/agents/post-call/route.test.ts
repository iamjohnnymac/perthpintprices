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
        if (table === 'phone_call_log') return emptyDemoReservationQuery()
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

  it('archives a reserved-slug transcription without reading or writing live pub data', async () => {
    process.env.ELEVENLABS_POST_CALL_WEBHOOK_SECRET = 'test-secret'
    process.env.ELEVENLABS_DEMO_AGENT_ID = 'agent_demo_123'
    let archived: Record<string, unknown> | null = null
    let pubsTouched = false
    let rpcCalled = false
    const supabase = {
      from(table: string) {
        if (table === 'pubs' || table === 'price_history') {
          pubsTouched = true
          throw new Error(`Demo call touched ${table}`)
        }
        if (table === 'phone_call_log') {
          return demoCallLogQuery(demoLockRow('conv_demo_post_123'), row => { archived = row })
        }
        throw new Error(`Unexpected table ${table}`)
      },
      rpc() {
        rpcCalled = true
        throw new Error('Demo call must not use the live post-call RPC')
      },
    }
    const event = postCallBody()
    event.data.agent_id = 'agent_demo_123'
    event.data.conversation_id = 'conv_demo_post_123'
    event.data.conversation_initiation_client_data.dynamic_variables.pub_slug = '__ai-demo-no-write__'
    event.data.transcript = [
      { role: 'agent', message: "Hi, I'm Jane Person at 44 King Street." },
      { role: 'user', message: 'This is Jane Person speaking.' },
      { role: 'user', message: 'Call me Jane Person on zero four one two three four five six seven eight.' },
    ]
    const adversarialCollection = event.data.analysis.data_collection_results as Record<string, { value: unknown }>
    adversarialCollection.price = {
      value: "9 Hi, I'm Jane Person at 44 King Street",
    }
    adversarialCollection.beer_type = {
      value: 'Swan Draught Jane Person zero four one two',
    }
    adversarialCollection.unit = {
      value: 'pint Jane Person 44 King Street',
    }
    adversarialCollection.happy_hour = {
      value: 'Mon-Fri 4-6pm call me Jane Person',
    }
    adversarialCollection.confidence = {
      value: 'high Jane Person zero four one two',
    }

    const response = await handlePostCall(jsonRequest(event), { supabase })
    const body = await response.json()
    const serialized = JSON.stringify(archived)

    assert.equal(response.status, 200)
    assert.deepEqual(body, { ok: true, sandbox: true, recorded: false })
    assert.equal(pubsTouched, false)
    assert.equal(rpcCalled, false)
    assert.ok(archived)
    assert.equal((archived as Record<string, unknown>).pub_id, null)
    assert.equal((archived as Record<string, unknown>).call_sid, 'ai-demo-done-conv_demo_post_123')
    assert.equal((archived as Record<string, unknown>).transcript, '[Demo transcript withheld for privacy]')
    assert.equal((archived as Record<string, unknown>).parsed_price, null)
    assert.equal((archived as Record<string, unknown>).parsed_beer_type, null)
    for (const pii of ['Jane Person', '44 King Street', 'zero four one two', "Hi, I'm", 'This is', 'Call me']) {
      assert.equal(serialized.includes(pii), false, `${pii} leaked into the demo call log`)
    }
  })

  it('treats a persisted demo reservation as authoritative for transcription callbacks', async () => {
    process.env.ELEVENLABS_POST_CALL_WEBHOOK_SECRET = 'test-secret'

    for (const demoAgentEnv of [undefined, 'agent_rotated_after_call_started']) {
      if (demoAgentEnv) process.env.ELEVENLABS_DEMO_AGENT_ID = demoAgentEnv
      else delete process.env.ELEVENLABS_DEMO_AGENT_ID

      let archived: Record<string, unknown> | null = null
      const touchedTables: string[] = []
      let rpcCalled = false
      const callRows = [
        ...unrelatedDemoHistory(150),
        demoLockRow('conv_demo_authoritative_123'),
      ]
      const supabase = {
        from(table: string) {
          touchedTables.push(table)
          if (table === 'phone_call_log') {
            return indexedDemoCallLogQuery(callRows, row => { archived = row })
          }
          throw new Error(`Persisted demo reservation touched ${table}`)
        },
        rpc() {
          rpcCalled = true
          throw new Error('Persisted demo reservation must not use an RPC')
        },
      }
      const event = postCallBody()
      event.data.agent_id = 'agent_demo_123'
      event.data.conversation_id = 'conv_demo_authoritative_123'
      event.data.conversation_initiation_client_data.dynamic_variables.pub_slug = 'test-pub'
      event.data.transcript = [
        { role: 'agent', message: "Hi, I'm Jane Person at 44 King Street." },
        { role: 'user', message: 'Call zero four one two three four five six seven eight.' },
      ]
      event.data.analysis.transcript_summary = 'Jane Person at 44 King Street quoted nine dollars.'
      const collection = event.data.analysis.data_collection_results as Record<string, { value: unknown }>
      collection.price = { value: "9 Jane Person at 44 King Street" }
      collection.beer_type = { value: 'Swan Draught Jane Person' }
      collection.happy_hour = { value: 'Mon-Fri 4-6pm call zero four one two' }
      collection.confidence = { value: 'high Jane Person' }

      const response = await handlePostCall(jsonRequest(event), { supabase })
      const body = await response.json()
      const serialized = JSON.stringify(archived)

      assert.equal(response.status, 200)
      assert.deepEqual(body, { ok: true, sandbox: true, recorded: false })
      assert.deepEqual([...new Set(touchedTables)], ['phone_call_log'])
      assert.equal(rpcCalled, false)
      assert.ok(archived)
      assert.equal((archived as Record<string, unknown>).pub_id, null)
      assert.equal((archived as Record<string, unknown>).call_sid, 'ai-demo-done-conv_demo_authoritative_123')
      assert.equal((archived as Record<string, unknown>).transcript, '[Demo transcript withheld for privacy]')
      assert.equal((archived as Record<string, unknown>).parsed_price, null)
      assert.equal((archived as Record<string, unknown>).parsed_beer_type, null)
      for (const unsafeValue of ['Jane Person', '44 King Street', 'zero four one two', 'test-pub']) {
        assert.equal(serialized.includes(unsafeValue), false, `${unsafeValue} leaked into persisted demo log`)
      }
    }
  })

  it('uses an exact archived demo call SID after more than 100 unrelated null-pub rows', async () => {
    process.env.ELEVENLABS_POST_CALL_WEBHOOK_SECRET = 'test-secret'
    process.env.ELEVENLABS_DEMO_AGENT_ID = 'agent_rotated_after_call_started'
    let inserted: Record<string, unknown> | null = null
    let pubsTouched = false
    let rpcCalled = false
    const conversationId = 'conv_demo_archived_123'
    const archivedRow = {
      pub_id: null,
      call_sid: `ai-demo-done-${conversationId}`,
      parsed_notes: JSON.stringify({
        kind: 'ai_demo_test_call',
        agent_id: 'agent_demo_123',
        destination_mask: '+61 ••• ••• 955',
        destination_hash: 'destination-hash',
        conversation_id: conversationId,
        status: 'done',
      }),
    }
    const callRows = [...unrelatedDemoHistory(150), archivedRow]
    const supabase = {
      from(table: string) {
        if (table === 'pubs' || table === 'price_history') {
          pubsTouched = true
          throw new Error(`Archived demo reservation touched ${table}`)
        }
        if (table === 'phone_call_log') {
          return indexedDemoCallLogQuery(callRows, row => { inserted = row })
        }
        throw new Error(`Unexpected table ${table}`)
      },
      rpc() {
        rpcCalled = true
        throw new Error('Archived demo reservation must not use an RPC')
      },
    }
    const event = postCallBody()
    event.data.agent_id = 'agent_demo_123'
    event.data.conversation_id = conversationId
    event.data.conversation_initiation_client_data.dynamic_variables.pub_slug = 'test-pub'
    event.data.transcript = [{ role: 'user', message: 'Jane Person at 44 King Street.' }]
    event.data.analysis.transcript_summary = 'Call zero four one two three four five six seven eight.'

    const response = await handlePostCall(jsonRequest(event), { supabase })
    const body = await response.json()
    const serialized = JSON.stringify(inserted)

    assert.equal(response.status, 200)
    assert.deepEqual(body, { ok: true, duplicate: true })
    assert.equal(pubsTouched, false)
    assert.equal(rpcCalled, false)
    assert.ok(inserted)
    assert.equal((inserted as Record<string, unknown>).transcript, '[Demo transcript withheld for privacy]')
    for (const unsafeValue of ['Jane Person', '44 King Street', 'zero four one two', 'test-pub']) {
      assert.equal(serialized.includes(unsafeValue), false, `${unsafeValue} leaked into archived demo handling`)
    }
  })

  it('archives a demo initiation failure without storing the destination or raw provider metadata', async () => {
    process.env.ELEVENLABS_POST_CALL_WEBHOOK_SECRET = 'test-secret'
    process.env.ELEVENLABS_DEMO_AGENT_ID = 'agent_demo_123'
    let archived: Record<string, unknown> | null = null
    let pubsTouched = false
    const supabase = {
      from(table: string) {
        if (table === 'pubs' || table === 'price_history') {
          pubsTouched = true
          throw new Error(`Demo failure touched ${table}`)
        }
        if (table === 'phone_call_log') {
          return demoCallLogQuery(demoLockRow('conv_failed_123'), row => { archived = row })
        }
        throw new Error(`Unexpected table ${table}`)
      },
      rpc() {
        throw new Error('Demo failure must not use an RPC')
      },
    }
    const event = callInitiationFailureBody()
    event.data.agent_id = 'agent_demo_123'
    event.data.failure_reason = 'Contact Jane Person at jane@example.com'

    const response = await handlePostCall(jsonRequest(event), { supabase })
    const serialized = JSON.stringify(archived)

    assert.equal(response.status, 200)
    assert.equal(pubsTouched, false)
    assert.ok(archived)
    assert.equal((archived as Record<string, unknown>).call_sid, 'ai-demo-failed-conv_failed_123')
    assert.equal((archived as Record<string, unknown>).transcript, '[Demo transcript withheld for privacy]')
    for (const pii of ['+61400000003', 'CA123', 'Jane Person', 'jane@example.com', 'CallStatus', 'metadata']) {
      assert.equal(serialized.includes(pii), false, `${pii} leaked into the demo failure log`)
    }
  })

  it('uses the persisted reservation when the demo agent env is missing during failure callback', async () => {
    process.env.ELEVENLABS_POST_CALL_WEBHOOK_SECRET = 'test-secret'
    delete process.env.ELEVENLABS_DEMO_AGENT_ID
    let archived: Record<string, unknown> | null = null
    let pubsTouched = false
    const supabase = {
      from(table: string) {
        if (table === 'pubs' || table === 'price_history') {
          pubsTouched = true
          throw new Error(`Persisted demo reservation touched ${table}`)
        }
        if (table === 'phone_call_log') {
          return demoCallLogQuery(demoLockRow('conv_failed_123'), row => { archived = row })
        }
        throw new Error(`Unexpected table ${table}`)
      },
      rpc() { throw new Error('Persisted demo reservation must not use an RPC') },
    }
    const event = callInitiationFailureBody()
    event.data.agent_id = 'agent_demo_123'

    const response = await handlePostCall(jsonRequest(event), { supabase })

    assert.equal(response.status, 200)
    assert.equal(pubsTouched, false)
    assert.equal((archived as Record<string, unknown> | null)?.call_sid, 'ai-demo-failed-conv_failed_123')
    assert.equal((archived as Record<string, unknown> | null)?.transcript, '[Demo transcript withheld for privacy]')
  })

  it('uses the persisted reservation when the demo agent env changes during failure callback', async () => {
    process.env.ELEVENLABS_POST_CALL_WEBHOOK_SECRET = 'test-secret'
    process.env.ELEVENLABS_DEMO_AGENT_ID = 'agent_rotated_after_call_started'
    let archived: Record<string, unknown> | null = null
    let pubsTouched = false
    const supabase = {
      from(table: string) {
        if (table === 'pubs' || table === 'price_history') {
          pubsTouched = true
          throw new Error(`Rotated demo reservation touched ${table}`)
        }
        if (table === 'phone_call_log') {
          return demoCallLogQuery(demoLockRow('conv_failed_123'), row => { archived = row })
        }
        throw new Error(`Unexpected table ${table}`)
      },
      rpc() { throw new Error('Rotated demo reservation must not use an RPC') },
    }
    const event = callInitiationFailureBody()
    event.data.agent_id = 'agent_demo_123'

    const response = await handlePostCall(jsonRequest(event), { supabase })

    assert.equal(response.status, 200)
    assert.equal(pubsTouched, false)
    assert.equal((archived as Record<string, unknown> | null)?.call_sid, 'ai-demo-failed-conv_failed_123')
    assert.equal(JSON.stringify(archived).includes('+61400000003'), false)
  })

  it('returns a server error when call logging fails', async () => {
    process.env.ELEVENLABS_POST_CALL_WEBHOOK_SECRET = 'test-secret'

    const supabase = {
      from(table: string) {
        if (table === 'phone_call_log') return emptyDemoReservationQuery()
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
        if (table === 'phone_call_log') return emptyDemoReservationQuery()
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
        if (table === 'phone_call_log') return emptyDemoReservationQuery()
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
    select() { return this },
    eq() { return this },
    is() { return this },
    order() { return this },
    limit() { return Promise.resolve({ data: [], error: null }) },
    maybeSingle() { return Promise.resolve({ data: null, error: null }) },
    insert(row: Record<string, unknown>) {
      onInsert(row)
      return Promise.resolve({ error: null })
    },
  }
}

function emptyDemoReservationQuery() {
  return {
    select() { return this },
    eq() { return this },
    maybeSingle() { return Promise.resolve({ data: null, error: null }) },
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

function demoLockRow(conversationId: string) {
  return {
    pub_id: null,
    call_sid: '__ai-demo-active-call__',
    parsed_notes: JSON.stringify({
      kind: 'ai_demo_test_call',
      agent_id: 'agent_demo_123',
      destination_mask: '+61 ••• ••• 955',
      destination_hash: 'destination-hash',
      conversation_id: conversationId,
      status: 'initiated',
    }),
  }
}

function demoCallLogQuery(
  lockRow: ReturnType<typeof demoLockRow>,
  onUpdate: (row: Record<string, unknown>) => void,
) {
  return {
    select() { return this },
    eq() { return this },
    is() { return this },
    order() { return this },
    limit() { return Promise.resolve({ data: [lockRow], error: null }) },
    maybeSingle() { return Promise.resolve({ data: lockRow, error: null }) },
    update(row: Record<string, unknown>) {
      onUpdate(row)
      return this
    },
  }
}

function unrelatedDemoHistory(count: number) {
  return Array.from({ length: count }, (_, index) => ({
    pub_id: null,
    call_sid: `unrelated-null-pub-${index}`,
    parsed_notes: null,
  }))
}

function indexedDemoCallLogQuery(
  rows: Array<{ pub_id: number | null; call_sid: string; parsed_notes: string | null }>,
  onWrite: (row: Record<string, unknown>) => void,
) {
  let callSid: string | null = null
  let write: Record<string, unknown> | null = null
  return {
    select() { return this },
    eq(column: string, value: string) {
      assert.equal(column, 'call_sid')
      callSid = value
      if (write) onWrite(write)
      return this
    },
    maybeSingle() {
      return Promise.resolve({
        data: rows.find(row => row.call_sid === callSid) || null,
        error: null,
      })
    },
    update(row: Record<string, unknown>) {
      write = row
      return this
    },
    insert(row: Record<string, unknown>) {
      onWrite(row)
      const duplicate = rows.some(existing => existing.call_sid === row.call_sid)
      return Promise.resolve({ error: duplicate ? { code: '23505' } : null })
    },
  }
}
