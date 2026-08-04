import { anonClient } from '../src/lib/supabaseGateway'
import { assertBuildCredentials, assertBuildData, BUILD_SENTINEL_SLUG, withBuildDataRetry } from '../src/lib/buildDataPreflight'

async function main() {
  assertBuildCredentials(process.env, Boolean(process.env.CI || process.env.VERCEL))
  const supabase = anonClient()

  const { count, sentinelFound } = await withBuildDataRetry(async () => {
    const [{ count, error: countError }, { data: sentinel, error: sentinelError }] = await Promise.all([
      supabase.from('pubs').select('id', { count: 'exact', head: true }),
      supabase.from('pubs').select('id').eq('slug', BUILD_SENTINEL_SLUG).maybeSingle(),
    ])

    if (countError) throw new Error(`Supabase build preflight count failed: ${countError.message}`)
    if (sentinelError) throw new Error(`Supabase build preflight sentinel failed: ${sentinelError.message}`)

    return { count, sentinelFound: sentinel != null }
  }, {
    onRetry: (attempt, error) => {
      const reason = error instanceof Error ? error.message : String(error)
      console.warn(`[build-data-preflight] attempt ${attempt} failed, retrying: ${reason}`)
    },
  })

  assertBuildData(count, sentinelFound)
  console.log(`[build-data-preflight] PASS: ${count} pubs and sentinel present`)
}

main().catch((error) => {
  console.error(`[build-data-preflight] FAIL: ${error instanceof Error ? error.message : String(error)}`)
  process.exit(1)
})
