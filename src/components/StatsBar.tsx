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
  cheapestSlug,
  happyHourCount,
  venueCount,
}: StatsBarProps) {
  return (
    <div className="flex items-center gap-3 mt-3 overflow-x-auto scrollbar-hide py-1">
      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-full border border-stone-200/60 text-sm whitespace-nowrap shadow-sm">
        <span className="text-stone-warm">Avg</span>
        <span className="font-bold text-charcoal font-mono">${avgPrice}</span>
      </div>
      <Link href={`/pub/${cheapestSlug}`} className="flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-full border border-stone-200/60 text-sm whitespace-nowrap shadow-sm hover:border-amber/40 transition-colors">
        <span className="text-stone-warm">Low</span>
        <span className="font-bold text-bargain font-mono">${cheapestPrice}</span>
      </Link>
      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-full border border-stone-200/60 text-sm whitespace-nowrap shadow-sm">
        <span className="text-stone-warm">Venues</span>
        <span className="font-bold text-charcoal">{venueCount}</span>
      </div>
      {happyHourCount > 0 && (
        <Link href="/happy-hour" className="flex items-center gap-1.5 px-3 py-1.5 bg-amber/10 rounded-full border border-amber/20 text-sm whitespace-nowrap hover:bg-amber/20 transition-colors">
          <span className="text-amber font-semibold">🍻 {happyHourCount} live</span>
        </Link>
      )}
    </div>
  )
}
