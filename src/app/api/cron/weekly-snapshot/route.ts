import { getPubs } from '@/lib/supabase'
import { getPintPriceStats } from '@/lib/pintPriceStats'
import { getPricedSuburbCount, getSuburbExtremes } from '@/lib/suburbStats'
import { serviceClient } from '@/lib/supabaseGateway'
import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/cron/weekly-snapshot
 * Runs every Monday at 9am Perth time via Vercel Cron.
 * Stores a snapshot of current price stats in price_snapshots.
 *
 * Uses the SAME canonical helpers as the live pages (getPintPriceStats +
 * getSuburbStats: verified regular-pint prices), so the snapshot series that
 * feeds the Pint Index trend agrees with every live surface.
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) {
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 })
  }
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const pubs = await getPubs()
    const stats = getPintPriceStats(pubs)

    if (stats.verifiedCount === 0 || stats.averagePrice == null || stats.medianPrice == null) {
      return NextResponse.json({ error: 'No pub data' }, { status: 500 })
    }

    const { cheapest, priciest } = getSuburbExtremes(pubs, 2)

    // Price distribution in $1 buckets ("$8-9"), matching the Index widget.
    const distribution: Record<string, number> = {}
    for (const pub of stats.verifiedPubs) {
      const floor = Math.floor(pub.regularPrice as number)
      const bucket = `$${floor}-${floor + 1}`
      distribution[bucket] = (distribution[bucket] || 0) + 1
    }

    const round = (n: number) => Math.round(n * 100) / 100
    const avg = round(stats.averagePrice)

    const supabase = serviceClient()
    const { error: insertError } = await supabase
      .from('price_snapshots')
      .upsert({
        snapshot_date: new Date().toISOString().split('T')[0],
        avg_price: avg,
        median_price: round(stats.medianPrice),
        min_price: stats.minPrice,
        max_price: stats.maxPrice,
        total_pubs: stats.verifiedCount,
        total_suburbs: getPricedSuburbCount(pubs),
        cheapest_suburb: cheapest?.suburb ?? null,
        cheapest_suburb_avg: cheapest ? round(cheapest.avgPrice) : null,
        most_expensive_suburb: priciest?.suburb ?? null,
        most_expensive_suburb_avg: priciest ? round(priciest.avgPrice) : null,
        price_distribution: distribution,
      }, { onConflict: 'snapshot_date' })

    if (insertError) {
      console.error('Snapshot insert error:', insertError)
      return NextResponse.json({ error: 'Insert failed' }, { status: 500 })
    }

    // Send push notification about the new report
    if (process.env.PUSH_API_SECRET) {
      const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://perthpintprices.com'
      try {
        await fetch(`${siteUrl}/api/push/send`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.PUSH_API_SECRET}`,
          },
          body: JSON.stringify({
            title: 'This Week in Perth Pints',
            body: `Avg pint: $${avg.toFixed(2)} across ${stats.verifiedCount} venues. Cheapest suburb: ${cheapest?.suburb ?? 'TBC'}`,
            url: '/insights/pint-index',
            tag: 'weekly-pints',
            renotify: true,
          }),
        })
      } catch (err) {
        console.error('Push notification error:', err)
      }
    }

    return NextResponse.json({
      success: true,
      date: new Date().toISOString().split('T')[0],
      stats: {
        avg,
        median: round(stats.medianPrice),
        min: stats.minPrice,
        max: stats.maxPrice,
        totalPubs: stats.verifiedCount,
        totalSuburbs: getPricedSuburbCount(pubs),
      },
    })
  } catch (err) {
    console.error('Weekly snapshot error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
