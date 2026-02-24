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
  return (
    <div className="grid grid-cols-3 gap-3 mt-3">
      {/* Cheapest */}
      <Link href={`/pub/${cheapestSlug}`} className="bg-white rounded-2xl p-4 border border-stone-200/60 hover:border-amber/40 hover:shadow-sm transition-all text-center">
        <span className="text-[10px] sm:text-xs text-stone-400 uppercase tracking-wider block">Cheapest right now</span>
        <span className="text-green-700 font-mono font-bold text-2xl sm:text-3xl block mt-1">${cheapestPrice}</span>
        <span className="text-[11px] text-stone-400 block mt-1">A bloody good deal</span>
      </Link>

      {/* Perth Average */}
      <div className="bg-white rounded-2xl p-4 border border-stone-200/60 text-center">
        <span className="text-[10px] sm:text-xs text-stone-400 uppercase tracking-wider block">Perth average</span>
        <span className="text-charcoal font-mono font-bold text-2xl sm:text-3xl block mt-1">${avgPrice}</span>
        <span className="text-[11px] text-stone-400 block mt-1">Based on {venueCount} venues</span>
      </div>

      {/* Priciest */}
      <Link href={`/pub/${priciestSlug}`} className="bg-white rounded-2xl p-4 border border-stone-200/60 hover:border-amber/40 hover:shadow-sm transition-all text-center">
        <span className="text-[10px] sm:text-xs text-stone-400 uppercase tracking-wider block">Most expensive</span>
        <span className="text-red-600 font-mono font-bold text-2xl sm:text-3xl block mt-1">${priciestPrice}</span>
        <span className="text-[11px] text-stone-400 block mt-1">Some craft places, yeah</span>
      </Link>
    </div>
  )
}
