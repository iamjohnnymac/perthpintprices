export const MIN_BUILD_PUBS = 800
export const BUILD_SENTINEL_SLUG = '18-knots-rooftop-bar'
export const BUILD_DATA_TIMEOUT_MS = 15_000
export const BUILD_DATA_ATTEMPTS = 3
export const BUILD_DATA_RETRY_BASE_MS = 1_000

export function assertBuildCredentials(env: Record<string, string | undefined>, isDeployment: boolean): void {
  if (!isDeployment) return
  for (const name of ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY']) {
    if (!env[name]) throw new Error(`${name} is required for deployment builds`)
  }
}

export function assertBuildData(count: number | null, sentinelFound: boolean): void {
  if (count == null || count < MIN_BUILD_PUBS) {
    throw new Error(`Supabase pub count ${count ?? 'unknown'} is below the build floor of ${MIN_BUILD_PUBS}`)
  }
  if (!sentinelFound) {
    throw new Error(`Supabase build sentinel ${BUILD_SENTINEL_SLUG} is missing`)
  }
}

export async function withBuildDataTimeout<T>(promise: Promise<T>, timeoutMs = BUILD_DATA_TIMEOUT_MS): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`Supabase build preflight timed out after ${timeoutMs}ms`)), timeoutMs)
  })
  try {
    return await Promise.race([promise, timeout])
  } finally {
    if (timer) clearTimeout(timer)
  }
}

type BuildDataRetryOptions = {
  attempts?: number
  timeoutMs?: number
  baseDelayMs?: number
  onRetry?: (attempt: number, error: unknown) => void
  sleep?: (ms: number) => Promise<void>
}

const defaultSleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))

/**
 * Runs a preflight fetch with a per-attempt timeout, retrying transient failures with
 * exponential backoff. Build machines reach Supabase across the Pacific, so a single
 * dropped connection should not fail the build.
 */
export async function withBuildDataRetry<T>(run: () => Promise<T>, options: BuildDataRetryOptions = {}): Promise<T> {
  const {
    attempts = BUILD_DATA_ATTEMPTS,
    timeoutMs = BUILD_DATA_TIMEOUT_MS,
    baseDelayMs = BUILD_DATA_RETRY_BASE_MS,
    onRetry,
    sleep = defaultSleep,
  } = options

  let lastError: unknown
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await withBuildDataTimeout(run(), timeoutMs)
    } catch (error) {
      lastError = error
      if (attempt === attempts) break
      onRetry?.(attempt, error)
      await sleep(baseDelayMs * 2 ** (attempt - 1))
    }
  }
  throw lastError
}
