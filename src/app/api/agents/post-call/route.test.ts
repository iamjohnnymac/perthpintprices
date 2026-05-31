import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { NextRequest } from 'next/server'

import { handlePostCall } from './handler'

function jsonRequest(body: unknown) {
  return new NextRequest('http://localhost/api/agents/post-call', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-agent-secret': 'test-secret',
    },
    body: JSON.stringify(body),
  })
}

describe('post-call fallback', () => {
  it('writes extracted price data when the mid-call tool missed it', async () => {
    process.env.AGENT_WEBHOOK_SECRET = 'test-secret'

    let callLogInsert: Record<string, unknown> | null = null
    let pubUpdate: Record<string, unknown> | null = null
    let historyInsert: Record<string, unknown> | null = null
    const supabase = {
      from(table: string) {
        if (table === 'pubs') {
          return pubsQuery({
            pub: { id: 42, price: null, price_verified: false },
            onUpdate: (updates) => {
              pubUpdate = updates
            },
          })
        }
        if (table === 'phone_call_log') {
          return insertQuery((row) => {
            callLogInsert = row
          })
        }
        if (table === 'price_history') {
          return insertQuery((row) => {
            historyInsert = row
          })
        }
        throw new Error(`Unexpected table ${table}`)
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
    assert.ok(callLogInsert)
    assert.equal((callLogInsert as Record<string, unknown>).parsed_price, 9)
    assert.equal((callLogInsert as Record<string, unknown>).parsed_beer_type, 'Swan Draught')
    assert.deepEqual(pubUpdate, {
      price: 9,
      price_verified: true,
      last_verified: '2026-05-31T00:00:00.000Z',
      beer_type: 'Swan Draught',
      happy_hour: 'Mon-Fri 4-6pm',
    })
    assert.deepEqual(historyInsert, {
      pub_id: 42,
      price: 9,
      beer_type: 'Swan Draught',
      change_type: 'phone_agent',
      source: 'ElevenLabs conv_123 (post-call fallback)',
    })
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

function pubsQuery(options: {
  pub: { id: number; price: number | null; price_verified: boolean }
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

function insertQuery(onInsert: (row: Record<string, unknown>) => void) {
  return {
    insert(row: Record<string, unknown>) {
      onInsert(row)
      return Promise.resolve({ error: null })
    },
  }
}
