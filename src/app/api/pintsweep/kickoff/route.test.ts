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
            { pub_id: 1, parsed_confidence: 'failed', created_at: '2026-05-30T15:00:00.000Z' },
            { pub_id: 2, parsed_confidence: 'do_not_call', created_at: '2026-01-01T00:00:00.000Z' },
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

function phoneCallLogQuery(data: Array<{ pub_id: number; parsed_confidence: string; created_at: string }>) {
  return {
    select() {
      return this
    },
    not() {
      return this
    },
    or() {
      return Promise.resolve({ data, error: null })
    },
  }
}
