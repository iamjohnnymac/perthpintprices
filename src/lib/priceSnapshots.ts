/**
 * The single price_snapshots read seam (issue #59).
 *
 * Snapshots were fetched and coerced in several places with drifting idioms —
 * different orderings, limits, and parseFloat handling. That drift caused the
 * PintIndexBadge oldest-vs-newest bug. Every read now goes through here so the
 * ordering, limit, and numeric coercion are defined once.
 *
 * Numeric columns arrive from PostgREST as strings (numeric type), so they are
 * always coerced to numbers here; callers receive ready-to-use values.
 */

export interface PriceSnapshot {
  snapshot_date: string
  avg_price: number
  median_price: number
  min_price: number
  max_price: number
  total_pubs: number
  total_suburbs: number
  cheapest_suburb: string | null
  cheapest_suburb_avg: number | null
  most_expensive_suburb: string | null
  most_expensive_suburb_avg: number | null
  price_distribution: Record<string, number>
}

const SNAPSHOT_COLUMNS =
  'snapshot_date, avg_price, median_price, min_price, max_price, total_pubs, total_suburbs, cheapest_suburb, cheapest_suburb_avg, most_expensive_suburb, most_expensive_suburb_avg, price_distribution'

// Structural client type so anon, service, and browser supabase clients all fit
// without fighting supabase-js generics.
interface SnapshotQueryClient {
  from: (table: string) => {
    select: (columns: string) => {
      order: (
        column: string,
        opts: { ascending: boolean },
      ) => {
        limit: (n: number) => PromiseLike<{ data: unknown[] | null; error: unknown }>
      } & PromiseLike<{ data: unknown[] | null; error: unknown }>
    }
  }
}

function num(value: unknown): number {
  const n = typeof value === 'number' ? value : parseFloat(String(value))
  return Number.isFinite(n) ? n : 0
}

function numOrNull(value: unknown): number | null {
  if (value === null || value === undefined) return null
  const n = typeof value === 'number' ? value : parseFloat(String(value))
  return Number.isFinite(n) ? n : null
}

export function coercePriceSnapshot(row: Record<string, unknown>): PriceSnapshot {
  return {
    snapshot_date: String(row.snapshot_date),
    avg_price: num(row.avg_price),
    median_price: num(row.median_price),
    min_price: num(row.min_price),
    max_price: num(row.max_price),
    total_pubs: num(row.total_pubs),
    total_suburbs: num(row.total_suburbs),
    cheapest_suburb: (row.cheapest_suburb as string | null) ?? null,
    cheapest_suburb_avg: numOrNull(row.cheapest_suburb_avg),
    most_expensive_suburb: (row.most_expensive_suburb as string | null) ?? null,
    most_expensive_suburb_avg: numOrNull(row.most_expensive_suburb_avg),
    price_distribution: (row.price_distribution as Record<string, number>) ?? {},
  }
}

/** Fetch coerced snapshots, oldest-first by default. Returns [] on error. */
export async function fetchPriceSnapshots(
  client: SnapshotQueryClient,
  { ascending = true, limit }: { ascending?: boolean; limit?: number } = {},
): Promise<PriceSnapshot[]> {
  const ordered = client.from('price_snapshots').select(SNAPSHOT_COLUMNS).order('snapshot_date', { ascending })
  const { data, error } = await (limit !== undefined ? ordered.limit(limit) : ordered)
  if (error || !data) return []
  return data.map((row) => coercePriceSnapshot(row as Record<string, unknown>))
}

/** The most recent snapshot, or null. */
export async function fetchLatestPriceSnapshot(client: SnapshotQueryClient): Promise<PriceSnapshot | null> {
  const rows = await fetchPriceSnapshots(client, { ascending: false, limit: 1 })
  return rows[0] ?? null
}
