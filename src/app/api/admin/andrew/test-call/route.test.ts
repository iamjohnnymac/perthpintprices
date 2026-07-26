import assert from 'node:assert/strict'
import { createHmac } from 'node:crypto'
import { describe, it } from 'node:test'
import { NextRequest, NextResponse } from 'next/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import { handleAndrewTestCallGet, handleAndrewTestCallPost } from './handler'

const NOW = new Date('2026-07-26T04:00:00.000Z')
const DESTINATION = `+${'9'.repeat(11)}`
const AGENT_ID = 'agent_demo_123'
const CONVERSATION_ID = 'conv_demo_123456'

function configureEnv() {
  process.env.ELEVENLABS_API_KEY = 'xi_test'
  process.env.ELEVENLABS_DEMO_AGENT_ID = AGENT_ID
  process.env.ELEVENLABS_PHONE_NUMBER_ID = 'phone_demo_123'
  process.env.AI_DEMO_TEST_PHONE_E164 = DESTINATION
  process.env.ELEVENLABS_AGENT_ID = 'agent_production_123'
}

function postRequest(body: unknown) {
  return new NextRequest('http://localhost/api/admin/andrew/test-call', {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: 'Bearer test' },
    body: JSON.stringify(body),
  })
}

function getRequest(conversationId?: string) {
  const suffix = conversationId ? `?conversation_id=${encodeURIComponent(conversationId)}` : ''
  return new NextRequest(`http://localhost/api/admin/andrew/test-call${suffix}`, {
    headers: { authorization: 'Bearer test' },
  })
}

function deniedAuth() {
  return Promise.resolve({
    authenticated: false as const,
    response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
  })
}

function allowedAuth(supabase: SupabaseClient) {
  return () => Promise.resolve({ authenticated: true as const, supabase })
}

function demoNotes(status: string, conversationId?: string, agentId = AGENT_ID) {
  return JSON.stringify({
    kind: 'ai_demo_test_call',
    agent_id: agentId,
    destination_mask: '+•• ••• ••• 999',
    destination_hash: createHmac('sha256', 'xi_test').update(DESTINATION).digest('hex'),
    ...(conversationId ? { conversation_id: conversationId } : {}),
    status,
  })
}

interface FakeOptions {
  recentRows?: Array<Record<string, unknown>>
  reservedPub?: Record<string, unknown> | null
  ownershipRow?: Record<string, unknown> | null
  insertError?: Record<string, unknown> | null
  updateError?: Record<string, unknown> | null
  recentError?: Record<string, unknown> | null
}

function fakeSupabase(options: FakeOptions = {}) {
  const state = {
    inserts: [] as Array<{ table: string; value: Record<string, unknown> }>,
    updates: [] as Array<{ table: string; value: Record<string, unknown>; filters: Record<string, unknown> }>,
    selects: [] as string[],
  }

  class Query {
    private operation: 'select' | 'update' = 'select'
    private updateValue: Record<string, unknown> = {}
    private filters: Record<string, unknown> = {}

    constructor(private table: string) {}

    select() {
      state.selects.push(this.table)
      this.operation = 'select'
      return this
    }

    eq(column: string, value: unknown) {
      this.filters[column] = value
      return this
    }

    is(column: string, value: unknown) {
      this.filters[column] = value
      return this
    }

    gte() { return this }
    order() { return this }

    limit() {
      return Promise.resolve({
        data: options.recentRows || [],
        error: options.recentError || null,
      })
    }

    maybeSingle() {
      if (this.table === 'pubs') {
        return Promise.resolve({ data: options.reservedPub || null, error: null })
      }
      return Promise.resolve({ data: options.ownershipRow || null, error: null })
    }

    insert(value: Record<string, unknown>) {
      state.inserts.push({ table: this.table, value })
      return Promise.resolve({ error: options.insertError || null })
    }

    update(value: Record<string, unknown>) {
      this.operation = 'update'
      this.updateValue = value
      return this
    }

    then(resolve: (value: { error: Record<string, unknown> | null }) => void) {
      if (this.operation === 'update') {
        state.updates.push({ table: this.table, value: this.updateValue, filters: this.filters })
      }
      resolve({ error: options.updateError || null })
    }
  }

  const client = { from: (table: string) => new Query(table) } as unknown as SupabaseClient
  return { client, state }
}

