import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ifxkoblvgttelzboenpi.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlmeGtvYmx2Z3R0ZWx6Ym9lbnBpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzExODUwNjgsImV4cCI6MjA4Njc2MTA2OH0.qLy6B-VeVnMh0QSOxHK3uQEJ6iZr6xNHmfKov_7B-fY'
)

/**
 * GET /api/cron/weekly-snapshot
 * Runs every Monday at 9am Perth time via Vercel Cron.
 * Takes a snapshot of current price stats and stores in price_snapshots.
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Get verified pubs with prices
    const { data: pubs, error } = await supabase
      .from('pubs')
      .select('price, suburb')
      .eq('price_verified', true)
      .not('price', 'is', null)

    if (error || !pubs || pubs.length === 0) {
      return NextResponse.json({ error: 'No pub data' }, { status: 500 })
    }

    const prices = pubs.map(p => Number(p.price)).sort((a, b) => a - b)
    const suburbs = new Set(pubs.map(p => p.suburb))

    // Compute stats
    const avg = prices.reduce((s, p) => s + p, 0) / prices.length
    const median = prices.length % 2 === 0
      ? (prices[prices.length / 2 - 1] + prices[prices.length / 2]) / 2
      : prices[Math.floor(prices.length / 2)]

    // Suburb averages
    const suburbPrices = new Map<string, number[]>()
    for (const pub of pubs) {
      const list = suburbPrices.get(pub.suburb) || []
      list.push(Number(pub.price))
      suburbPrices.set(pub.suburb, list)
    }

    let cheapestSuburb = ''
    let cheapestAvg = Infinity
    let expensiveSuburb = ''
    let expensiveAvg = 0

    for (const [suburb, subPrices] of Array.from(suburbPrices.entries())) {
      if (subPrices.length < 2) continue // Need at least 2 pubs for meaningful suburb avg
      const subAvg = subPrices.reduce((s, p) => s + p, 0) / subPrices.length
      if (subAvg < cheapestAvg) { cheapestAvg = subAvg; cheapestSuburb = suburb }
      if (subAvg > expensiveAvg) { expensiveAvg = subAvg; expensiveSuburb = suburb }
    }

    // Price distribution (for potential future charting)
    const distribution: Record<string, number> = {}
    for (const p of prices) {
      const bucket = `$${Math.floor(p)}-${Math.floor(p) + 1}`
      distribution[bucket] = (distribution[bucket] || 0) + 1
    }

    // Insert snapshot (upsert on date to avoid duplicates if run twice)
    const { error: insertError } = await supabase
      .from('price_snapshots')
      .upsert({
        snapshot_date: new Date().toISOString().split('T')[0],
        avg_price: Math.round(avg * 100) / 100,
        median_price: Math.round(median * 100) / 100,
        min_price: prices[0],
        max_price: prices[prices.length - 1],
        total_pubs: pubs.length,
        total_suburbs: suburbs.size,
        cheapest_suburb: cheapestSuburb || null,
        cheapest_suburb_avg: cheapestAvg < Infinity ? Math.round(cheapestAvg * 100) / 100 : null,
        most_expensive_suburb: expensiveSuburb || null,
        most_expensive_suburb_avg: expensiveAvg > 0 ? Math.round(expensiveAvg * 100) / 100 : null,
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
            body: `Avg pint: $${avg.toFixed(2)} across ${pubs.length} venues. Cheapest suburb: ${cheapestSuburb}`,
            url: '/weekly',
            tag: 'weekly-report',
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
        avg: Math.round(avg * 100) / 100,
        median: Math.round(median * 100) / 100,
        min: prices[0],
        max: prices[prices.length - 1],
        totalPubs: pubs.length,
        totalSuburbs: suburbs.size,
      },
    })
  } catch (err) {
    console.error('Weekly snapshot error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
