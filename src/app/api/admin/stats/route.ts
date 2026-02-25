import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ifxkoblvgttelzboenpi.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlmeGtvYmx2Z3R0ZWx6Ym9lbnBpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzExODUwNjgsImV4cCI6MjA4Njc2MTA2OH0.qLy6B-VeVnMh0QSOxHK3uQEJ6iZr6xNHmfKov_7B-fY'
)

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: NextRequest) {
  // Verify password from Authorization header
  const authHeader = request.headers.get('authorization')
  const password = authHeader?.replace('Bearer ', '')
  
  if (!process.env.ADMIN_PASSWORD || password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Parallel queries for speed
    const [
      pubsResult,
      snapshotResult,
      priceHistoryResult,
      priceReportsResult,
      pushSubsResult,
      activityResult,
      recentPubsResult,
      happyHourResult,
      cozyResult,
      sunsetResult,
      dadBarResult,
      tabResult,
    ] = await Promise.all([
      // Total pubs and breakdown
      supabase.from('pubs').select('name, price, suburb, price_verified, last_verified, last_updated, cozy_pub, sunset_spot, kid_friendly, has_tab, happy_hour_price, happy_hour_days, vibe_tag', { count: 'exact' }),
      // Latest snapshot
      supabase.from('price_snapshots').select('*').order('snapshot_date', { ascending: false }).limit(1),
      // Recent price changes
      supabase.from('price_history').select('*', { count: 'exact' }).order('changed_at', { ascending: false }).limit(10),
      // Price reports (crowdsourced)
      supabase.from('price_reports').select('*', { count: 'exact' }).order('created_at', { ascending: false }).limit(10),
      // Push subscriptions
      supabase.from('push_subscriptions').select('*', { count: 'exact' }),
      // Agent activity
      supabase.from('agent_activity').select('*').order('created_at', { ascending: false }).limit(20),
      // Recently updated pubs
      supabase.from('pubs').select('name, suburb, price, last_updated').order('last_updated', { ascending: false }).limit(5),
      // Happy hour stats
      supabase.from('pubs').select('name', { count: 'exact' }).not('happy_hour_days', 'is', null),
      // Cozy pubs count
      supabase.from('pubs').select('name', { count: 'exact' }).eq('cozy_pub', true),
      // Sunset spots count
      supabase.from('pubs').select('name', { count: 'exact' }).eq('sunset_spot', true),
      // Dad bars count
      supabase.from('pubs').select('name', { count: 'exact' }).eq('kid_friendly', true),
      // TAB venues count
      supabase.from('pubs').select('name', { count: 'exact' }).eq('has_tab', true),
    ])

    const pubs = pubsResult.data || []
    const pricedPubs = pubs.filter(p => p.price && p.price > 0)
    const prices = pricedPubs.map(p => p.price)
    const avgPrice = prices.length > 0 ? prices.reduce((a: number, b: number) => a + b, 0) / prices.length : 0
    const minPrice = prices.length > 0 ? Math.min(...prices) : 0
    const maxPrice = prices.length > 0 ? Math.max(...prices) : 0
    const suburbs = Array.from(new Set(pubs.map(p => p.suburb))).filter(Boolean)
    const vibeTagged = pubs.filter(p => p.vibe_tag).length

    // Pubs without prices
    const unpriced = pubs.filter(p => !p.price || p.price === 0)

    return NextResponse.json({
      overview: {
        totalPubs: pubsResult.count || pubs.length,
        pricedPubs: pricedPubs.length,
        unpricedPubs: unpriced.length,
        suburbs: suburbs.length,
        avgPrice: Math.round(avgPrice * 100) / 100,
        minPrice,
        maxPrice,
        vibeTagged,
      },
      features: {
        happyHour: happyHourResult.count || 0,
        cozyPubs: cozyResult.count || 0,
        sunsetSpots: sunsetResult.count || 0,
        dadBars: dadBarResult.count || 0,
        tabVenues: tabResult.count || 0,
      },
      pushSubscriptions: {
        total: pushSubsResult.count || 0,
        active: (pushSubsResult.data || []).filter((s: any) => s.last_active).length,
      },
      priceReports: {
        total: priceReportsResult.count || 0,
        pending: (priceReportsResult.data || []).filter((r: any) => r.status === 'pending').length,
        recent: (priceReportsResult.data || []).slice(0, 5).map((r: any) => ({
          pubSlug: r.pub_slug,
          reportedPrice: r.reported_price,
          beerType: r.beer_type,
          reporter: r.reporter_name || 'Anonymous',
          status: r.status,
          createdAt: r.created_at,
        })),
      },
      snapshot: snapshotResult.data?.[0] || null,
      priceHistory: {
        totalChanges: priceHistoryResult.count || 0,
        recent: (priceHistoryResult.data || []).map((h: any) => ({
          pubSlug: h.pub_slug,
          oldPrice: h.old_price,
          newPrice: h.new_price,
          changedAt: h.changed_at,
        })),
      },
      recentlyUpdated: (recentPubsResult.data || []).map((p: any) => ({
        name: p.name,
        suburb: p.suburb,
        price: p.price,
        lastUpdated: p.last_updated,
      })),
      agentActivity: (activityResult.data || []).map((a: any) => ({
        action: a.action,
        category: a.category,
        details: a.details,
        status: a.status,
        createdAt: a.created_at,
      })),
      unpricedPubs: unpriced.map((p: any) => ({
        name: p.name,
        suburb: p.suburb,
      })),
      generatedAt: new Date().toISOString(),
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
