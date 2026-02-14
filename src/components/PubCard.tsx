'use client'

import { Pub } from '@/types/pub'

interface PubCardProps {
  pub: Pub
  rank?: number
}

export default function PubCard({ pub, rank }: PubCardProps) {
  // Static map image from OpenStreetMap
  const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${pub.coordinates.lng - 0.002},${pub.coordinates.lat - 0.002},${pub.coordinates.lng + 0.002},${pub.coordinates.lat + 0.002}&layer=mapnik&marker=${pub.coordinates.lat},${pub.coordinates.lng}`
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${pub.coordinates.lat},${pub.coordinates.lng}`

  return (
    <div className="group relative bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl overflow-hidden shadow-xl border border-gray-700/50 hover:border-amber-500/50 transition-all duration-300 hover:shadow-amber-500/10 hover:shadow-2xl hover:-translate-y-1">
      {/* Rank Badge */}
      {rank && rank <= 3 && (
        <div className={`absolute top-3 left-3 z-10 w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg shadow-lg ${
          rank === 1 ? 'bg-gradient-to-br from-yellow-400 to-amber-500 text-gray-900' :
          rank === 2 ? 'bg-gradient-to-br from-gray-300 to-gray-400 text-gray-900' :
          'bg-gradient-to-br from-amber-600 to-amber-700 text-white'
        }`}>
          #{rank}
        </div>
      )}

      {/* Mini Map */}
      <div className="relative h-32 overflow-hidden">
        <iframe
          src={mapUrl}
          className="w-full h-full border-0 pointer-events-none"
          title={`Map of ${pub.name}`}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent" />
        <a
          href={directionsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute bottom-2 right-2 bg-amber-500 hover:bg-amber-400 text-gray-900 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 transition-colors shadow-lg"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Directions
        </a>
      </div>

      {/* Content */}
      <div className="p-5">
        <div className="flex justify-between items-start mb-3">
          <h3 className="text-xl font-bold text-white group-hover:text-amber-400 transition-colors pr-2">
            {pub.name}
          </h3>
          <div className="flex flex-col items-end">
            <span className="text-3xl font-black text-amber-400">
              ${pub.price}
            </span>
            <span className="text-xs text-gray-400">pint</span>
          </div>
        </div>

        {/* Beer Type - THE STAR */}
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg px-3 py-2 mb-3">
          <span className="text-amber-400 font-semibold text-sm">🍺 {pub.beerType}</span>
        </div>

        <p className="text-gray-400 text-sm mb-3 flex items-start gap-2">
          <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          </svg>
          {pub.address}
        </p>

        {/* Suburb Tag */}
        <span className="inline-block bg-gray-700/50 text-gray-300 px-3 py-1 rounded-full text-xs font-medium mb-3">
          {pub.suburb}
        </span>

        {/* Happy Hour */}
        {pub.happyHour && (
          <div className="flex items-center gap-2 text-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            <span className="text-green-400 font-medium">
              {pub.happyHour.days.join(', ')} {pub.happyHour.start}-{pub.happyHour.end}
            </span>
          </div>
        )}

        <p className="text-xs text-gray-500 mt-3">
          Updated: {pub.lastUpdated}
        </p>
      </div>
    </div>
  )
}
