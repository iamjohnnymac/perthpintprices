import { buildPintIndexCsv, PintIndexCsvRow } from '@/lib/pintIndexCsv'
import { supabase } from '@/lib/supabase'

export const revalidate = 3600

interface SnapshotRow {
  snapshot_date: string
  avg_price: number | string
  median_price: number | string
  min_price: number | string
  max_price: number | string
  total_pubs: number
  total_suburbs: number
  cheapest_suburb: string | null
  cheapest_suburb_avg: number | string | null
  most_expensive_suburb: string | null
  most_expensive_suburb_avg: number | string | null
}

function toNumber(value: number | string | null): number | null {
  if (value === null) return null
  const number = Number(value)
  return Number.isFinite(number) ? number : null
}

function toCsvRow(row: SnapshotRow): PintIndexCsvRow {
  return {
    snapshotDate: row.snapshot_date,
    averagePrice: toNumber(row.avg_price) ?? 0,
    medianPrice: toNumber(row.median_price) ?? 0,
    minPrice: toNumber(row.min_price) ?? 0,
    maxPrice: toNumber(row.max_price) ?? 0,
    totalPubs: row.total_pubs,
    totalSuburbs: row.total_suburbs,
    cheapestSuburb: row.cheapest_suburb,
    cheapestSuburbAverage: toNumber(row.cheapest_suburb_avg),
    mostExpensiveSuburb: row.most_expensive_suburb,
    mostExpensiveSuburbAverage: toNumber(row.most_expensive_suburb_avg),
  }
}

export async function GET() {
  const { data, error } = await supabase
    .from('price_snapshots')
    .select('snapshot_date, avg_price, median_price, min_price, max_price, total_pubs, total_suburbs, cheapest_suburb, cheapest_suburb_avg, most_expensive_suburb, most_expensive_suburb_avg')
    .order('snapshot_date', { ascending: true })

  if (error) {
    return new Response('Unable to build Pint Index export\n', { status: 500 })
  }

  return new Response(buildPintIndexCsv(((data || []) as SnapshotRow[]).map(toCsvRow)), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="perth-pint-index.csv"',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
