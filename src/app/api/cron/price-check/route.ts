import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ifxkoblvgttelzboenpi.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlmeGtvYmx2Z3R0ZWx6Ym9lbnBpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzExODUwNjgsImV4cCI6MjA4Njc2MTA2OH0.qLy6B-VeVnMh0QSOxHK3uQEJ6iZr6xNHmfKov_7B-fY'
const supabase = createClient(supabaseUrl, supabaseAnonKey)

interface PriceChange {
  slug: string
  name: string
  suburb: string
  oldPrice: number
  newPrice: number
  direction: 'drop' | 'increase'
  diff: number
}

/**
 * GET /api/cron/price-check
 * 
 * Runs every 6 hours via Vercel Cron.
 * Compares current verified prices against cached prices.
 * If drops detected, sends push notifications to watchers.
 * Always updates the cache at the end.
 */
export async function GET(request: NextRequest) {
  // Verify cron secret (Vercel sends this automatically)
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // 1. Fetch current verified prices
    const { data: currentPubs, error: pubError } = await supabase
      .from('pubs')
      .select('slug, name, suburb, price')
      .eq('price_verified', true)
      .not('price', 'is', null)

    if (pubError || !currentPubs) {
      console.error('Failed to fetch pubs:', pubError)
      return NextResponse.json({ error: 'DB error' }, { status: 500 })
    }

    // 2. Fetch cached prices
    const { data: cached, error: cacheError } = await supabase
      .from('pub_price_cache')
      .select('pub_slug, cached_price')

    if (cacheError) {
      console.error('Failed to fetch cache:', cacheError)
      return NextResponse.json({ error: 'Cache error' }, { status: 500 })
    }

    // 3. Build lookup map: slug → cached price
    const cacheMap = new Map<string, number>()
    if (cached) {
      for (const row of cached) {
        if (row.cached_price !== null) {
          cacheMap.set(row.pub_slug, Number(row.cached_price))
        }
      }
    }

    // 4. Detect price changes
    const changes: PriceChange[] = []

    for (const pub of currentPubs) {
      const currentPrice = Number(pub.price)
      const cachedPrice = cacheMap.get(pub.slug)

      if (cachedPrice === undefined) continue // New pub, no comparison possible
      if (currentPrice === cachedPrice) continue // No change

      const diff = Math.abs(currentPrice - cachedPrice)
      if (diff < 0.01) continue // Floating point tolerance

      changes.push({
        slug: pub.slug,
        name: pub.name,
        suburb: pub.suburb,
        oldPrice: cachedPrice,
        newPrice: currentPrice,
        direction: currentPrice < cachedPrice ? 'drop' : 'increase',
        diff: Math.round(diff * 100) / 100,
      })
    }

    // 5. Send push notifications for price drops
    const drops = changes.filter(c => c.direction === 'drop')

    if (drops.length > 0 && process.env.PUSH_API_SECRET) {
      const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://perthpintprices.com'

      // Send individual notifications for each price drop
      for (const drop of drops) {
        try {
          await fetch(`${siteUrl}/api/push/send`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${process.env.PUSH_API_SECRET}`,
            },
            body: JSON.stringify({
              title: `Price Drop at ${drop.name}`,
              body: `$${drop.oldPrice.toFixed(2)} → $${drop.newPrice.toFixed(2)} (-$${drop.diff.toFixed(2)}) in ${drop.suburb}`,
              url: `/pub/${drop.slug}`,
              tag: `price-drop-${drop.slug}`,
              targetSlugs: [drop.slug],
              renotify: true,
            }),
          })
        } catch (err) {
          console.error(`Failed to send push for ${drop.name}:`, err)
        }
      }
    }

    // 6. Update cache with current prices
    const upserts = currentPubs.map(pub => ({
      pub_slug: pub.slug,
      cached_price: pub.price,
      cached_at: new Date().toISOString(),
    }))

    // Batch upsert in chunks of 100
    for (let i = 0; i < upserts.length; i += 100) {
      const chunk = upserts.slice(i, i + 100)
      const { error: upsertError } = await supabase
        .from('pub_price_cache')
        .upsert(chunk, { onConflict: 'pub_slug' })

      if (upsertError) {
        console.error('Cache upsert error:', upsertError)
      }
    }

    return NextResponse.json({
      checked: currentPubs.length,
      changes: changes.length,
      drops: drops.length,
      increases: changes.filter(c => c.direction === 'increase').length,
      priceChanges: changes.map(c => ({
        name: c.name,
        suburb: c.suburb,
        direction: c.direction,
        old: c.oldPrice,
        new: c.newPrice,
      })),
    })
  } catch (err) {
    console.error('Price check cron error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
