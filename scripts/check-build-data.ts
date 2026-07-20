import { anonClient } from '../src/lib/supabaseGateway'
import { assertBuildCredentials, assertBuildData, BUILD_SENTINEL_SLUG, withBuildDataTimeout } from '../src/lib/buildDataPreflight'

async function main() {
  assertBuildCredentials(process.env, Boolean(process.env.CI || process.env.VERCEL))
  const supabase = anonClient()
  const [{ count, error: countError }, { data: sentinel, error: sentinelError }] = await withBuildDataTimeout(Promise.all([
    supabase.from('pubs').select('id', { count: 'exact', head: true }),
    supabase.from('pubs').select('id').eq('slug', BUILD_SENTINEL_SLUG).maybeSingle(),
  ]))

  if (countError) throw new Error(`Supabase build preflight count failed: ${countError.message}`)
  if (sentinelError) throw new Error(`Supabase build preflight sentinel failed: ${sentinelError.message}`)

  assertBuildData(count, sentinel != null)
  console.log(`[build-data-preflight] PASS: ${count} pubs and sentinel present`)
}

main().catch((error) => {
  console.error(`[build-data-preflight] FAIL: ${error instanceof Error ? error.message : String(error)}`)
  process.exit(1)
})
