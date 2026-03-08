'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { Pub } from '@/types/pub'
import WatchlistButton from '@/components/WatchlistButton'
import PriceHistory from '@/components/PriceHistory'
import PriceReporter from '@/components/PriceReporter'
import { formatHappyHourDays } from '@/lib/happyHourLive'
import Footer from '@/components/Footer'

const PubDetailMap = dynamic(() => import('@/components/PubDetailMap'), {
  ssr: false,
  loading: () => <div className="h-[350px] bg-off-white animate-pulse rounded-card border-3 border-ink" />,
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
  return `${fmt(start)} - ${fmt(end)}`
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
    const text = `$${pub.price?.toFixed(2) ?? 'TBC'} pints at ${pub.name}, ${pub.suburb} - found on Arvo`
    if (navigator.share) {
      try { await navigator.share({ text, url: window.location.href }) } catch {}
    } else if (navigator.clipboard) {
      await navigator.clipboard.writeText(text)
    }
  }

  const priceDiff = pub.effectivePrice && avgPrice ? pub.effectivePrice - avgPrice : 0

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <header className="max-w-container mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2 no-underline">
            <div className="w-7 h-7 bg-amber border-2 border-ink rounded-md flex items-center justify-center text-sm shadow-[2px_2px_0_#171717]">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 2v20M2 12h20M4.93 4.93l14.14 14.14M19.07 4.93L4.93 19.07" stroke="white" strokeWidth="2.5" strokeLinecap="round"/></svg>
            </div>
            <span className="font-mono text-[1.6rem] font-extrabold text-ink tracking-[-0.04em]">arvo</span>
          </Link>
        </div>
        <div className="flex items-center gap-2">
          <WatchlistButton slug={pub.slug} name={pub.name} suburb={pub.suburb} size="md" />
          <button onClick={sharePub} className="text-gray-mid hover:text-amber transition-colors p-2" title="Share this pub">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
            </svg>
          </button>
        </div>
      </header>

      <div className="max-w-container mx-auto px-6 pb-8 space-y-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 font-mono text-[0.7rem] text-gray-mid">
          <Link href="/" className="hover:text-amber transition-colors no-underline">Home</Link>
          <span>/</span>
          <Link href={`/suburb/${pub.suburb.toLowerCase().replace(/['']/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`} className="hover:text-amber transition-colors no-underline">{pub.suburb}</Link>
          <span>/</span>
          <span className="text-ink font-bold">{pub.name}</span>
        </nav>

        {/* Name + vibe */}
        <div>
          <h1 className="font-mono font-extrabold text-[clamp(1.8rem,5vw,2.4rem)] tracking-[-0.03em] text-ink leading-[1.1]">
            {pub.name}
          </h1>
          <div className="flex items-center gap-2 mt-2 text-[0.8rem] text-gray-mid">
            <span>{pub.suburb}{distance && ` · ${distance}`}</span>
            {pub.vibeTag && (
              <span className="font-mono text-[0.6rem] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border border-gray-light text-gray-mid">{pub.vibeTag}</span>
            )}
          </div>
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          {/* Left column */}
          <div className="space-y-5">
            {/* Price block */}
            <div className="border-3 border-ink rounded-card p-5 shadow-hard">
              <div className="flex items-end justify-between">
                <div>
                  <p className="font-mono text-[0.68rem] font-bold uppercase tracking-[0.1em] text-gray-mid mb-1">Pint Price</p>
                  {pub.isHappyHourNow && pub.regularPrice !== null && pub.regularPrice !== pub.price && (
                    <div className="text-sm text-gray-mid line-through font-mono">${pub.regularPrice.toFixed(2)}</div>
                  )}
                  <div className="font-mono text-[2.5rem] font-extrabold text-ink leading-none">
                    {pub.price !== null ? `$${pub.price.toFixed(2)}` : 'TBC'}
                  </div>
                </div>
                <div className="text-right space-y-1.5">
                  {pub.effectivePrice && Math.abs(priceDiff) >= 0.05 && (
                    <span className={`inline-block font-mono text-[0.65rem] font-bold px-2.5 py-1 rounded-full border ${
                      priceDiff < 0
                        ? 'bg-green-pale text-green border-green'
                        : 'bg-red-pale text-red border-red'
                    }`}>
                      ${Math.abs(priceDiff).toFixed(2)} {priceDiff < 0 ? 'below' : 'above'} avg
                    </span>
                  )}
                  {pub.beerType && (
                    <p className="text-[0.7rem] text-gray-mid">{pub.beerType}</p>
                  )}
                </div>
              </div>
              {/* Status row */}
              <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-light">
                {pub.isHappyHourNow && (
                  <span className="inline-flex items-center gap-1.5 font-mono text-[0.6rem] font-bold uppercase tracking-wider text-red bg-red-pale px-2.5 py-1 rounded-full border border-red">
                    HH{pub.happyHourMinutesRemaining ? ` · ${pub.happyHourMinutesRemaining}m left` : ''}
                  </span>
                )}
                {pub.priceVerified && pub.price !== null && (
                  <span className="inline-flex items-center gap-1 font-mono text-[0.6rem] font-bold uppercase tracking-wider text-green bg-green-pale px-2.5 py-1 rounded-full border border-green">
                    Verified
                  </span>
                )}
                {pub.lastVerified && (
                  <span className="text-[0.7rem] text-gray-mid">Updated {timeAgo(pub.lastVerified)}</span>
                )}
              </div>
            </div>

            {/* Happy Hour card */}
            {(pub.happyHour || pub.happyHourPrice) && (
              <div className={`border-3 rounded-card p-5 ${pub.isHappyHourNow ? 'border-red bg-red-pale' : 'border-ink shadow-hard-sm'}`}>
                <p className="font-mono text-[0.68rem] font-bold uppercase tracking-[0.1em] text-gray-mid mb-2">Happy Hour</p>
                {pub.happyHourPrice && (
                  <p className={`font-mono text-[1.5rem] font-extrabold ${pub.isHappyHourNow ? 'text-red' : 'text-ink'}`}>
                    ${pub.happyHourPrice.toFixed(2)}
                  </p>
                )}
                {pub.happyHourDays && pub.happyHourStart && pub.happyHourEnd ? (
                  <p className="text-[0.8rem] text-gray-mid mt-1">
                    {formatHappyHourDays(pub.happyHourDays)} · {formatHappyHourTime(pub.happyHourStart, pub.happyHourEnd)}
                  </p>
                ) : (
                  <>
                    {pub.happyHourDays && <p className="text-[0.8rem] text-gray-mid mt-1">{formatHappyHourDays(pub.happyHourDays)}</p>}
                    {pub.happyHourStart && pub.happyHourEnd && (
                      <p className="text-[0.8rem] text-gray-mid">{formatHappyHourTime(pub.happyHourStart, pub.happyHourEnd)}</p>
                    )}
                    {!pub.happyHourPrice && !pub.happyHourStart && pub.happyHour && <p className="text-[0.8rem] text-gray-mid">{pub.happyHour}</p>}
                  </>
                )}
              </div>
            )}

            {/* About */}
            {pub.description && (
              <div>
                <p className="font-mono text-[0.68rem] font-bold uppercase tracking-[0.1em] text-gray-mid mb-2">About</p>
                <p className="text-[0.85rem] text-gray-mid leading-relaxed">{pub.description}</p>
              </div>
            )}

            {/* Price History */}
            <PriceHistory pubId={pub.id} currentPrice={pub.price} />

            {/* Report a Price */}
            <div id="report-price">
              <PriceReporter pubSlug={pub.slug} pubName={pub.name} currentPrice={pub.price} />
            </div>

            {/* Action buttons */}
            <div className="flex gap-3">
              {pub.website && (
                <a
                  href={pub.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 font-mono text-[0.75rem] font-bold uppercase tracking-[0.05em] text-white bg-amber border-3 border-ink rounded-pill py-3.5 shadow-hard-sm hover:translate-x-[1.5px] hover:translate-y-[1.5px] hover:shadow-hard-hover transition-all text-center no-underline"
                >
                  Visit Website
                </a>
              )}
              <a
                href={directionsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 font-mono text-[0.75rem] font-bold uppercase tracking-[0.05em] text-white bg-ink border-3 border-ink rounded-pill py-3.5 shadow-hard-sm hover:translate-x-[1.5px] hover:translate-y-[1.5px] hover:shadow-hard-hover transition-all text-center no-underline"
              >
                Get Directions
              </a>
            </div>
          </div>

          {/* Right column - map */}
          <div className="md:sticky md:top-20 rounded-card overflow-hidden h-[350px] border-3 border-ink shadow-hard">
            <PubDetailMap lat={pub.lat} lng={pub.lng} name={pub.name} price={pub.price} />
          </div>
        </div>

        {/* Nearby Pubs */}
        {nearbyPubs.length > 0 && (
          <div className="mt-8">
            <div className="flex items-center gap-2 mb-4">
              <span className="w-3.5 h-3.5 rounded-[4px] bg-amber" />
              <span className="font-mono text-[0.68rem] font-bold uppercase tracking-[0.1em] text-gray-mid">Nearby</span>
            </div>
            <h2 className="font-mono font-extrabold text-xl tracking-[-0.02em] text-ink mb-4">
              More in {pub.suburb}
            </h2>
            <div className="space-y-0">
              {nearbyPubs.map((nearby, i) => (
                <Link
                  key={nearby.id}
                  href={`/pub/${nearby.slug}`}
                  className={`flex items-center justify-between py-3.5 no-underline group ${
                    i < nearbyPubs.length - 1 ? 'border-b border-gray-light' : ''
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-mono text-[0.85rem] font-extrabold text-ink group-hover:text-amber transition-colors truncate">{nearby.name}</p>
                    <p className="text-[0.7rem] text-gray-mid truncate">{nearby.beerType || 'House Pint'}</p>
                    {nearby.isHappyHourNow && (
                      <span className="inline-flex items-center gap-1 mt-0.5 text-[0.6rem] font-bold text-red">
                        <span className="w-1.5 h-1.5 rounded-full bg-red animate-pulse" />
                        Happy Hour Live
                      </span>
                    )}
                  </div>
                  <span className="font-mono text-[1.1rem] font-extrabold text-ink ml-3">
                    {nearby.price !== null ? `$${nearby.price.toFixed(2)}` : 'TBC'}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  )
}
