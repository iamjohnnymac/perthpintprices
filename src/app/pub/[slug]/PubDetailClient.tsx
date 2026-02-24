'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Pub } from '@/types/pub'
import E from '@/lib/emoji'
import WatchlistButton from '@/components/WatchlistButton'
import PriceHistory from '@/components/PriceHistory'
import PriceReporter from '@/components/PriceReporter'
import { formatHappyHourDays } from '@/lib/happyHourLive'

const PubDetailMap = dynamic(() => import('@/components/PubDetailMap'), {
  ssr: false,
  loading: () => <div className="h-[350px] bg-stone-100 animate-pulse rounded-2xl" />,
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

function getPriceLabel(price: number | null, avgPrice: number): string {
  if (price === null) return 'Price TBC'
  const diff = price - avgPrice
  if (diff <= -2) return 'Well Below Average'
  if (diff <= -0.5) return 'Below Average'
  if (diff <= 0.5) return 'Around Average'
  if (diff <= 2) return 'Above Average'
  return 'Premium'
}

interface PubDetailClientProps {
  pub: Pub
  nearbyPubs: Pub[]
}

export default function PubDetailClient({ pub, nearbyPubs }: PubDetailClientProps) {
  const [distance, setDistance] = useState<string | null>(null)
  const perthAvg = 9.20

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
    const text = `🍺 $${pub.price?.toFixed(2) ?? 'TBC'} pints at ${pub.name}, ${pub.suburb} — found on PintDex → perthpintprices.vercel.app/pub/${pub.slug}`
    if (navigator.share) {
      try { await navigator.share({ text, url: window.location.href }) } catch {}
    } else if (navigator.clipboard) {
      await navigator.clipboard.writeText(text)
    }
  }

  return (
    <div className="min-h-screen bg-cream">
      {/* Navigation */}
      <div className="bg-cream border-b border-stone-200/60 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-amber hover:text-amber-700 transition-colors font-semibold text-sm">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            Back to PintDex
          </Link>
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

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-stone-400">
          <Link href="/" className="hover:text-amber transition-colors">Home</Link>
          <span>/</span>
          <span>{pub.suburb}</span>
          <span>/</span>
          <span className="text-charcoal font-medium">{pub.name}</span>
        </nav>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-start">
          {/* Left column — info */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl sm:text-4xl font-heading font-semibold text-charcoal leading-tight">
                {pub.name}
              </h1>
              <p className="text-stone-500 text-lg mt-1">
                {pub.suburb}{distance && ` · ${distance}`}
              </p>
            </div>

            {/* Price */}
            <div className="flex items-end gap-3">
              <div>
                {pub.isHappyHourNow && pub.regularPrice !== null && pub.regularPrice !== pub.price && (
                  <div className="text-sm text-stone-400 line-through font-mono">${pub.regularPrice.toFixed(2)}</div>
                )}
                <div className={`text-5xl font-bold font-mono ${getPriceColor(pub.price)}`}>
                  {pub.price !== null ? `$${pub.price.toFixed(2)}` : 'TBC'}
                </div>
              </div>
              <div className="pb-1">
                <p className="text-sm text-stone-400">
                  {pub.price !== null ? getPriceLabel(pub.price, perthAvg) : 'Unverified'}
                </p>
                {pub.price !== null && (
                  <p className="text-xs text-stone-400 mt-0.5">
                    {pub.price < perthAvg
                      ? `$${(perthAvg - pub.price).toFixed(2)} below Perth avg`
                      : pub.price > perthAvg
                      ? `$${(pub.price - perthAvg).toFixed(2)} above Perth avg`
                      : 'At Perth average'
                    }
                  </p>
                )}
              </div>
            </div>

            {/* Status Badges */}
            <div className="flex flex-wrap gap-2">
              {pub.isHappyHourNow && (
                <Badge className="bg-amber hover:bg-amber text-white animate-pulse">
                  {E.party} HAPPY HOUR LIVE
                  {pub.happyHourMinutesRemaining && ` · ${pub.happyHourMinutesRemaining}m left`}
                </Badge>
              )}
              {pub.priceVerified && pub.price !== null && (
                <Badge variant="outline" className="border-stone-300 text-stone-500">
                  <svg className="w-3 h-3 mr-1 text-emerald-500" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
                  </svg>
                  Verified Price
                </Badge>
              )}
            </div>

            {/* Featured In — PintDex features this pub appears in */}
            {(pub.sunsetSpot || pub.kidFriendly || pub.hasTab) && (
              <div>
                <div className="text-xs text-stone-400 uppercase tracking-wider font-semibold mb-2">Featured In</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {pub.sunsetSpot && (
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200/50">
                      <span className="text-2xl">🌅</span>
                      <div>
                        <p className="text-sm font-semibold text-charcoal">Sunset Sippers</p>
                        <p className="text-xs text-stone-500">Great spot for golden hour pints</p>
                      </div>
                    </div>
                  )}
                  {pub.kidFriendly && (
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200/50">
                      <span className="text-2xl">👨‍👧</span>
                      <div>
                        <p className="text-sm font-semibold text-charcoal">Dad Bar</p>
                        <p className="text-xs text-stone-500">Kid-friendly with a solid pint</p>
                      </div>
                    </div>
                  )}
                  {pub.hasTab && (
                    <div className="flex items-center gap-3 p-3 rounded-xl border border-stone-200/50" style={{ background: 'linear-gradient(to right, #f3eef8, #f8f4fb)' }}>
                      <span className="text-2xl">🏇</span>
                      <div>
                        <p className="text-sm font-semibold text-charcoal">Punt & Pints</p>
                        <p className="text-xs text-stone-500">TAB venue — watch the races with a cold one</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Beer on tap */}
            <div>
              <div className="text-xs text-stone-400 uppercase tracking-wider font-semibold mb-1">What&apos;s on Tap</div>
              <p className="text-base text-stone-700 font-medium">🍺 {pub.beerType || 'House Pint'}</p>
            </div>

            {/* Happy Hour */}
            {(pub.happyHour || pub.happyHourPrice) && (
              <div className={`p-4 rounded-2xl border ${pub.isHappyHourNow ? 'border-amber/30 bg-amber/5' : 'border-stone-200/60 bg-white'}`}>
                <div className="text-xs text-stone-400 uppercase tracking-wider font-semibold mb-1">Happy Hour</div>
                {pub.happyHourPrice && (
                  <p className={`text-xl font-bold font-mono ${pub.isHappyHourNow ? 'text-amber' : 'text-stone-700'}`}>
                    ${pub.happyHourPrice.toFixed(2)}
                  </p>
                )}
                {pub.happyHourDays && pub.happyHourStart && pub.happyHourEnd ? (
                  <p className="text-sm text-stone-600 mt-0.5">
                    {formatHappyHourDays(pub.happyHourDays)} · {formatHappyHourTime(pub.happyHourStart, pub.happyHourEnd)}
                  </p>
                ) : (
                  <>
                    {pub.happyHourDays && <p className="text-sm text-stone-600 mt-0.5">{formatHappyHourDays(pub.happyHourDays)}</p>}
                    {pub.happyHourStart && pub.happyHourEnd && (
                      <p className="text-sm text-stone-500">{formatHappyHourTime(pub.happyHourStart, pub.happyHourEnd)}</p>
                    )}
                    {!pub.happyHourPrice && !pub.happyHourStart && pub.happyHour && <p className="text-sm text-stone-600">{pub.happyHour}</p>}
                  </>
                )}
              </div>
            )}

            {/* About */}
            {pub.description && (
              <div>
                <div className="text-xs text-stone-400 uppercase tracking-wider font-semibold mb-2">About</div>
                <p className="text-base text-stone-600 leading-relaxed">{pub.description}</p>
              </div>
            )}

            {/* Price History Chart */}
            <PriceHistory pubId={pub.id} currentPrice={pub.price} />

            {/* Report a Price */}
            <PriceReporter pubSlug={pub.slug} pubName={pub.name} currentPrice={pub.price} />

            {/* Data quality */}
            <div className="text-sm text-stone-400 space-y-1">
              {pub.lastVerified && <p>Verified {timeAgo(pub.lastVerified)}</p>}
              {pub.lastUpdated && <p>Updated: {new Date(pub.lastUpdated).toLocaleDateString('en-AU')}</p>}
            </div>

            {/* Action buttons */}
            <div className="flex gap-3">
              {pub.website && (
                <a
                  href={pub.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 bg-amber text-white text-center py-3 rounded-2xl font-semibold text-sm hover:bg-amber-dark transition-colors"
                >
                  Visit Website →
                </a>
              )}
              <a
                href={directionsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 bg-charcoal text-white text-center py-3 px-6 rounded-2xl font-semibold text-sm hover:bg-charcoal/90 transition-colors"
              >
                Directions
              </a>
            </div>
          </div>

          {/* Right column — map/visual */}
          <div className="md:sticky md:top-24 rounded-2xl overflow-hidden h-[350px] border border-stone-200/60 shadow-sm">
            <PubDetailMap lat={pub.lat} lng={pub.lng} name={pub.name} price={pub.price} />
          </div>
        </div>

        {/* Nearby Pubs */}
        {nearbyPubs.length > 0 && (
          <div className="space-y-4 mt-16">
            <h2 className="text-xl font-heading font-semibold text-charcoal">
              More in {pub.suburb}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {nearbyPubs.map(nearby => (
                <Link key={nearby.id} href={`/pub/${nearby.slug}`}>
                  <Card className="border-stone-200/60 shadow-sm rounded-2xl hover:shadow-lg transition-all cursor-pointer">
                    <CardContent className="p-5 flex items-center justify-between">
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-charcoal text-base truncate">{nearby.name}</p>
                        <p className="text-sm text-stone-500 truncate">{nearby.beerType}</p>
                        {nearby.isHappyHourNow && (
                          <p className="text-xs text-amber font-semibold mt-0.5">{E.party} Happy Hour Live</p>
                        )}
                      </div>
                      <div className={`text-xl font-bold font-mono ${getPriceColor(nearby.price)} ml-3`}>
                        {nearby.price !== null ? `$${nearby.price.toFixed(2)}` : 'TBC'}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center py-8 text-xs text-stone-400">
          <p>Data sourced from verified pub menus and community reports.</p>
          <p className="mt-1">
            Wrong price?{' '}
            <Link href="/" className="text-amber hover:text-amber-dark font-semibold">
              Report it on PintDex
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
