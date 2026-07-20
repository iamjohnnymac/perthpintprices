import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { scrubSentryEvent } from './sentryPrivacy'
import type { ErrorEvent } from '@sentry/nextjs'

describe('Sentry privacy filter', () => {
  it('removes credentials, request bodies, transcripts, and direct user identifiers', () => {
    const event = scrubSentryEvent({
      request: { headers: { authorization: 'secret', cookie: 'session', accept: 'json' }, data: 'raw body' },
      user: { id: 'safe-id', email: 'person@example.com', ip_address: '127.0.0.1' },
      extra: { transcript: 'private call', rawBody: 'private webhook', safe: 'retained' },
    } as unknown as ErrorEvent)

    assert.deepEqual(event.request, { headers: { accept: 'json' } })
    assert.deepEqual(event.user, { id: 'safe-id' })
    assert.deepEqual(event.extra, { safe: 'retained' })
  })
})
