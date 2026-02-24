import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ifxkoblvgttelzboenpi.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlmeGtvYmx2Z3R0ZWx6Ym9lbnBpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzExODUwNjgsImV4cCI6MjA4Njc2MTA2OH0.qLy6B-VeVnMh0QSOxHK3uQEJ6iZr6xNHmfKov_7B-fY'
)

/**
 * Pint of the Day Algorithm:
 * 1. Get all pubs with verified prices
 * 2. Use the current date as a seed for deterministic daily selection
 * 3. Score pubs based on: price (lower = better), happy hour active, variety (different suburb each day)
 * 4. Pick the top scorer as Pint of the Day
 * 
 * The algorithm is deterministic — same date always returns same pub.
 * This lets us cache aggressively and ensures consistency across users.
 */
export async function GET() {
  try {
    // Get Perth date (AWST = UTC+8)
    const now = new Date()
    const perthTime = new Date(now.getTime() + (8 * 60 * 60 * 1000))
    const dateStr = perthTime.toISOString().split('T')[0] // "2025-02-25"
    
    // Deterministic seed from date
    const seed = dateStr.split('-').reduce((acc, n) => acc + parseInt(n), 0)
    
    // Fetch all priced pubs
    const { data: pubs, error } = await supabase
      .from('pubs')
      .select('id, name, slug, suburb, price, beer_type, address, lat, lng, happy_hour, happy_hour_price, happy_hour_days, happy_hour_start, happy_hour_end, image_url, price_verified')
      .eq('price_verified', true)
      .not('price', 'is', null)
      .order('price', { ascending: true })

    if (error || !pubs || pubs.length === 0) {
      return NextResponse.json({ error: 'No pubs available' }, { status: 500 })
    }

    // Score each pub
    const scored = pubs.map((pub, index) => {
      let score = 0
      
      // Price score: cheaper = higher score (max 50 points)
      const prices = pubs.map(p => Number(p.price))
      const minPrice = Math.min(...prices)
      const maxPrice = Math.max(...prices)
      const priceRange = maxPrice - minPrice || 1
      score += ((maxPrice - Number(pub.price)) / priceRange) * 50
      
      // Happy hour bonus: +20 if has happy hour data
      if (pub.happy_hour_days && pub.happy_hour_start) {
        score += 15
        // Extra bonus if has a specific HH price
        if (pub.happy_hour_price) score += 10
      }
      
      // Variety bonus: use seed to rotate through price tiers
      // This ensures we don't always pick the absolute cheapest
      const tier = index % 10
      const targetTier = seed % 10
      if (tier === targetTier) score += 25
      if (Math.abs(tier - targetTier) <= 1) score += 10
      
      return { pub, score }
    })
    
    // Sort by score, then use seed to break ties deterministically
    scored.sort((a, b) => {
      if (Math.abs(a.score - b.score) < 0.5) {
        // Use seeded position for tie-breaking
        const aHash = (a.pub.id * seed) % 1000
        const bHash = (b.pub.id * seed) % 1000
        return bHash - aHash
      }
      return b.score - a.score
    })
    
    const winner = scored[0].pub
    const runnerUp = scored[1]?.pub
    
    // Check if happy hour is currently active for the winner
    const perthHour = perthTime.getUTCHours()
    const perthDay = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][perthTime.getUTCDay()]
    
    let isHappyHourNow = false
    let effectivePrice = Number(winner.price)
    
    if (winner.happy_hour_start && winner.happy_hour_end && winner.happy_hour_days) {
      const startH = parseInt(winner.happy_hour_start.split(':')[0])
      const endH = parseInt(winner.happy_hour_end.split(':')[0])
      const days = winner.happy_hour_days.replace(/[{}]/g, '').split(',').map((d: string) => d.trim())
      
      if (days.some((d: string) => d.toLowerCase().startsWith(perthDay.toLowerCase())) || 
          days.some((d: string) => ['daily', '7 days', 'everyday'].includes(d.toLowerCase()))) {
        if (perthHour >= startH && perthHour < endH) {
          isHappyHourNow = true
          if (winner.happy_hour_price) {
            effectivePrice = Number(winner.happy_hour_price)
          }
        }
      }
    }

    // Why this pub? Generate a reason
    const reasons = []
    if (effectivePrice <= 7) reasons.push('One of Perth\'s cheapest pints')
    else if (effectivePrice <= 9) reasons.push('Great value pint')
    if (isHappyHourNow) reasons.push('Happy hour is ON right now')
    else if (winner.happy_hour_days) reasons.push('Has happy hour specials')
    if (winner.beer_type) reasons.push(`Pouring ${winner.beer_type}`)
    
    const reason = reasons.length > 0 ? reasons[0] : 'Top value pick for today'

    return NextResponse.json({
      date: dateStr,
      pub: {
        name: winner.name,
        slug: winner.slug,
        suburb: winner.suburb,
        address: winner.address,
        price: Number(winner.price),
        effectivePrice,
        beerType: winner.beer_type,
        happyHour: winner.happy_hour,
        isHappyHourNow,
        imageUrl: winner.image_url,
      },
      reason,
      runnerUp: runnerUp ? {
        name: runnerUp.name,
        slug: runnerUp.slug,
        suburb: runnerUp.suburb,
        price: Number(runnerUp.price),
      } : null,
    })
  } catch (err) {
    console.error('Pint of the Day error:', err)
    return NextResponse.json({ error: 'Failed to pick pint of the day' }, { status: 500 })
  }
}
