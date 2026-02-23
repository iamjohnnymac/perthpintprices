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
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2.5 pb-2.5">
      <div className="bg-stone-50 rounded-xl p-3 sm:p-4 border border-stone-200/60">
        <span className="text-stone-500 text-[10px] uppercase tracking-wider block leading-none">Perth Avg</span>
        <span className="text-charcoal font-mono font-bold text-base sm:text-lg leading-tight">${avgPrice}</span>
        <span className="text-stone-400 text-[10px] block leading-none mt-0.5">{venueCount} venues</span>
      </div>
      {cheapestSlug ? (
        <Link href={`/pub/${cheapestSlug}`} className="bg-stone-50 rounded-xl p-3 sm:p-4 border border-stone-200/60 hover:border-amber/50 hover:shadow-sm transition-all group">
          <span className="text-stone-500 text-[10px] uppercase tracking-wider block leading-none">Cheapest</span>
          <span className="text-green-700 font-mono font-bold text-base sm:text-lg leading-tight group-hover:text-amber transition-colors">${cheapestPrice}</span>
          <span className="text-stone-400 text-[10px] block leading-none mt-0.5 truncate group-hover:text-amber transition-colors">{cheapestSuburb} →</span>
        </Link>
      ) : (
        <div className="bg-stone-50 rounded-xl p-3 sm:p-4 border border-stone-200/60">
          <span className="text-stone-500 text-[10px] uppercase tracking-wider block leading-none">Cheapest</span>
          <span className="text-green-700 font-mono font-bold text-base sm:text-lg leading-tight">${cheapestPrice}</span>
          <span className="text-stone-400 text-[10px] block leading-none mt-0.5 truncate">{cheapestSuburb}</span>
        </div>
      )}
      {priciestSlug ? (
        <Link href={`/pub/${priciestSlug}`} className="bg-stone-50 rounded-xl p-3 sm:p-4 border border-stone-200/60 hover:border-amber/50 hover:shadow-sm transition-all group">
          <span className="text-stone-500 text-[10px] uppercase tracking-wider block leading-none">Priciest</span>
          <span className="text-red-700 font-mono font-bold text-base sm:text-lg leading-tight group-hover:text-amber transition-colors">${priciestPrice}</span>
          <span className="text-stone-400 text-[10px] block leading-none mt-0.5 truncate group-hover:text-amber transition-colors">{priciestSuburb} →</span>
        </Link>
      ) : (
        <div className="bg-stone-50 rounded-xl p-3 sm:p-4 border border-stone-200/60">
          <span className="text-stone-500 text-[10px] uppercase tracking-wider block leading-none">Priciest</span>
          <span className="text-red-700 font-mono font-bold text-base sm:text-lg leading-tight">${priciestPrice}</span>
          <span className="text-stone-400 text-[10px] block leading-none mt-0.5 truncate">{priciestSuburb}</span>
        </div>
      )}
      <div className="bg-stone-50 rounded-xl p-3 sm:p-4 border border-stone-200/60">
        <span className="text-stone-500 text-[10px] uppercase tracking-wider block leading-none">Happy Hour</span>
        <span className="text-amber font-mono font-bold text-base sm:text-lg leading-tight">{happyHourCount}</span>
        <span className="text-stone-400 text-[10px] block leading-none mt-0.5">active now</span>
      </div>
    </div>
  )
}
