'use client'

import { Pub } from '@/types/pub'

interface PintIndexCompactProps {
  pubs: Pub[]
  filteredPubs?: Pub[]
  onViewMore: () => void
}

export default function PintIndexCompact({ pubs, filteredPubs, onViewMore }: PintIndexCompactProps) {
  const displayPubs = filteredPubs && filteredPubs.length < pubs.length ? filteredPubs : pubs
  const pricedPubs = displayPubs.filter(p => p.price !== null)
  const isFiltered = filteredPubs && filteredPubs.length < pubs.length
  
  if (pricedPubs.length === 0) return null

  const avg = pricedPubs.reduce((sum, p) => sum + p.price!, 0) / pricedPubs.length
  const min = Math.min(...pricedPubs.map(p => p.price!))
  const max = Math.max(...pricedPubs.map(p => p.price!))
  const cheapest = pricedPubs.find(p => p.price === min)

  return (
    <div className="bg-white rounded-2xl border border-stone-200/40 px-4 py-3 shadow-[0_2px_12px_rgba(0,0,0,0.06)] mb-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 flex-wrap">
          {isFiltered && (
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] bg-amber/15 text-amber px-2 py-0.5 rounded-full font-medium uppercase tracking-wide">Filtered</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <span className="text-xs text-stone-400 uppercase tracking-wide font-medium">Avg</span>
            <span className="text-lg font-bold font-mono text-stone-900">${avg.toFixed(2)}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-stone-400 uppercase tracking-wide font-medium">Range</span>
            <span className="text-sm font-semibold font-mono text-amber">${min.toFixed(0)}</span>
            <span className="text-stone-300">{'\u2013'}</span>
            <span className="text-sm font-semibold font-mono text-coral">${max.toFixed(0)}</span>
          </div>
          {cheapest && (
            <div className="hidden sm:flex items-center gap-1.5">
              <span className="text-xs text-stone-400 uppercase tracking-wide font-medium">Cheapest</span>
              <span className="text-xs font-semibold text-amber">{cheapest.suburb} ${min.toFixed(2)}</span>
            </div>
          )}
        </div>
        <button
          onClick={onViewMore}
          className="text-xs text-amber hover:text-amber font-medium flex items-center gap-1 flex-shrink-0"
        >
          <span className="hidden sm:inline">Full Market</span>
          <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="22,7 13.5,15.5 8.5,10.5 2,17" />
            <polyline points="16,7 22,7 22,13" />
          </svg>
        </button>
      </div>
    </div>
  )
}
