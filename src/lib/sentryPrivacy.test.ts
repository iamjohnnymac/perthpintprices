import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { scrubSentryEvent, sentryDataCollection } from './sentryPrivacy'
import type { ErrorEvent } from '@sentry/nextjs'

describe('Sentry privacy filter', () => {
  it('keeps automatic PII and payload collection disabled', () => {
    assert.equal(sentryDataCollection.userInfo, false)
    assert.equal(sentryDataCollection.cookies, false)
    assert.deepEqual(sentryDataCollection.httpBodies, [])
    assert.deepEqual(sentryDataCollection.genAI, { inputs: false, outputs: false })
    assert.equal(sentryDataCollection.stackFrameVariables, false)
    assert.equal(sentryDataCollection.databaseQueryData, false)
    assert.equal(sentryDataCollection.queues, false)
    assert.deepEqual(sentryDataCollection.graphQL, { document: false, variables: false })
    for (const deny of [
      sentryDataCollection.httpHeaders.request.deny,
      sentryDataCollection.httpHeaders.response.deny,
      sentryDataCollection.urlQueryParams.deny,
    ]) {
      assert.ok(deny.includes('-ip'))
      assert.ok(deny.includes('forwarded'))
    }
  })

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
