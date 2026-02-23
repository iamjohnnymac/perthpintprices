'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Pub } from '@/types/pub'
import E from '@/lib/emoji'

const PubDetailMap = dynamic(() => import('@/components/PubDetailMap'), {
  ssr: false,
  loading: () => <div className="h-64 bg-stone-100 animate-pulse rounded-xl" />,
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
  if (price === null) return 'from-stone-400 to-stone-500'
  if (price <= 7) return 'from-emerald-500 to-emerald-600'
  if (price <= 9) return 'from-teal to-cyan-600'
  if (price <= 11) return 'from-amber-500 to-amber-600'
  return 'from-red-500 to-red-600'
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
      <div className="bg-white border-b border-stone-200 sticky top-0 z-50">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-amber hover:text-amber-700 transition-colors font-semibold text-sm">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            Back to PintDex
          </Link>
          <button onClick={sharePub} className="text-stone-400 hover:text-amber transition-colors p-2" title="Share this pub">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
            </svg>
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
        {/* Hero Section */}
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold font-heading text-stone-900 leading-tight">{pub.name}</h1>
              <p className="text-stone-500 mt-1">{pub.suburb}, Perth WA</p>
              {distance && <p className="text-amber text-sm font-medium mt-0.5">{distance}</p>}
            </div>
            <div className="text-right flex-shrink-0">
              {pub.isHappyHourNow && pub.regularPrice !== null && pub.regularPrice !== pub.price && (
                <div className="text-sm text-stone-400 line-through font-mono">${pub.regularPrice.toFixed(2)}</div>
              )}
              <div className={`text-4xl font-bold font-mono bg-gradient-to-br ${getPriceColor(pub.price)} bg-clip-text text-transparent`}>
                {pub.price !== null ? `$${pub.price.toFixed(2)}` : 'TBC'}
              </div>
              <p className="text-xs text-stone-400 mt-0.5">
                {pub.price !== null ? getPriceLabel(pub.price, perthAvg) : 'Unverified'}
              </p>
            </div>
          </div>

          {/* Badges Row */}
          <div className="flex flex-wrap gap-2">
            {pub.isHappyHourNow && (
              <Badge className="bg-amber hover:bg-amber text-white animate-pulse">
                {E.party} HAPPY HOUR LIVE
                {pub.happyHourMinutesRemaining && ` · ${pub.happyHourMinutesRemaining}m left`}
              </Badge>
            )}
            {pub.hasTab && (
              <Badge className="text-white" style={{ backgroundColor: '#5B2D8E' }}>TAB Venue</Badge>
            )}
            {pub.kidFriendly && (
              <Badge className="bg-emerald-600 hover:bg-emerald-600 text-white">Kid Friendly</Badge>
            )}
            {pub.sunsetSpot && (
              <Badge className="bg-amber-500 hover:bg-amber-500 text-white">Sunset Spot</Badge>
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
        </div>

        {/* Map */}
        <Card className="overflow-hidden border-stone-200/60 shadow-sm rounded-xl">
          <div className="h-64">
            <PubDetailMap lat={pub.lat} lng={pub.lng} name={pub.name} price={pub.price} />
          </div>
        </Card>

        {/* Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Address */}
          <Card className="border-stone-200/60 shadow-sm rounded-xl">
            <CardContent className="p-4">
              <div className="text-xs text-stone-400 uppercase tracking-wider font-semibold mb-1">Address</div>
              <p className="text-sm text-stone-700">{pub.address}</p>
              <a
                href={directionsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 mt-2 text-amber text-xs font-semibold hover:text-amber-700 transition-colors"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                </svg>
                Get Directions
              </a>
            </CardContent>
          </Card>

          {/* Beer */}
          <Card className="border-stone-200/60 shadow-sm rounded-xl">
            <CardContent className="p-4">
              <div className="text-xs text-stone-400 uppercase tracking-wider font-semibold mb-1">What&apos;s on Tap</div>
              <p className="text-sm text-stone-700 font-medium">{pub.beerType || 'House Pint'}</p>
              {pub.price !== null && (
                <p className="text-xs text-stone-400 mt-1">
                  {pub.price < perthAvg
                    ? `$${(perthAvg - pub.price).toFixed(2)} below Perth avg`
                    : pub.price > perthAvg
                    ? `$${(pub.price - perthAvg).toFixed(2)} above Perth avg`
                    : 'At Perth average'
                  }
                </p>
              )}
            </CardContent>
          </Card>

          {/* Happy Hour */}
          {(pub.happyHour || pub.happyHourPrice) && (
            <Card className={`border-stone-200/60 shadow-sm rounded-xl ${pub.isHappyHourNow ? 'ring-2 ring-teal/30 bg-amber/5' : ''}`}>
              <CardContent className="p-4">
                <div className="text-xs text-stone-400 uppercase tracking-wider font-semibold mb-1">Happy Hour</div>
                {pub.happyHourPrice && (
                  <p className={`text-lg font-bold font-mono ${pub.isHappyHourNow ? 'text-amber' : 'text-stone-700'}`}>
                    ${pub.happyHourPrice.toFixed(2)}
                  </p>
                )}
                {pub.happyHourDays && (
                  <p className="text-sm text-stone-600 mt-0.5">{pub.happyHourDays}</p>
                )}
                {pub.happyHourStart && pub.happyHourEnd && (
                  <p className="text-sm text-stone-500">
                    {formatHappyHourTime(pub.happyHourStart, pub.happyHourEnd)}
                  </p>
                )}
                {!pub.happyHourPrice && pub.happyHour && (
                  <p className="text-sm text-stone-600">{pub.happyHour}</p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Verified */}
          <Card className="border-stone-200/60 shadow-sm rounded-xl">
            <CardContent className="p-4">
              <div className="text-xs text-stone-400 uppercase tracking-wider font-semibold mb-1">Data Quality</div>
              {pub.lastVerified && (
                <p className="text-sm text-stone-700">
                  Verified {timeAgo(pub.lastVerified)}
                </p>
              )}
              {pub.lastUpdated && (
                <p className="text-xs text-stone-400 mt-0.5">
                  Last updated: {new Date(pub.lastUpdated).toLocaleDateString('en-AU')}
                </p>
              )}
              {!pub.lastVerified && !pub.lastUpdated && (
                <p className="text-sm text-stone-500">No verification data</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Description */}
        {pub.description && (
          <Card className="border-stone-200/60 shadow-sm rounded-xl">
            <CardContent className="p-4">
              <div className="text-xs text-stone-400 uppercase tracking-wider font-semibold mb-2">About</div>
              <p className="text-sm text-stone-600 leading-relaxed">{pub.description}</p>
            </CardContent>
          </Card>
        )}

        {/* Website & Actions */}
        <div className="flex gap-3">
          {pub.website && (
            <a
              href={pub.website}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 bg-amber text-white text-center py-3 rounded-xl font-semibold text-sm hover:bg-amber-700 transition-colors"
            >
              Visit Website →
            </a>
          )}
          <a
            href={directionsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={`${pub.website ? '' : 'flex-1'} bg-stone-800 text-white text-center py-3 px-6 rounded-xl font-semibold text-sm hover:bg-stone-700 transition-colors`}
          >
            Directions
          </a>
        </div>

        {/* Nearby Pubs */}
        {nearbyPubs.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-lg font-bold font-heading text-stone-900">
              More in {pub.suburb}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {nearbyPubs.map(nearby => (
                <Link key={nearby.id} href={`/pub/${nearby.slug}`}>
                  <Card className="border-stone-200/60 shadow-sm rounded-xl hover:shadow-md transition-all cursor-pointer">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-stone-900 text-sm truncate">{nearby.name}</p>
                        <p className="text-xs text-stone-500 truncate">{nearby.beerType}</p>
                        {nearby.isHappyHourNow && (
                          <p className="text-xs text-amber font-semibold mt-0.5">{E.party} Happy Hour Live</p>
                        )}
                      </div>
                      <div className={`text-lg font-bold font-mono bg-gradient-to-br ${getPriceColor(nearby.price)} bg-clip-text text-transparent ml-3`}>
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
        <div className="text-center py-6 text-xs text-stone-400">
          <p>Data sourced from verified pub menus and community reports.</p>
          <p className="mt-1">
            Wrong price?{' '}
            <Link href="/" className="text-amber hover:text-amber-700 font-semibold">
              Report it on PintDex
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
