import { NextRequest, NextResponse } from 'next/server'
import { fetchLatestPriceSnapshot } from '@/lib/priceSnapshots'
import type { SupabaseClient } from '@supabase/supabase-js'
import { authenticateAdminRequest } from '@/lib/adminAuth'

export const dynamic = 'force-dynamic'
export const revalidate = 0

interface AdminStatsDeps {
  getServiceClient?: () => SupabaseClient
}

export async function handleAdminStats(request: NextRequest, deps: AdminStatsDeps = {}) {
  const auth = await authenticateAdminRequest(request, deps)
  if (!auth.authenticated) return auth.response

  try {
    const supabase = auth.supabase
    // Parallel queries for speed
    const [
      pubsResult,
      snapshotResult,
      priceHistoryResult,
      priceReportsResult,
      pendingPriceReportsResult,
      pendingPriceReportsListResult,
      pushSubsResult,
      activityResult,
      recentPubsResult,
      happyHourResult,
      cozyResult,
      sunsetResult,
      dadBarResult,
      tabResult,
      pubSubmissionsResult,
    ] = await Promise.all([
      // Total pubs and breakdown
      supabase.from('pubs').select('id, slug, name, price, suburb, price_verified, last_verified, last_updated, cozy_pub, sunset_spot, kid_friendly, has_tab, happy_hour_price, happy_hour_days, vibe_tag', { count: 'exact' }),
      // Latest snapshot
      fetchLatestPriceSnapshot(supabase),
      // Recent price changes
      supabase.from('price_history').select('*', { count: 'exact' }).order('changed_at', { ascending: false }).limit(10),
      // Price reports (crowdsourced)
      supabase.from('price_reports').select('*', { count: 'exact' }).order('created_at', { ascending: false }).limit(10),
      // All pending price reports, not just the latest display slice
      supabase.from('price_reports').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      // Pending report review queue, so large imports can be fully actioned
      supabase.from('price_reports').select('*').eq('status', 'pending').order('created_at', { ascending: false }).limit(100),
      // Push subscriptions
      supabase.from('push_subscriptions').select('*', { count: 'exact' }),
      // Agent activity (now readable by anon with RLS policy)
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
      // Pub submissions
      supabase.from('pub_submissions').select('*', { count: 'exact' }).order('created_at', { ascending: false }).limit(20),
    ])

    const pubs = pubsResult.data || []
    const pricedPubs = pubs.filter(p => p.price && p.price > 0)
    const prices = pricedPubs.map(p => p.price)
    const avgPrice = prices.length > 0 ? prices.reduce((a: number, b: number) => a + b, 0) / prices.length : 0
    const minPrice = prices.length > 0 ? Math.min(...prices) : 0
    const maxPrice = prices.length > 0 ? Math.max(...prices) : 0
    const suburbs = Array.from(new Set(pubs.map(p => p.suburb))).filter(Boolean)
    const vibeTagged = pubs.filter(p => p.vibe_tag).length

    // Build pub ID → name/slug lookup for price_history resolution
    const pubLookup = new Map<number, { name: string; slug: string }>()
    pubs.forEach((p: any) => { if (p.id) pubLookup.set(p.id, { name: p.name, slug: p.slug }) })

    // Pubs without prices
    const unpriced = pubs.filter(p => !p.price || p.price === 0)
    const displayPriceReports = pendingPriceReportsListResult.data?.length
      ? pendingPriceReportsListResult.data
      : priceReportsResult.data || []

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
        pending: pendingPriceReportsResult.count || 0,
        recent: displayPriceReports.map((r: any) => ({
          id: r.id,
          pubSlug: r.pub_slug,
          reportedPrice: r.reported_price,
          beerType: r.beer_type,
          reporter: r.reporter_name || 'Anonymous',
          reportType: r.report_type || 'price_report',
          submissionSource: r.submission_source || null,
          sourceUrl: r.source_url || null,
          evidenceText: r.evidence_text || null,
          observedAt: r.observed_at || null,
          status: r.status,
          createdAt: r.created_at,
        })),
      },
      snapshot: snapshotResult || null,
      priceHistory: {
        totalChanges: priceHistoryResult.count || 0,
        recent: (priceHistoryResult.data || []).map((h: any) => {
          const pub = pubLookup.get(h.pub_id)
          return {
            pubSlug: pub?.slug || `pub-${h.pub_id}`,
            pubName: pub?.name || `Pub #${h.pub_id}`,
            price: h.price,
            happyHourPrice: h.happy_hour_price,
            changeType: h.change_type || 'initial',
            source: h.source,
            changedAt: h.changed_at,
          }
        }),
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
      pubSubmissions: {
        total: pubSubmissionsResult.count || 0,
        pending: (pubSubmissionsResult.data || []).filter((s: any) => s.status === 'pending').length,
        recent: (pubSubmissionsResult.data || []).map((s: any) => ({
          id: s.id,
          pubName: s.pub_name,
          suburb: s.suburb,
          address: s.address,
          price: s.price,
          beerType: s.beer_type,
          submitterEmail: s.submitter_email,
          status: s.status,
          createdAt: s.created_at,
        })),
      },
      pubsList: pubs.map((p: any) => ({ slug: p.slug, name: p.name })).sort((a: any, b: any) => a.name.localeCompare(b.name)),
      generatedAt: new Date().toISOString(),
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  return handleAdminStats(request)
}
