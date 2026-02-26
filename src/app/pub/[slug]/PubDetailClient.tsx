'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { Pub } from '@/types/pub'
import E from '@/lib/emoji'
import WatchlistButton from '@/components/WatchlistButton'
import PriceHistory from '@/components/PriceHistory'
import PriceReporter from '@/components/PriceReporter'
import { formatHappyHourDays } from '@/lib/happyHourLive'

const PubDetailMap = dynamic(() => import('@/components/PubDetailMap'), {
  ssr: false,
  loading: () => <div className="h-[350px] bg-cream animate-pulse rounded-xl" />,
})

function timeAgo(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  if (diffDays < 1) return 'today'
  if (diffDays < 7) return `${diffDays}d ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`
  if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo ago`
  return `${Math.floor(diffDays / 365)}y ago`
}

function formatHappyHourTime(start: string | null, end: string | null): string {
  if (!start || !end) return ''
  const fmt = (t: string) => {
    const h = parseInt(t.split(':')[0])
    const period = h >= 12 ? 'pm' : 'am'
    const h12 = h > 12 ? h - 12 : h === 0 ? 12 : h
    return `${h12}${period}`
  }
  return `${fmt(start)} – ${fmt(end)}`
}

function getPriceColor(price: number | null): string {
  if (price === null) return 'text-stone-400'
  if (price <= 7) return 'text-emerald-600'
  if (price <= 9) return 'text-amber-700'
  if (price <= 11) return 'text-orange-600'
  return 'text-red-600'
}

interface PubDetailClientProps {
  pub: Pub
  nearbyPubs: Pub[]
  avgPrice: number
}

export default function PubDetailClient({ pub, nearbyPubs, avgPrice }: PubDetailClientProps) {
  const [distance, setDistance] = useState<string | null>(null)

  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition((pos) => {
        const R = 6371
        const dLat = (pub.lat - pos.coords.latitude) * Math.PI / 180
        const dLng = (pub.lng - pos.coords.longitude) * Math.PI / 180
        const a = Math.sin(dLat / 2) ** 2 +
          Math.cos(pos.coords.latitude * Math.PI / 180) * Math.cos(pub.lat * Math.PI / 180) *
          Math.sin(dLng / 2) ** 2
        const d = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
        setDistance(d < 1 ? `${Math.round(d * 1000)}m away` : `${d.toFixed(1)}km away`)
      }, () => {})
    }
  }, [pub.lat, pub.lng])

  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${pub.lat},${pub.lng}`

  async function sharePub() {
    const text = `🍺 $${pub.price?.toFixed(2) ?? 'TBC'} pints at ${pub.name}, ${pub.suburb} — found on Arvo`
    if (navigator.share) {
      try { await navigator.share({ text, url: window.location.href }) } catch {}
    } else if (navigator.clipboard) {
      await navigator.clipboard.writeText(text)
    }
  }

  const priceDiff = pub.effectivePrice && avgPrice ? pub.effectivePrice - avgPrice : 0

  return (
    <div className="min-h-screen bg-cream">
      {/* Navigation */}
      <div className="bg-white/95 backdrop-blur-sm border-b border-stone-200/60 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-1.5 text-stone-warm hover:text-charcoal transition-colors text-sm">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
            </Link>
            <Link href="/" className="flex items-center gap-1.5">
              <span className="text-amber text-lg">✳</span>
              <span className="font-serif text-lg text-charcoal">arvo</span>
            </Link>
          </div>
          <div className="flex items-center gap-1">
            <WatchlistButton slug={pub.slug} name={pub.name} suburb={pub.suburb} size="md" />
            <button onClick={sharePub} className="text-stone-400 hover:text-amber transition-colors p-2" title="Share this pub">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 space-y-3">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-stone-warm">
          <Link href="/" className="hover:text-amber transition-colors">Home</Link>
          <span className="text-stone-300">/</span>
          <span>{pub.suburb}</span>
          <span className="text-stone-300">/</span>
          <span className="text-charcoal font-medium">{pub.name}</span>
        </nav>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 items-start">
          {/* Left column — info */}
          <div className="space-y-3">
            {/* Name + vibe */}
            <div>
              <h1 className="font-serif text-3xl sm:text-4xl text-charcoal leading-tight">
                {pub.name}
              </h1>
              <div className="flex items-center gap-2 mt-2">
                <p className="text-stone-warm">
                  {pub.suburb}{distance && ` · ${distance}`}
                </p>
                {pub.vibeTag && (
                  <span className="text-xs text-stone-warm italic px-2 py-0.5 rounded-full bg-cream-dark">{pub.vibeTag}</span>
                )}
              </div>
            </div>

            {/* Price block — EatClub style */}
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-[11px] font-semibold text-stone-warm uppercase tracking-wider mb-1">Pint Price</p>
                  {pub.isHappyHourNow && pub.regularPrice !== null && pub.regularPrice !== pub.price && (
                    <div className="text-sm text-stone-400 line-through font-mono">${pub.regularPrice.toFixed(2)}</div>
                  )}
                  <div className={`text-4xl sm:text-5xl font-bold font-mono ${getPriceColor(pub.price)}`}>
                    {pub.price !== null ? `$${pub.price.toFixed(2)}` : 'TBC'}
                  </div>
                </div>
                <div className="text-right space-y-1.5">
                  {pub.effectivePrice && Math.abs(priceDiff) >= 0.05 && (
                    <span className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full ${
                      priceDiff < 0 
                        ? 'bg-emerald-50 text-emerald-700' 
                        : 'bg-red-50 text-red-600'
                    }`}>
                      ${Math.abs(priceDiff).toFixed(2)} {priceDiff < 0 ? 'below' : 'above'} avg
                    </span>
                  )}
                  {pub.beerType && (
                    <p className="text-xs text-stone-warm">🍺 {pub.beerType}</p>
                  )}
                </div>
              </div>
              {/* Status row */}
              <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-stone-100">
                {pub.isHappyHourNow && (
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber bg-amber/10 px-2.5 py-1 rounded-full">
                    ⚡ HAPPY HOUR{pub.happyHourMinutesRemaining ? ` · ${pub.happyHourMinutesRemaining}m left` : ''}
                  </span>
                )}
                {pub.priceVerified && pub.price !== null && (
                  <span className="inline-flex items-center gap-1 text-xs text-stone-warm bg-cream px-2.5 py-1 rounded-full">
                    <svg className="w-3 h-3 text-emerald-500" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/></svg>
                    Verified
                  </span>
                )}
                {pub.lastVerified && (
                  <span className="text-xs text-stone-400">Updated {timeAgo(pub.lastVerified)}</span>
                )}
              </div>
            </div>

            {/* Happy Hour card */}
            {(pub.happyHour || pub.happyHourPrice) && (
              <div className={`rounded-xl p-5 border ${pub.isHappyHourNow ? 'border-amber/30 bg-amber/5' : 'bg-white border-stone-200/40 shadow-sm'}`}>
                <p className="text-[11px] font-semibold text-stone-warm uppercase tracking-wider mb-2">Happy Hour</p>
                {pub.happyHourPrice && (
                  <p className={`text-2xl font-bold font-mono ${pub.isHappyHourNow ? 'text-amber' : 'text-charcoal'}`}>
                    ${pub.happyHourPrice.toFixed(2)}
                  </p>
                )}
                {pub.happyHourDays && pub.happyHourStart && pub.happyHourEnd ? (
                  <p className="text-sm text-stone-warm mt-1">
                    {formatHappyHourDays(pub.happyHourDays)} · {formatHappyHourTime(pub.happyHourStart, pub.happyHourEnd)}
                  </p>
                ) : (
                  <>
                    {pub.happyHourDays && <p className="text-sm text-stone-warm mt-1">{formatHappyHourDays(pub.happyHourDays)}</p>}
                    {pub.happyHourStart && pub.happyHourEnd && (
                      <p className="text-sm text-stone-warm">{formatHappyHourTime(pub.happyHourStart, pub.happyHourEnd)}</p>
                    )}
                    {!pub.happyHourPrice && !pub.happyHourStart && pub.happyHour && <p className="text-sm text-stone-warm">{pub.happyHour}</p>}
                  </>
                )}
              </div>
            )}

            {/* Featured In */}
            {(pub.sunsetSpot || pub.kidFriendly || pub.hasTab) && (
              <div>
                <p className="text-[11px] font-semibold text-stone-warm uppercase tracking-wider mb-3">Featured In</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {pub.sunsetSpot && (
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200/50">
                      <span className="text-xl">🌅</span>
                      <div>
                        <p className="text-sm font-semibold text-charcoal">Sunset Sippers</p>
                        <p className="text-xs text-stone-warm">Great spot for golden hour</p>
                      </div>
                    </div>
                  )}
                  {pub.kidFriendly && (
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200/50">
                      <span className="text-xl">👨‍👧</span>
                      <div>
                        <p className="text-sm font-semibold text-charcoal">Dad Bar</p>
                        <p className="text-xs text-stone-warm">Kid-friendly venue</p>
                      </div>
                    </div>
                  )}
                  {pub.hasTab && (
                    <div className="flex items-center gap-3 p-3 rounded-xl border border-stone-200/50" style={{ background: 'linear-gradient(to right, #f3eef8, #f8f4fb)' }}>
                      <span className="text-xl">🏇</span>
                      <div>
                        <p className="text-sm font-semibold text-charcoal">Punt & Pints</p>
                        <p className="text-xs text-stone-warm">TAB venue</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* About */}
            {pub.description && (
              <div>
                <p className="text-[11px] font-semibold text-stone-warm uppercase tracking-wider mb-2">About</p>
                <p className="text-sm text-stone-warm leading-relaxed">{pub.description}</p>
              </div>
            )}

            {/* Price History */}
            <PriceHistory pubId={pub.id} currentPrice={pub.price} />

            {/* Report a Price */}
            <div id="report-price">
              <PriceReporter pubSlug={pub.slug} pubName={pub.name} currentPrice={pub.price} />
            </div>

            {/* Action buttons — EatClub-style bottom CTA */}
            <div className="flex gap-3">
              {pub.website && (
                <a
                  href={pub.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 bg-amber text-white text-center py-3.5 rounded-full font-semibold text-sm hover:bg-amber-dark transition-colors flex items-center justify-center gap-2"
                >
                  Visit Website
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" /></svg>
                </a>
              )}
              <a
                href={directionsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 bg-charcoal text-white text-center py-3.5 rounded-full font-semibold text-sm hover:bg-charcoal/90 transition-colors flex items-center justify-center gap-2"
              >
                Get Directions
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" /></svg>
              </a>
            </div>

          </div>

          {/* Right column — map */}
          <div className="md:sticky md:top-20 rounded-xl overflow-hidden h-[350px] shadow-sm">
            <PubDetailMap lat={pub.lat} lng={pub.lng} name={pub.name} price={pub.price} />
          </div>
        </div>

        {/* Nearby Pubs */}
        {nearbyPubs.length > 0 && (
          <div className="space-y-3 mt-5">
            <h2 className="font-serif text-2xl text-charcoal">
              More in {pub.suburb}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {nearbyPubs.map(nearby => (
                <Link key={nearby.id} href={`/pub/${nearby.slug}`} className="group">
                  <div className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-all flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-charcoal text-sm group-hover:text-amber transition-colors truncate">{nearby.name}</p>
                      <p className="text-xs text-stone-warm truncate">{nearby.beerType || 'House Pint'}</p>
                      {nearby.isHappyHourNow && (
                        <p className="text-xs text-amber font-semibold mt-0.5">⚡ Happy Hour Live</p>
                      )}
                    </div>
                    <div className="flex items-center gap-3 ml-3">
                      <span className={`text-lg font-bold font-mono ${getPriceColor(nearby.price)}`}>
                        {nearby.price !== null ? `$${nearby.price.toFixed(2)}` : 'TBC'}
                      </span>
                      <div className="w-7 h-7 rounded-full border border-stone-200 flex items-center justify-center group-hover:border-amber transition-colors">
                        <svg className="w-3.5 h-3.5 text-stone-400 group-hover:text-amber transition-colors" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Footer note */}
        <div className="text-center py-3 text-xs text-stone-400">
          <p>Data sourced from verified pub menus and community reports.</p>

        </div>
      </div>
    </div>
  )
}
