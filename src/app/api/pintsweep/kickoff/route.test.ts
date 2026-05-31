import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { NextRequest } from 'next/server'

import { handleKickoff } from './handler'

function jsonRequest(body: unknown) {
  return new NextRequest('http://localhost/api/pintsweep/kickoff', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-agent-secret': 'test-secret',
    },
    body: JSON.stringify(body),
  })
}

describe('pintsweep kickoff safety filters', () => {
  it('excludes do-not-call pubs and recently called pubs from dry-run recipients', async () => {
    process.env.AGENT_WEBHOOK_SECRET = 'test-secret'
    process.env.ELEVENLABS_AGENT_ID = 'agent_123'
    process.env.ELEVENLABS_PHONE_NUMBER_ID = 'phone_123'
    process.env.ELEVENLABS_API_KEY = 'xi_123'

    const supabase = {
      from(table: string) {
        if (table === 'pubs') {
          return pubsQuery([
            candidate(1, 'recent-call', 'Recent Call', '0400 000 001'),
            candidate(2, 'do-not-call', 'Do Not Call', '0400 000 002'),
            candidate(3, 'safe-call', 'Safe Call', '0400 000 003'),
          ])
        }
        if (table === 'phone_call_log') {
          return phoneCallLogQuery([
            { pub_id: 1, call_sid: 'conv_recent', parsed_confidence: 'failed', created_at: '2026-05-30T15:00:00.000Z' },
            { pub_id: 2, call_sid: 'manual_dnc', parsed_confidence: 'do_not_call', created_at: '2026-01-01T00:00:00.000Z' },
          ])
        }
        throw new Error(`Unexpected table ${table}`)
      },
    }

    const response = await handleKickoff(jsonRequest({ dry_run: true, skipOpenCheck: true }), {
      supabase,
      now: new Date('2026-05-31T00:00:00.000Z'),
    })
    const body = await response.json()

    assert.equal(response.status, 200)
    assert.equal(body.ok, true)
    assert.equal(body.would_call, 1)
    assert.deepEqual(body.first_10, [{ phone: '+61400000003', pub: 'Safe Call' }])
    assert.deepEqual(body.excluded, {
      by_cooldown_or_dnc: 2,
      dnc_marked: 1,
      cooldown_hours: 72,
    })
  })

  it('reserves submitted recipients before handing the batch to ElevenLabs', async () => {
    process.env.AGENT_WEBHOOK_SECRET = 'test-secret'
    process.env.ELEVENLABS_AGENT_ID = 'agent_123'
    process.env.ELEVENLABS_PHONE_NUMBER_ID = 'phone_123'
    process.env.ELEVENLABS_API_KEY = 'xi_123'

    let reservationRows: Array<Record<string, unknown>> = []
    const supabase = {
      from(table: string) {
        if (table === 'pubs') {
          return pubsQuery([candidate(3, 'safe-call', 'Safe Call', '0400 000 003')])
        }
        if (table === 'phone_call_log') {
          return phoneCallLogQuery([], (rows) => {
            reservationRows = rows
          })
        }
        throw new Error(`Unexpected table ${table}`)
      },
    }

    const response = await handleKickoff(jsonRequest({ skipOpenCheck: true, cooldownHours: 0 }), {
      supabase,
      now: new Date('2026-05-31T00:00:00.000Z'),
      fetchFn: async () =>
        new Response(JSON.stringify({ batch_id: 'batch_123' }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }),
    })
    const body = await response.json()

    assert.equal(response.status, 200)
    assert.equal(body.queued, 1)
    assert.equal(body.excluded.cooldown_hours, 72)
    assert.deepEqual(reservationRows, [
      {
        pub_id: 3,
        call_sid: 'pintsweep-1780185600000-3',
        transcript: null,
        recording_url: null,
        parsed_price: null,
        parsed_beer_type: null,
        parsed_confidence: 'queued',
        parsed_notes: 'pintsweep kickoff reservation pintsweep-1780185600000',
      },
    ])
  })

  it('aborts after reservation if another kickoff reserved the same pub', async () => {
    process.env.AGENT_WEBHOOK_SECRET = 'test-secret'
    process.env.ELEVENLABS_AGENT_ID = 'agent_123'
    process.env.ELEVENLABS_PHONE_NUMBER_ID = 'phone_123'
    process.env.ELEVENLABS_API_KEY = 'xi_123'

    let rangeCalls = 0
    let deletedReservation = false
    let submitted = false
    const supabase = {
      from(table: string) {
        if (table === 'pubs') {
          return pubsQuery([candidate(3, 'safe-call', 'Safe Call', '0400 000 003')])
        }
        if (table === 'phone_call_log') {
          return {
            select() {
              return this
            },
            not() {
              return this
            },
            gte() {
              return this
            },
            eq() {
              return this
            },
            range() {
              rangeCalls += 1
              const data =
                rangeCalls === 3
                  ? [
                      {
                        pub_id: 3,
                        call_sid: 'pintsweep-other-3',
                        parsed_confidence: 'queued',
                        created_at: '2026-05-31T00:00:00.000Z',
                      },
                    ]
                  : []
              return Promise.resolve({ data, error: null })
            },
            insert() {
              return Promise.resolve({ error: null })
            },
            delete() {
              return this
            },
            like() {
              deletedReservation = true
              return Promise.resolve({ error: null })
            },
          }
        }
        throw new Error(`Unexpected table ${table}`)
      },
    }

    const response = await handleKickoff(jsonRequest({ skipOpenCheck: true }), {
      supabase,
      now: new Date('2026-05-31T00:00:00.000Z'),
      fetchFn: async () => {
        submitted = true
        return new Response('{}')
      },
    })
    const body = await response.json()

    assert.equal(response.status, 409)
    assert.match(body.error, /reservation conflict/)
    assert.equal(deletedReservation, true)
    assert.equal(submitted, false)
  })
})

function candidate(id: number, slug: string, name: string, phone: string) {
  return {
    id,
    name,
    slug,
    suburb: 'Perth',
    phone,
    price: null,
    price_verified: false,
    last_verified: null,
    place_id: null,
  }
}

function pubsQuery(data: Array<ReturnType<typeof candidate>>) {
  return {
    select() {
      return this
    },
    not() {
      return this
    },
    or() {
      return this
    },
    order() {
      return Promise.resolve({ data, error: null })
    },
  }
}

function phoneCallLogQuery(
  data: Array<{ pub_id: number; call_sid: string | null; parsed_confidence: string; created_at: string }>,
  onInsert?: (rows: Array<Record<string, unknown>>) => void,
) {
  const filters: { gte?: string; confidence?: string } = {}
  return {
    select() {
      return this
    },
    not() {
      return this
    },
    gte(_column: string, value: string) {
      filters.gte = value
      return this
    },
    eq(_column: string, value: string) {
      filters.confidence = value
      return this
    },
    range(from: number, to: number) {
      const filtered = data.filter((row) => {
        if (filters.gte && row.created_at < filters.gte) return false
        if (filters.confidence && row.parsed_confidence !== filters.confidence) return false
        return true
      })
      return Promise.resolve({ data: filtered.slice(from, to + 1), error: null })
    },
    insert(rows: Array<Record<string, unknown>>) {
      onInsert?.(rows)
      return Promise.resolve({ error: null })
    },
    delete() {
      return this
    },
    like() {
      return Promise.resolve({ error: null })
    },
  }
}
