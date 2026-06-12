import { NextResponse } from 'next/server'
import { getPintPriceStats } from '@/lib/pintPriceStats'
import { supabase } from '@/lib/supabase'
import { getCachedPubs } from '@/lib/cachedPubs'
import { fetchPriceSnapshots } from '@/lib/priceSnapshots'

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

  const snapshots = await fetchPriceSnapshots(supabase, { ascending: false, limit: 12 })
  const spark = snapshots.map((s) => s.avg_price).reverse()

  return NextResponse.json({
    price: stats.averagePrice ?? null,
    spark,
  })
}
