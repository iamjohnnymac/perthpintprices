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
    process.env.AGENT_WEBHOOK_SECRET = 'test-secret'

    let pubUpdate: Record<string, unknown> | null = null
    const supabase = {
      from(table: string) {
        if (table === 'pubs') {
          return pubsQuery({
            pub: { id: 42, name: 'Test Pub', price: 12, price_verified: true },
            onUpdate: (updates) => {
              pubUpdate = updates
            },
          })
        }
        if (table === 'price_history') return insertQuery()
        throw new Error(`Unexpected table ${table}`)
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
    assert.deepEqual(pubUpdate, { happy_hour: 'Mon-Fri 4-6pm $8 pints' })
  })
})

function pubsQuery(options: {
  pub: { id: number; name: string; price: number; price_verified: boolean }
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

function insertQuery() {
  return {
    insert() {
      return Promise.resolve({ error: null })
    },
  }
}
