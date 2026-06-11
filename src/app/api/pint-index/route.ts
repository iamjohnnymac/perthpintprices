import { NextResponse } from 'next/server'
import { getPintPriceStats } from '@/lib/pintPriceStats'
import { supabase } from '@/lib/supabase'
import { getCachedPubs } from '@/lib/cachedPubs'

export const revalidate = 3600

/**
 * GET /api/pint-index
 * Feeds the global header chip. `price` is the live canonical average (verified
 * regular-pint prices) so the chip matches every page; `spark` is the recent
 * weekly-snapshot series for the trend line + % change.
 */
export async function GET() {
  const pubs = await getCachedPubs()
  const stats = getPintPriceStats(pubs)

  const { data } = await supabase
    .from('price_snapshots')
    .select('avg_price, snapshot_date')
    .order('snapshot_date', { ascending: false })
    .limit(12)

  const spark = (data ?? [])
    .map((d: { avg_price: string | number }) => parseFloat(String(d.avg_price)))
    .filter((n: number) => Number.isFinite(n))
    .reverse()

  return NextResponse.json({
    price: stats.averagePrice ?? null,
    spark,
  })
}
