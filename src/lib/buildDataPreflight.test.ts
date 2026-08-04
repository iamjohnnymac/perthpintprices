import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { assertBuildCredentials, assertBuildData, MIN_BUILD_PUBS, withBuildDataRetry, withBuildDataTimeout } from './buildDataPreflight'

describe('build data preflight', () => {
  it('accepts a reachable, populated database with the sentinel pub', () => {
    assert.doesNotThrow(() => assertBuildData(MIN_BUILD_PUBS, true))
  })

  it('rejects missing or unexpectedly sparse pub data', () => {
    assert.throws(() => assertBuildData(null, true), /unknown/)
    assert.throws(() => assertBuildData(MIN_BUILD_PUBS - 1, true), /below the build floor/)
  })

  it('rejects a database that does not contain the sentinel pub', () => {
    assert.throws(() => assertBuildData(MIN_BUILD_PUBS, false), /sentinel/)
  })

  it('requires explicit Supabase credentials in deployment environments', () => {
    assert.throws(() => assertBuildCredentials({}, true), /NEXT_PUBLIC_SUPABASE_URL/)
    assert.doesNotThrow(() => assertBuildCredentials({}, false))
    assert.doesNotThrow(() => assertBuildCredentials({
      NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'public-key',
    }, true))
  })
})

describe('build data timeout', () => {
  it('rejects stalled checks', async () => {
    await assert.rejects(withBuildDataTimeout(new Promise(() => {}), 5), /timed out after 5ms/)
  })
})

describe('build data retry', () => {
  const noSleep = async () => {}

  it('recovers from a transient failure without failing the build', async () => {
    let calls = 0
    const result = await withBuildDataRetry(async () => {
      calls += 1
      if (calls === 1) throw new Error('socket hang up')
      return 'ok'
    }, { sleep: noSleep })

    assert.equal(result, 'ok')
    assert.equal(calls, 2)
  })

  it('retries a stalled attempt rather than aborting on the first timeout', async () => {
    let calls = 0
    const result = await withBuildDataRetry(async () => {
      calls += 1
      if (calls === 1) return new Promise<string>(() => {})
      return 'ok'
    }, { timeoutMs: 5, sleep: noSleep })

    assert.equal(result, 'ok')
    assert.equal(calls, 2)
  })

  it('gives up after the attempt budget and surfaces the last error', async () => {
    let calls = 0
    await assert.rejects(withBuildDataRetry(async () => {
      calls += 1
      throw new Error(`attempt ${calls} failed`)
    }, { attempts: 3, sleep: noSleep }), /attempt 3 failed/)

    assert.equal(calls, 3)
  })

  it('backs off exponentially between attempts', async () => {
    const delays: number[] = []
    await assert.rejects(withBuildDataRetry(async () => {
      throw new Error('nope')
    }, {
      attempts: 3,
      baseDelayMs: 100,
      sleep: async (ms) => { delays.push(ms) },
    }), /nope/)

    assert.deepEqual(delays, [100, 200])
  })

  it('reports each retry so build logs show the flake', async () => {
    const seen: number[] = []
    await withBuildDataRetry(async () => {
      if (seen.length < 2) throw new Error('transient')
      return 'ok'
    }, { sleep: noSleep, onRetry: (attempt) => seen.push(attempt) })

    assert.deepEqual(seen, [1, 2])
  })
})
