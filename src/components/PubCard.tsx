'use client'

import { Pub } from '@/types/pub'
import dynamic from 'next/dynamic'

// Dynamically import MiniMap to avoid SSR issues
const MiniMap = dynamic(() => import('./MiniMap'), { 
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-slate-700 animate-pulse flex items-center justify-center">
      <span className="text-slate-500">🗺️</span>
    </div>
  )
})

interface PubCardProps {
  pub: Pub
  isHappyHour: boolean
  rank?: number
}

export default function PubCard({ pub, isHappyHour, rank }: PubCardProps) {
  // Extract suburb from address (usually after the street)
  const addressParts = pub.address.split(',')
  const suburb = addressParts.length > 1 ? addressParts[1]?.trim() : addressParts[0]

  // Format beer description nicely - remove "Pints of" prefix if present
  const beerInfo = pub.description
    .replace(/^pints?\s+of\s+/i, '')
    .replace(/^house\s+/i, 'House ')

  return (
    <div className={`group relative bg-gradient-to-br from-slate-800/90 to-slate-900/90 rounded-2xl overflow-hidden border-2 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 ${
      isHappyHour 
        ? 'border-green-500 shadow-lg shadow-green-500/20 ring-2 ring-green-500/20' 
        : 'border-slate-700/50 hover:border-beer-gold/50'
    }`}>
      
      {/* Rank badge for top 3 */}
      {rank && rank <= 3 && (
        <div className={`absolute top-3 left-3 z-20 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shadow-lg ${
          rank === 1 ? 'bg-gradient-to-br from-yellow-400 to-amber-500 text-black' :
          rank === 2 ? 'bg-gradient-to-br from-slate-300 to-slate-400 text-black' :
          'bg-gradient-to-br from-amber-600 to-amber-700 text-white'
        }`}>
          #{rank}
        </div>
      )}
      
      {/* Happy Hour badge */}
      {isHappyHour && (
        <div className="absolute top-3 right-3 z-20">
          <span className="inline-flex items-center gap-1 text-xs font-bold bg-gradient-to-r from-green-500 to-emerald-600 text-white px-3 py-1.5 rounded-full shadow-lg">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
            </span>
            HAPPY HOUR
          </span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row">
        {/* Mini Map - Interactive Leaflet */}
        <div className="w-full sm:w-32 md:w-40 h-32 sm:h-auto flex-shrink-0 relative overflow-hidden">
          <MiniMap lat={pub.lat} lng={pub.lng} name={pub.name} />
          
          {/* Directions overlay on hover */}
          <a 
            href={`https://www.google.com/maps/dir/?api=1&destination=${pub.lat},${pub.lng}`}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute inset-0 bg-black/0 hover:bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-all duration-200 z-10"
          >
            <span className="bg-white text-slate-800 text-xs font-semibold px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Directions
            </span>
          </a>
        </div>

        {/* Content */}
        <div className="flex-1 p-4 relative">
          {/* Header row */}
          <div className="flex justify-between items-start gap-3 mb-3">
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-lg text-white leading-tight group-hover:text-beer-gold transition-colors">
                {pub.name}
              </h3>
              <p className="text-slate-400 text-sm">{suburb}</p>
            </div>
            
            {/* Price */}
            <div className="flex flex-col items-end flex-shrink-0">
              <span className="text-3xl font-black bg-gradient-to-br from-beer-gold to-amber-500 bg-clip-text text-transparent">
                ${pub.price % 1 === 0 ? pub.price : pub.price.toFixed(2)}
              </span>
              <span className="text-xs text-slate-500">per pint</span>
            </div>
          </div>

          {/* Beer info - prominent with icon */}
          <div className="mb-3">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500/20 to-beer-gold/10 border border-beer-gold/30 px-3 py-2 rounded-lg">
              <span className="text-xl">🍺</span>
              <span className="text-sm font-semibold text-beer-gold">{beerInfo}</span>
            </div>
          </div>

          {/* Details row */}
          <div className="flex flex-wrap gap-2 text-xs">
            {/* Happy Hour times */}
            <div className="inline-flex items-center gap-1.5 bg-slate-700/60 px-2.5 py-1.5 rounded-md text-slate-300">
              <span>🕐</span>
              <span>{pub.happyHour}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom accent line */}
      <div className={`h-1 w-full bg-gradient-to-r ${
        isHappyHour 
          ? 'from-green-500 via-emerald-400 to-green-500' 
          : 'from-transparent via-beer-gold/40 to-transparent'
      }`} />
    </div>
  )
}
