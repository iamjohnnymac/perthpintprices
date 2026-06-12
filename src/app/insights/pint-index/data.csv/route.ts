import { buildPintIndexCsv, PintIndexCsvRow } from '@/lib/pintIndexCsv'
import { supabase } from '@/lib/supabase'
import { fetchPriceSnapshots, type PriceSnapshot } from '@/lib/priceSnapshots'

export const revalidate = 3600

function toCsvRow(row: PriceSnapshot): PintIndexCsvRow {
  return {
    snapshotDate: row.snapshot_date,
    averagePrice: row.avg_price,
    medianPrice: row.median_price,
    minPrice: row.min_price,
    maxPrice: row.max_price,
    totalPubs: row.total_pubs,
    totalSuburbs: row.total_suburbs,
    cheapestSuburb: row.cheapest_suburb,
    cheapestSuburbAverage: row.cheapest_suburb_avg,
    mostExpensiveSuburb: row.most_expensive_suburb,
    mostExpensiveSuburbAverage: row.most_expensive_suburb_avg,
  }
}

export async function GET() {
  const snapshots = await fetchPriceSnapshots(supabase, { ascending: true })

  return new Response(buildPintIndexCsv(snapshots.map(toCsvRow)), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="perth-pint-index.csv"',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
