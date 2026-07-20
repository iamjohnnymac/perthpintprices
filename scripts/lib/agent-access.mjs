export const ACCESS_BUNDLES = {
  'supabase-read': ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY'],
  'supabase-admin': ['NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'],
  'admin-ui': ['ADMIN_PASSWORD', 'SUPABASE_SERVICE_ROLE_KEY'],
  'cron-jobs': ['CRON_SECRET', 'NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'],
  'push-send': ['PUSH_API_SECRET', 'NEXT_PUBLIC_VAPID_PUBLIC_KEY', 'VAPID_PRIVATE_KEY', 'SUPABASE_SERVICE_ROLE_KEY'],
  'record-price-tool': ['ELEVENLABS_RECORD_PRICE_TOOL_SECRET', 'SUPABASE_SERVICE_ROLE_KEY'],
  'pintsweep-kickoff': ['PINTSWEEP_KICKOFF_SECRET', 'SUPABASE_SERVICE_ROLE_KEY'],
  'elevenlabs-webhook': ['ELEVENLABS_POST_CALL_WEBHOOK_SECRET'],
  'elevenlabs-admin': ['ELEVENLABS_API_KEY', 'ELEVENLABS_AGENT_ID', 'ELEVENLABS_PHONE_NUMBER_ID'],
  'content-ai': ['OPENROUTER_API_KEY'],
  'content-ai-anthropic': ['ANTHROPIC_API_KEY'],
  'places-refresh': ['GOOGLE_PLACES_API_KEY', 'SUPABASE_SERVICE_ROLE_KEY'],
  'stock-images': ['PEXELS_API_KEY'],
  'slack-alerts': ['SLACK_WEBHOOK_URL'],
  'vercel-deploy': ['VERCEL_TOKEN'],
  'sentry-release': ['NEXT_PUBLIC_SENTRY_DSN', 'SENTRY_AUTH_TOKEN', 'SENTRY_ORG', 'SENTRY_PROJECT'],
  'sentry-read': ['SENTRY_READ_TOKEN'],
}

export function inspectAccessBundle(bundleName, env = process.env) {
  const variables = ACCESS_BUNDLES[bundleName]
  if (!variables) throw new Error(`Unknown access bundle: ${bundleName}`)
  return variables.map(name => ({ name, present: typeof env[name] === 'string' && env[name].length > 0 }))
}

const ONLINE_CHECKS = {
  'supabase-read': env => ({
    url: `${env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/pubs?select=id&limit=1`,
    headers: { apikey: env.NEXT_PUBLIC_SUPABASE_ANON_KEY, authorization: `Bearer ${env.NEXT_PUBLIC_SUPABASE_ANON_KEY}` },
  }),
  'supabase-admin': env => ({
    url: `${env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/pubs?select=id&limit=1`,
    headers: { apikey: env.SUPABASE_SERVICE_ROLE_KEY, authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}` },
  }),
  'elevenlabs-admin': env => ({
    url: 'https://api.elevenlabs.io/v1/user',
    headers: { 'xi-api-key': env.ELEVENLABS_API_KEY },
  }),
  'vercel-deploy': env => ({
    url: 'https://api.vercel.com/v2/user',
    headers: { authorization: `Bearer ${env.VERCEL_TOKEN}` },
  }),
  'sentry-read': env => ({
    url: 'https://sentry.io/api/0/organizations/',
    headers: { authorization: `Bearer ${env.SENTRY_READ_TOKEN}` },
  }),
}

export async function validateOnlineAccess(bundleName, env = process.env, fetchFn = fetch) {
  const buildCheck = ONLINE_CHECKS[bundleName]
  if (!buildCheck) throw new Error(`No safe online identity check is defined for ${bundleName}`)
  const check = buildCheck(env)
  const response = await fetchFn(check.url, {
    headers: check.headers,
    signal: AbortSignal.timeout(10_000),
  })
  if (!response.ok) throw new Error(`identity endpoint returned HTTP ${response.status}`)
  return { verified: true, status: response.status }
}
