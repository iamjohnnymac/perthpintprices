'use client'
import Link from 'next/link'
import { Pub } from '@/types/pub'
import { getPriceLabel, getPriceLabelColors } from '@/lib/priceLabel'
import WatchlistButton from '@/components/WatchlistButton'
import { formatHappyHourDays } from '@/lib/happyHourLive'

interface PubCardProps {
  pub: Pub
  avgPrice?: number
  distance?: string
}

export default function PubCard({ pub, avgPrice = 9.20, distance }: PubCardProps) {
  const effectivePrice = pub.effectivePrice ?? pub.price
  const { label, type } = getPriceLabel(effectivePrice, avgPrice)
  const colors = getPriceLabelColors(type)

  // Format HH timing
  const hhTiming = pub.happyHourStart && pub.happyHourEnd
    ? `${formatHappyHourDays(pub.happyHourDays || '')} ${pub.happyHourStart.slice(0,5)}–${pub.happyHourEnd.slice(0,5)}`
    : null

  return (
    <Link href={`/pub/${pub.slug}`} className="block group">
      <div className="bg-white rounded-2xl border border-stone-200/60 p-4 sm:p-5 hover:border-amber/40 hover:shadow-md transition-all cursor-pointer h-full flex flex-col">
        {/* Top row: Name + Price */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-heading font-bold text-charcoal text-base truncate">{pub.name}</h3>
              <WatchlistButton slug={pub.slug} name={pub.name} suburb={pub.suburb} size="sm" />
            </div>
            <p className="text-stone-400 text-sm mt-0.5">
              {pub.suburb}{distance ? ` · ${distance}` : ''}
            </p>
          </div>
          <div className="flex flex-col items-end flex-shrink-0">
            <span className="font-mono font-bold text-lg text-charcoal">
              {effectivePrice ? `$${effectivePrice.toFixed(2)}` : 'TBC'}
            </span>
            {label && (
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border mt-1 ${colors.bg} ${colors.text} ${colors.border}`}>
                {label}
              </span>
            )}
          </div>
        </div>

        {/* Middle: Beer type + Happy Hour */}
        <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
          {pub.beerType && (
            <span className="text-stone-500">{pub.beerType}</span>
          )}
          {pub.isHappyHourNow && (
            <span className="text-xs font-bold text-amber bg-amber/10 px-2 py-0.5 rounded-full">🍻 HH NOW</span>
          )}
          {!pub.isHappyHourNow && hhTiming && (
            <span className="text-stone-400 text-xs">⏰ {hhTiming}</span>
          )}
        </div>

        {/* Bottom: Vibe tag + chevron */}
        {pub.vibeTag && (
          <div className="mt-auto pt-3 flex items-center justify-between">
            <span className="text-xs text-stone-400 italic">{pub.vibeTag}</span>
            <svg className="w-4 h-4 text-stone-300 group-hover:text-amber transition-colors" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </div>
        )}
      </div>
    </Link>
  )
}
