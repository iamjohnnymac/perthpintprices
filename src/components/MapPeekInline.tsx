'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { Pub } from '@/types/pub'

const Map = dynamic(() => import('@/components/Map'), {
  ssr: false,
  loading: () => (
    <div className="h-full bg-gray-light flex items-center justify-center">
      <div className="flex flex-col items-center gap-2">
        <div className="w-8 h-8 border-3 border-gray border-t-gray-mid rounded-full animate-spin" />
        <span className="text-gray-mid text-xs font-medium">Loading map...</span>
      </div>
    </div>
  )
})

interface MapPeekInlineProps {
  pubs: Pub[]
  userLocation: { lat: number; lng: number } | null
  totalPubCount: number
  happyHourCount: number
}

export default function MapPeekInline({ pubs, userLocation, totalPubCount, happyHourCount }: MapPeekInlineProps) {
  const [visible, setVisible] = useState(false)
  const [expanded, setExpanded] = useState(false)

  return (
    <>
      {/* Inline toggle button */}
      <button
        onClick={() => setVisible(!visible)}
        className="flex items-center gap-1.5 text-xs font-semibold text-ink bg-white border border-gray-light hover:border-amber/40 hover:bg-amber/5 rounded-full px-3 py-1.5 transition-all shadow-sm focus-visible:ring-2 focus-visible:ring-amber/50 focus-visible:ring-offset-1 flex-shrink-0"
      >
        <svg className="w-3.5 h-3.5 text-amber" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
        </svg>
        {visible ? 'Hide' : 'Map'}
        {!visible && happyHourCount > 0 && (
          <span className="w-1.5 h-1.5 rounded-full bg-orange animate-pulse" />
        )}
      </button>

      {/* Map panel - flows naturally below the toolbar row */}
      {visible && (
        <div className="!col-span-full basis-full w-full mt-2" style={{ order: 99 }}>
          <div
            className={`rounded-xl overflow-hidden shadow-sm border border-gray-light/60 relative transition-all duration-400 ease-[cubic-bezier(0.4,0,0.2,1)] ${
              expanded ? 'h-[280px] sm:h-[360px]' : 'h-[120px] sm:h-[160px]'
            }`}
            style={{ isolation: 'isolate' }}
          >
            <Map pubs={pubs} userLocation={userLocation} totalPubCount={totalPubCount} />
            <button
              onClick={() => setExpanded(!expanded)}
              className="absolute bottom-2 left-1/2 -translate-x-1/2 z-[1000] bg-white border border-gray-light rounded-full px-3.5 py-1 text-[11px] font-semibold text-gray-mid hover:bg-off-white transition-all shadow-md flex items-center gap-1.5"
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
              {expanded ? 'Collapse' : 'Expand'}
            </button>
          </div>
        </div>
      )}
    </>
  )
}
