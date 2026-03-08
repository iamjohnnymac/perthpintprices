import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ifxkoblvgttelzboenpi.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlmeGtvYmx2Z3R0ZWx6Ym9lbnBpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzExODUwNjgsImV4cCI6MjA4Njc2MTA2OH0.qLy6B-VeVnMh0QSOxHK3uQEJ6iZr6xNHmfKov_7B-fY'
)

export const revalidate = 3600

export async function GET() {
  try {
    // Get latest 2 snapshots for week-over-week comparison
    const { data: snapshots, error } = await supabase
      .from('price_snapshots')
      .select('*')
      .order('snapshot_date', { ascending: false })
      .limit(2)

    if (error || !snapshots || snapshots.length === 0) {
      return NextResponse.json({ error: 'No snapshot data' }, { status: 404 })
    }

    const latest = snapshots[0]
    const previous = snapshots.length > 1 ? snapshots[1] : null

    // Get cheapest 10 verified pubs
    const { data: cheapestPubs } = await supabase
      .from('pubs')
      .select('slug, name, suburb, price, beer_type')
      .eq('price_verified', true)
      .not('price', 'is', null)
      .order('price', { ascending: true })
      .limit(10)

    // Get most reported pubs this week (from price_reports in last 7 days)
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    
    const { data: recentReports } = await supabase
      .from('price_reports')
      .select('pub_slug')
      .gte('created_at', weekAgo.toISOString())

    // Count reports per pub
    const reportCounts = new Map<string, number>()
    if (recentReports) {
      for (const r of recentReports) {
        reportCounts.set(r.pub_slug, (reportCounts.get(r.pub_slug) || 0) + 1)
      }
    }

    // Look up names for trending pubs
    const trendingSlugs = Array.from(reportCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)

    let trending: { slug: string; name: string; reportCount: number }[] = []
    if (trendingSlugs.length > 0) {
      const { data: trendingPubs } = await supabase
        .from('pubs')
        .select('slug, name')
        .in('slug', trendingSlugs.map(([slug]) => slug))

      if (trendingPubs) {
        trending = trendingSlugs.map(([slug, count]) => ({
          slug,
          name: trendingPubs.find(p => p.slug === slug)?.name || slug,
          reportCount: count,
        }))
      }
    }

    // Use live verified prices for min/max (snapshots may have stale data)
    const { data: liveMinMax } = await supabase
      .from('pubs')
      .select('price')
      .eq('price_verified', true)
      .not('price', 'is', null)
      .order('price', { ascending: true })

    const livePrices = (liveMinMax || []).map(p => Number(p.price)).filter(p => p > 0)
    const liveMin = livePrices.length > 0 ? livePrices[0] : Number(latest.min_price)
    const liveMax = livePrices.length > 0 ? livePrices[livePrices.length - 1] : Number(latest.max_price)

    // Compute week-over-week change
    const avgPrice = Number(latest.avg_price)
    const prevAvg = previous ? Number(previous.avg_price) : avgPrice
    const avgChange = Math.round((avgPrice - prevAvg) * 100) / 100
    const avgChangePct = prevAvg > 0 ? Math.round(((avgPrice - prevAvg) / prevAvg) * 1000) / 10 : 0

    return NextResponse.json({
      weekOf: latest.snapshot_date,
      previousWeek: previous?.snapshot_date || null,
      avgPrice,
      avgChange,
      avgChangePct,
      medianPrice: Number(latest.median_price),
      minPrice: liveMin,
      maxPrice: liveMax,
      totalPubs: latest.total_pubs,
      totalSuburbs: latest.total_suburbs,
      cheapestSuburb: latest.cheapest_suburb,
      cheapestSuburbAvg: latest.cheapest_suburb_avg ? Number(latest.cheapest_suburb_avg) : null,
      mostExpensiveSuburb: latest.most_expensive_suburb,
      mostExpensiveSuburbAvg: latest.most_expensive_suburb_avg ? Number(latest.most_expensive_suburb_avg) : null,
      cheapestPubs: cheapestPubs || [],
      trending,
      totalReportsThisWeek: recentReports?.length || 0,
    })
  } catch (err) {
    console.error('Weekly report error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
