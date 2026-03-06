import Link from 'next/link'
import { Beer } from 'lucide-react'

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
    <div className="flex items-center justify-center gap-3 mt-2 overflow-x-auto scrollbar-hide py-1">
      <div className="hidden sm:flex items-center gap-1.5 px-4 py-2 bg-white rounded-full border border-stone-200/60 text-sm whitespace-nowrap shadow-sm">
        <span className="text-gray-mid">Avg</span>
        <span className="font-bold text-ink font-mono">${avgPrice}</span>
      </div>
      <Link href={`/pub/${cheapestSlug}`} className="flex items-center gap-1.5 px-4 py-2 bg-white rounded-full border border-stone-200/60 text-sm whitespace-nowrap shadow-sm hover:border-amber/40 transition-colors">
        <span className="text-gray-mid">Low</span>
        <span className="font-bold text-bargain font-mono">${cheapestPrice}</span>
      </Link>
      <div className="hidden sm:flex items-center gap-1.5 px-4 py-2 bg-white rounded-full border border-stone-200/60 text-sm whitespace-nowrap shadow-sm">
        <span className="text-gray-mid">Venues</span>
        <span className="font-bold text-ink">{venueCount}</span>
      </div>
      {happyHourCount > 0 && (
        <Link href="/happy-hour" className="flex items-center gap-1.5 px-4 py-2 bg-amber/10 rounded-full border border-amber/20 text-sm whitespace-nowrap hover:bg-amber/20 transition-colors">
          <span className="text-amber font-semibold"><Beer className="w-4 h-4 inline" /> {happyHourCount} live</span>
        </Link>
      )}
    </div>
  )
}
