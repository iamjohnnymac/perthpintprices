import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
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
    const deniedHeaders = ['forwarded', '-ip', 'remote-', 'via', '-user']
    assert.deepEqual(sentryDataCollection.httpHeaders.request.deny, deniedHeaders)
    assert.deepEqual(sentryDataCollection.httpHeaders.response.deny, deniedHeaders)
    assert.equal(sentryDataCollection.urlQueryParams, false)
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

describe('Sentry privacy wiring', () => {
  for (const file of ['instrumentation-client.ts', 'sentry.server.config.ts', 'sentry.edge.config.ts']) {
    it(`${file} passes the shared data collection policy to Sentry.init`, async () => {
      const source = await readFile(new URL(`../../${file}`, import.meta.url), 'utf8')
      assert.match(source, /import\s*\{[^}]*\bsentryDataCollection\b[^}]*\}\s*from\s*['"]@\/lib\/sentryPrivacy['"]/, `${file} must import the shared policy`)
      assert.match(source, /Sentry\.init\(\{[^}]*\bdataCollection:\s*sentryDataCollection\b/, `${file} must pass the shared policy`)
    })
  }
})