describe('admin Andrew owner test call', () => {
  it('rejects unauthenticated POST and GET before any vendor call', async () => {
    configureEnv()
    let vendorCalls = 0
    const fetchFn = async () => {
      vendorCalls += 1
      return new Response()
    }

    const post = await handleAndrewTestCallPost(postRequest({ consent: true }), { authenticate: deniedAuth, fetchFn })
    const get = await handleAndrewTestCallGet(getRequest(CONVERSATION_ID), { authenticate: deniedAuth, fetchFn })

    assert.equal(post.status, 401)
    assert.equal(get.status, 401)
    assert.equal(vendorCalls, 0)
  })

  it('fails safely when the separate demo configuration is missing or aliases production', async () => {
    configureEnv()
    delete process.env.ELEVENLABS_DEMO_AGENT_ID
    const { client } = fakeSupabase()
    let vendorCalls = 0
    const missing = await handleAndrewTestCallPost(postRequest({ consent: true }), {
      authenticate: allowedAuth(client),
      fetchFn: async () => {
        vendorCalls += 1
        return new Response()
      },
    })

    configureEnv()
    process.env.ELEVENLABS_DEMO_AGENT_ID = process.env.ELEVENLABS_AGENT_ID
    const aliased = await handleAndrewTestCallGet(getRequest(), { authenticate: allowedAuth(client) })

    assert.equal(missing.status, 503)
    assert.equal(aliased.status, 503)
    assert.equal(vendorCalls, 0)
  })

  it('requires exact explicit consent and rejects client targets or slugs', async () => {
    configureEnv()
    const { client, state } = fakeSupabase()
    let vendorCalls = 0
    const deps = {
      authenticate: allowedAuth(client),
      fetchFn: async () => {
        vendorCalls += 1
        return new Response()
      },
    }

    const missing = await handleAndrewTestCallPost(postRequest({ consent: false }), deps)
    const clientTarget = await handleAndrewTestCallPost(postRequest({ consent: true, phone: 'client-supplied-target' }), deps)
    const clientSlug = await handleAndrewTestCallPost(postRequest({ consent: true, slug: 'real-pub' }), deps)

    assert.equal(missing.status, 400)
    assert.equal(clientTarget.status, 400)
    assert.equal(clientSlug.status, 400)
    assert.equal(vendorCalls, 0)
    assert.deepEqual(state.selects, [])
  })

  it('checks the reserved slug, sends a fixed no-write payload, and only returns a masked destination', async () => {
    configureEnv()
    const { client, state } = fakeSupabase()
    let requestBody: Record<string, unknown> | null = null
    const response = await handleAndrewTestCallPost(postRequest({ consent: true }), {
      authenticate: allowedAuth(client),
      now: NOW,
      reservationId: 'reservation-123',
      fetchFn: async (_url, init) => {
        requestBody = JSON.parse(String(init?.body))
        return Response.json({
          success: true,
          message: 'started',
          conversation_id: CONVERSATION_ID,
          callSid: 'CA-secret-vendor-id',
        })
      },
    })
    const body = await response.json()
    const serialized = JSON.stringify(body)

    assert.equal(response.status, 200)
    assert.ok(state.selects.includes('pubs'), 'reserved slug was checked before dialling')
    assert.deepEqual(requestBody, {
      agent_id: AGENT_ID,
      agent_phone_number_id: 'phone_demo_123',
      to_number: DESTINATION,
      conversation_initiation_client_data: {
        dynamic_variables: {
          pub_slug: '__ai-demo-no-write__',
          pub_name: 'Perth Pint Prices owner test',
          suburb: 'Perth',
          last_price: '',
          demo_mode: 'owner_sandbox',
        },
      },
      call_recording_enabled: false,
      telephony_call_config: { ring_timeout: 25 },
    })
    assert.equal(body.destination.masked, '+•• ••• ••• 999')
    assert.equal(serialized.includes(DESTINATION), false)
    assert.equal(serialized.includes('CA-secret-vendor-id'), false)
    assert.equal(state.inserts.length, 1)
    assert.equal(state.updates.at(-1)?.value.call_sid, CONVERSATION_ID)
  })

  it('refuses to dial if the reserved no-write slug exists', async () => {
    configureEnv()
    const { client, state } = fakeSupabase({ reservedPub: { id: 999 } })
    let vendorCalls = 0
    const response = await handleAndrewTestCallPost(postRequest({ consent: true }), {
      authenticate: allowedAuth(client),
      fetchFn: async () => {
        vendorCalls += 1
        return new Response()
      },
    })

    assert.equal(response.status, 409)
    assert.equal(vendorCalls, 0)
    assert.equal(state.inserts.length, 0)
  })

  it('enforces one active call and a cooldown with durable log rows', async () => {
    configureEnv()
    const active = fakeSupabase({
      recentRows: [{
        call_sid: CONVERSATION_ID,
        parsed_confidence: 'ai_demo_in_progress',
        parsed_notes: demoNotes('in-progress', CONVERSATION_ID),
        created_at: '2026-07-26T03:55:00.000Z',
      }],
    })
    const cooling = fakeSupabase({
      recentRows: [{
        call_sid: CONVERSATION_ID,
        parsed_confidence: 'ai_demo_done',
        parsed_notes: demoNotes('done', CONVERSATION_ID),
        created_at: '2026-07-26T03:50:00.000Z',
      }],
    })
    let vendorCalls = 0
    const fetchFn = async () => {
      vendorCalls += 1
      return new Response()
    }

    const activeResponse = await handleAndrewTestCallPost(postRequest({ consent: true }), {
      authenticate: allowedAuth(active.client), now: NOW, fetchFn,
    })
    const coolingResponse = await handleAndrewTestCallPost(postRequest({ consent: true }), {
      authenticate: allowedAuth(cooling.client), now: NOW, fetchFn,
    })

    assert.equal(activeResponse.status, 409)
    assert.equal(coolingResponse.status, 429)
    assert.equal(vendorCalls, 0)
    assert.equal(active.state.inserts.length, 0)
    assert.equal(cooling.state.inserts.length, 0)
  })

  it('validates ownership and agent id before returning a narrow sanitized status', async () => {
    configureEnv()
    const { client, state } = fakeSupabase({
      ownershipRow: {
        call_sid: CONVERSATION_ID,
        parsed_confidence: 'ai_demo_processing',
        parsed_notes: demoNotes('processing', CONVERSATION_ID),
        created_at: NOW.toISOString(),
      },
    })
    const vendorPayload = {
      agent_id: AGENT_ID,
      conversation_id: CONVERSATION_ID,
      status: 'done',
      metadata: { cost_fiat: 4.2, call_sid: 'CA-private' },
      has_audio: true,
      audio_url: 'https://private.example/audio.mp3',
      transcript: [
        { role: 'agent', message: `I have your number as ${DESTINATION}.` },
        { role: 'user', message: 'Swan Draught is $9. Email me at owner@example.com.' },
        {
          role: 'agent',
          message: 'Thanks, I have captured that.',
          tool_results: [{
            tool_name: 'record_price',
            result_value: JSON.stringify({
              ok: true,
              sandbox: true,
              recorded: false,
              proposed: {
                pint_price: 9,
                beer_type: 'Swan Draught',
                happy_hour: 'Mon-Fri 4-6pm',
                confidence: 'high',
              },
            }),
          }],
        },
      ],
      analysis: {
        data_collection_results: {
          price: { value: 9 },
          beer_type: { value: 'Swan Draught' },
          unit: { value: 'pint' },
          happy_hour: { value: 'Mon-Fri 4-6pm' },
          confidence: { value: 'high' },
        },
      },
    }

    const response = await handleAndrewTestCallGet(getRequest(CONVERSATION_ID), {
      authenticate: allowedAuth(client),
      fetchFn: async () => Response.json(vendorPayload),
    })
    const body = await response.json()
    const serialized = JSON.stringify(body)

    assert.equal(response.status, 200)
    assert.deepEqual(body.conversation, { id: CONVERSATION_ID, status: 'done', terminal: true })
    assert.deepEqual(body.proposedListing, {
      price: 9,
      beerType: 'Swan Draught',
      happyHour: 'Mon-Fri 4-6pm',
      confidence: 'high',
    })
    assert.match(body.transcript[0].message, /\[phone redacted\]/)
    assert.match(body.transcript[1].message, /\[email redacted\]/)
    assert.equal(serialized.includes(DESTINATION), false)
    assert.equal(serialized.includes('CA-private'), false)
    assert.equal(serialized.includes('audio.mp3'), false)
    assert.equal(serialized.includes('cost_fiat'), false)
    assert.deepEqual(Object.keys(body).sort(), [
      'conversation', 'destination', 'ok', 'proposedListing', 'structured', 'toolResult', 'transcript',
    ])
    assert.equal(state.updates.at(-1)?.value.parsed_confidence, 'ai_demo_done')
    assert.equal(state.updates.at(-1)?.value.recording_url, undefined)
  })

  it('does not call the vendor for a conversation that is not owned by the demo agent', async () => {
    configureEnv()
    const { client } = fakeSupabase({
      ownershipRow: {
        call_sid: CONVERSATION_ID,
        parsed_confidence: 'ai_demo_initiated',
        parsed_notes: demoNotes('initiated', CONVERSATION_ID, 'agent_someone_else'),
        created_at: NOW.toISOString(),
      },
    })
    let vendorCalls = 0
    const response = await handleAndrewTestCallGet(getRequest(CONVERSATION_ID), {
      authenticate: allowedAuth(client),
      fetchFn: async () => {
        vendorCalls += 1
        return new Response()
      },
    })

    assert.equal(response.status, 404)
    assert.equal(vendorCalls, 0)
  })
})
