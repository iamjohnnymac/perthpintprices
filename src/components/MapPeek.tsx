'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { Pub } from '@/types/pub'

const Map = dynamic(() => import('@/components/Map'), {
  ssr: false,
  loading: () => (
    <div className="h-full bg-stone-100 flex items-center justify-center">
      <div className="flex flex-col items-center gap-2">
        <div className="w-8 h-8 border-3 border-stone-300 border-t-stone-500 rounded-full animate-spin" />
        <span className="text-stone-500 text-xs font-medium">Loading map...</span>
      </div>
    </div>
  )
})

interface MapPeekProps {
  pubs: Pub[]
  userLocation: { lat: number; lng: number } | null
  totalPubCount: number
  happyHourCount: number
}

export default function MapPeek({ pubs, userLocation, totalPubCount, happyHourCount }: MapPeekProps) {
  const [expanded, setExpanded] = useState(false)
  const [visible, setVisible] = useState(false)

  if (!visible) {
    return (
      <button
        onClick={() => setVisible(true)}
        className="flex items-center gap-2.5 text-sm font-semibold text-ink bg-white border border-stone-200 hover:border-amber/40 hover:bg-amber/5 rounded-full px-4 py-2 mb-4 transition-all shadow-sm focus-visible:ring-2 focus-visible:ring-amber/50 focus-visible:ring-offset-1"
      >
        <svg className="w-4 h-4 text-amber" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
        </svg>
        Show map
        {happyHourCount > 0 && (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink bg-orange-50 rounded-full px-2 py-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
            {happyHourCount} live
          </span>
        )}
      </button>
    )
  }

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-2">
        <button
          onClick={() => setVisible(false)}
          className="flex items-center gap-1.5 text-xs font-medium text-stone-400 hover:text-ink transition-colors"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
          </svg>
          Hide map
        </button>
        {happyHourCount > 0 && (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-ink">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
            {happyHourCount} happy hour{happyHourCount !== 1 ? 's' : ''} live
          </span>
        )}
      </div>
      <div
        className={`rounded-xl overflow-hidden shadow-sm border border-stone-200/60 relative transition-all duration-400 ease-[cubic-bezier(0.4,0,0.2,1)] ${
          expanded ? 'h-[320px] sm:h-[360px]' : 'h-[130px] sm:h-[160px]'
        }`}
        style={{ isolation: 'isolate' }}
      >
        <Map pubs={pubs} userLocation={userLocation} totalPubCount={totalPubCount} />
        <button
          onClick={() => setExpanded(!expanded)}
          className="absolute bottom-2 left-1/2 -translate-x-1/2 z-[1000] bg-white border border-stone-200 rounded-full px-3.5 py-1 text-[11px] font-semibold text-stone-500 hover:bg-stone-50 transition-all shadow-md flex items-center gap-1.5"
        >
          <svg
            className={`w-3 h-3 transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
          {expanded ? 'Collapse map' : 'Expand map'}
        </button>
      </div>
    </div>
  )
}
