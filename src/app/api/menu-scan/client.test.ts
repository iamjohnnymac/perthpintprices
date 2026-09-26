import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { APIConnectionTimeoutError } from 'openai'

import {
  createMenuScanClient,
  createMenuScanCompletion,
  MENU_SCAN_MAX_RETRIES,
  MENU_SCAN_TIMEOUT_MS,
} from './client'

describe('menu-scan provider request', () => {
  it('fits both attempts and the SDK retry backoff inside the route duration', () => {
    // route.ts sets maxDuration = 30 seconds; SDK 7.23.0 backs off at most 500 ms for one retry.
    const maxRetryBackoffMs = 500
    assert.equal(MENU_SCAN_MAX_RETRIES, 1)
    assert.ok(MENU_SCAN_TIMEOUT_MS * (MENU_SCAN_MAX_RETRIES + 1) + maxRetryBackoffMs < 30_000)
    assert.equal(createMenuScanClient('test-key').timeout, MENU_SCAN_TIMEOUT_MS)
  })

  it('times out an abort-aware stalled fetch after the configured attempts', async () => {
    let attempts = 0
    const stalledFetch: typeof fetch = async (_input, init) => {
      attempts++
      return new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')), { once: true })
      })
    }

    // Isolation proof with a shorter SDK timeout; this does not prove provider latency.
    const testTimeoutMs = 25
    const client = createMenuScanClient('test-key', stalledFetch).withOptions({ timeout: testTimeoutMs })
    const started = performance.now()
    await assert.rejects(createMenuScanCompletion(client, 'data:image/png;base64,AA=='), APIConnectionTimeoutError)
    const elapsed = performance.now() - started

    assert.equal(attempts, MENU_SCAN_MAX_RETRIES + 1)
    assert.ok(elapsed >= testTimeoutMs * attempts, `Elapsed ${elapsed} ms`)
    assert.ok(elapsed < 2_000, `Elapsed ${elapsed} ms`)
  })

  it('sends max_completion_tokens without max_tokens', async () => {
    let body: Record<string, unknown> | undefined
    const captureFetch: typeof fetch = async (_input, init) => {
      const rawBody = init?.body
      assert.equal(typeof rawBody, 'string')
      body = JSON.parse(rawBody as string) as Record<string, unknown>
      return Response.json({ choices: [{ message: { content: '[]' } }] })
    }

    await createMenuScanCompletion(createMenuScanClient('test-key', captureFetch), 'data:image/png;base64,AA==')

    assert.equal(body?.max_completion_tokens, 1024)
    assert.equal('max_tokens' in (body ?? {}), false)
    assert.equal(body?.model, 'qwen/qwen3.5-flash-02-23')
  })
})
