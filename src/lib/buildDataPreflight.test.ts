import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { assertBuildCredentials, assertBuildData, MIN_BUILD_PUBS, withBuildDataTimeout } from './buildDataPreflight'

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
