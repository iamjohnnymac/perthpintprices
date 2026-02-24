import Link from 'next/link'

interface StatsBarProps {
  avgPrice: string
  cheapestPrice: number
  cheapestSuburb: string
  cheapestSlug: string
  priciestPrice: number
  priciestSuburb: string
  priciestSlug: string
  happyHourCount: number
  suburbCount: number
  venueCount: number
}

export default function StatsBar({
  avgPrice,
  cheapestPrice,
  cheapestSuburb,
  cheapestSlug,
  priciestPrice,
  priciestSuburb,
  priciestSlug,
  happyHourCount,
  venueCount,
}: StatsBarProps) {
  const cell = 'p-3 sm:p-4 bg-white transition-colors'

  return (
    <div className="rounded-xl border border-stone-200/50 overflow-hidden mt-3">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-stone-200/50">
        {/* Perth Average */}
        <div className={cell}>
          <span className="text-[10px] sm:text-xs text-stone-400 uppercase tracking-wider leading-none block">Perth Avg</span>
          <span className="text-charcoal font-mono font-bold text-lg sm:text-xl leading-tight block mt-0.5">${avgPrice}</span>
          <span className="text-[10px] sm:text-xs text-stone-400 leading-none block mt-0.5">{venueCount} venues</span>
        </div>

        {/* Cheapest */}
        {cheapestSlug ? (
          <Link href={`/pub/${cheapestSlug}`} className={`${cell} hover:bg-stone-50`}>
            <span className="text-[10px] sm:text-xs text-stone-400 uppercase tracking-wider leading-none block">Cheapest</span>
            <span className="text-green-700 font-mono font-bold text-lg sm:text-xl leading-tight block mt-0.5">${cheapestPrice}</span>
            <span className="text-[10px] sm:text-xs text-stone-400 leading-none block mt-0.5 truncate">{cheapestSuburb}</span>
          </Link>
        ) : (
          <div className={cell}>
            <span className="text-[10px] sm:text-xs text-stone-400 uppercase tracking-wider leading-none block">Cheapest</span>
            <span className="text-green-700 font-mono font-bold text-lg sm:text-xl leading-tight block mt-0.5">${cheapestPrice}</span>
            <span className="text-[10px] sm:text-xs text-stone-400 leading-none block mt-0.5 truncate">{cheapestSuburb}</span>
          </div>
        )}

        {/* Priciest */}
        {priciestSlug ? (
          <Link href={`/pub/${priciestSlug}`} className={`${cell} hover:bg-stone-50`}>
            <span className="text-[10px] sm:text-xs text-stone-400 uppercase tracking-wider leading-none block">Priciest</span>
            <span className="text-red-700 font-mono font-bold text-lg sm:text-xl leading-tight block mt-0.5">${priciestPrice}</span>
            <span className="text-[10px] sm:text-xs text-stone-400 leading-none block mt-0.5 truncate">{priciestSuburb}</span>
          </Link>
        ) : (
          <div className={cell}>
            <span className="text-[10px] sm:text-xs text-stone-400 uppercase tracking-wider leading-none block">Priciest</span>
            <span className="text-red-700 font-mono font-bold text-lg sm:text-xl leading-tight block mt-0.5">${priciestPrice}</span>
            <span className="text-[10px] sm:text-xs text-stone-400 leading-none block mt-0.5 truncate">{priciestSuburb}</span>
          </div>
        )}

        {/* Happy Hour */}
        <Link href="/happy-hour" className={`${cell} hover:bg-stone-50`}>
          <span className="text-[10px] sm:text-xs text-stone-400 uppercase tracking-wider leading-none block">Happy Hour</span>
          <span className="text-amber font-mono font-bold text-lg sm:text-xl leading-tight block mt-0.5">{happyHourCount}</span>
          <span className="text-[10px] sm:text-xs text-stone-400 leading-none block mt-0.5">active now</span>
        </Link>
      </div>
    </div>
  )
}
