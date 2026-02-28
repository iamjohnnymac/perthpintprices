'use client'
import Link from 'next/link'
import { Pub } from '@/types/pub'
import { getPriceLabel, getPriceLabelColors } from '@/lib/priceLabel'
import WatchlistButton from '@/components/WatchlistButton'
import { formatHappyHourDays } from '@/lib/happyHourLive'
import { getFreshness } from '@/lib/freshness'

interface PubCardProps {
  pub: Pub
  avgPrice?: number
  distance?: string
}

// Generate a gradient placeholder based on pub name (consistent per pub)
function getPlaceholderGradient(name: string) {
  const gradients = [
    'from-amber/20 to-amber-light/10',
    'from-orange-100 to-amber-50',
    'from-stone-200 to-cream-dark',
    'from-amber-50 to-orange-50',
    'from-stone-100 to-stone-50',
    'from-amber/10 to-cream',
  ]
  const idx = name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % gradients.length
  return gradients[idx]
}

export default function PubCard({ pub, avgPrice = 9.20, distance }: PubCardProps) {
  const effectivePrice = pub.effectivePrice ?? pub.price
  const { label, type } = getPriceLabel(effectivePrice, avgPrice)
  const colors = getPriceLabelColors(type)

  const hhTiming = pub.happyHourStart && pub.happyHourEnd
    ? `${formatHappyHourDays(pub.happyHourDays || '')} ${pub.happyHourStart.slice(0,5)}–${pub.happyHourEnd.slice(0,5)}`
    : null

  const gradient = getPlaceholderGradient(pub.name)

  return (
    <Link href={`/pub/${pub.slug}`} className="block group">
      <div className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all h-full flex flex-col">
        {/* Image placeholder with gradient + initial */}
        <div className={`relative h-[140px] sm:h-[180px] bg-gradient-to-br ${gradient} flex items-center justify-center`}>
          <span className="font-serif text-4xl sm:text-5xl text-charcoal/15 select-none">{pub.name.charAt(0)}</span>
          {/* Price badge */}
          {effectivePrice ? (
            <div className="absolute top-3 right-3 bg-white rounded-full px-4 py-1.5 shadow-sm flex items-center gap-1.5">
              <span className="font-mono font-bold text-charcoal text-base">${effectivePrice.toFixed(2)}</span>
              {label && (
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${colors.bg} ${colors.text}`}>
                  {label}
                </span>
              )}
            </div>
          ) : (
            <div className="absolute top-3 right-3 bg-white/90 rounded-full px-3 py-1 shadow-sm">
              <span className="text-stone-warm text-xs font-medium">Price TBC</span>
            </div>
          )}
          {/* HH NOW badge */}
          {pub.isHappyHourNow && (
            <div className="absolute top-3 left-3 bg-amber text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-sm">
              ⚡ HAPPY HOUR
            </div>
          )}
        </div>

        {/* Card body */}
        <div className="p-5 flex-1 flex flex-col">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <h3 className="font-serif text-lg text-charcoal leading-snug truncate">{pub.name}</h3>
              <p className="text-stone-warm text-sm mt-0.5">
                {pub.suburb}{distance ? ` · ${distance}` : ''}
              </p>
            </div>
            <WatchlistButton slug={pub.slug} name={pub.name} suburb={pub.suburb} size="sm" />
          </div>

          {/* Details row */}
          <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
            {pub.beerType && (
              <span className="text-stone-warm text-xs">{pub.beerType}</span>
            )}
            {!pub.isHappyHourNow && hhTiming && (
              <span className="text-stone-400 text-xs">⏰ {hhTiming}</span>
            )}
          </div>

          {/* Freshness indicator */}
          {pub.priceVerified && (
            <div className="mt-auto pt-3">
              {(() => {
                const freshness = getFreshness(pub.lastVerified)
                return (
                  <span className={`inline-flex items-center gap-1 text-[11px] font-medium ${freshness.color}`}>
                    <span className="text-[9px]">{freshness.icon}</span>
                    {freshness.label}
                    {freshness.daysAgo !== null && freshness.daysAgo > 0 && (
                      <span className="text-stone-400 font-normal">· {freshness.daysAgo}d ago</span>
                    )}
                  </span>
                )
              })()}
            </div>
          )}

          {/* Bottom: Vibe tag + arrow */}
          <div className="mt-auto pt-3 flex items-center justify-between">
            {pub.vibeTag ? (
              <span className="text-xs text-stone-warm italic">{pub.vibeTag}</span>
            ) : <span />}
            <div className="w-8 h-8 rounded-full border border-stone-200 flex items-center justify-center group-hover:border-amber group-hover:bg-amber/5 transition-all">
              <svg className="w-4 h-4 text-stone-400 group-hover:text-amber transition-colors" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}
