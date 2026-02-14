'use client'

import { Pub } from '@/types/pub'
import { useState } from 'react'

interface PubCardProps {
  pub: Pub
  isHappyHour: boolean
  rank?: number
}

export default function PubCard({ pub, isHappyHour, rank }: PubCardProps) {
  const [imageError, setImageError] = useState(false)
  
  // Generate static map URL using OpenStreetMap
  const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${pub.lng - 0.003}%2C${pub.lat - 0.002}%2C${pub.lng + 0.003}%2C${pub.lat + 0.002}&layer=mapnik&marker=${pub.lat}%2C${pub.lng}`
  
  // Static tile image as fallback
  const staticMapUrl = `https://staticmap.openstreetmap.de/staticmap.php?center=${pub.lat},${pub.lng}&zoom=16&size=200x120&maptype=mapnik&markers=${pub.lat},${pub.lng},ol-marker`

  // Extract suburb from address
  const addressParts = pub.address.split(',')
  const suburb = addressParts[addressParts.length - 1]?.trim() || ''

  // Format beer description nicely
  const beerInfo = pub.description.replace('Pints of ', '').replace('pints of ', '')

  return (
    <div className={`group relative bg-gradient-to-br from-slate-800/90 to-slate-900/90 rounded-2xl overflow-hidden border-2 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 ${
      isHappyHour 
        ? 'border-beer-gold shadow-lg shadow-beer-gold/30 ring-2 ring-beer-gold/20' 
        : 'border-slate-700/50 hover:border-beer-gold/50'
    }`}>
      {/* Animated gradient overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-r from-beer-gold/0 via-beer-gold/5 to-beer-gold/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      {/* Rank badge */}
      {rank && rank <= 3 && (
        <div className={`absolute top-3 left-3 z-10 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shadow-lg ${
          rank === 1 ? 'bg-gradient-to-br from-yellow-400 to-amber-500 text-black' :
          rank === 2 ? 'bg-gradient-to-br from-slate-300 to-slate-400 text-black' :
          'bg-gradient-to-br from-amber-600 to-amber-700 text-white'
        }`}>
          #{rank}
        </div>
      )}
      
      {/* Happy Hour badge */}
      {isHappyHour && (
        <div className="absolute top-3 right-3 z-10">
          <span className="inline-flex items-center gap-1 text-xs font-bold bg-gradient-to-r from-green-500 to-emerald-600 text-white px-3 py-1.5 rounded-full shadow-lg animate-pulse">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
            </span>
            HAPPY HOUR NOW
          </span>
        </div>
      )}

      <div className="flex">
        {/* Mini Map */}
        <div className="w-28 md:w-36 flex-shrink-0 relative overflow-hidden">
          {!imageError ? (
            <img 
              src={staticMapUrl}
              alt={`Map showing ${pub.name}`}
              className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-full h-full bg-slate-700 flex items-center justify-center">
              <span className="text-2xl">📍</span>
            </div>
          )}
          {/* Map overlay with directions link */}
          <a 
            href={`https://www.google.com/maps/dir/?api=1&destination=${pub.lat},${pub.lng}`}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute inset-0 bg-black/0 hover:bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
          >
            <span className="bg-white/90 text-slate-800 text-xs font-medium px-2 py-1 rounded-full shadow">
              📍 Directions
            </span>
          </a>
        </div>

        {/* Content */}
        <div className="flex-1 p-4 relative">
          {/* Header row */}
          <div className="flex justify-between items-start gap-2 mb-2">
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-lg text-white leading-tight truncate group-hover:text-beer-gold transition-colors">
                {pub.name}
              </h3>
              <p className="text-slate-400 text-sm truncate">{suburb}</p>
            </div>
            
            {/* Price */}
            <div className="flex flex-col items-end flex-shrink-0">
              <div className="relative">
                <span className="text-3xl font-black bg-gradient-to-br from-beer-gold to-amber-500 bg-clip-text text-transparent">
                  ${pub.price % 1 === 0 ? pub.price : pub.price.toFixed(2)}
                </span>
                <span className="absolute -top-1 -right-3 text-xs text-slate-500">/pint</span>
              </div>
            </div>
          </div>

          {/* Beer info - prominent */}
          <div className="mb-3">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500/20 to-beer-gold/20 border border-beer-gold/30 px-3 py-1.5 rounded-lg">
              <span className="text-lg">🍺</span>
              <span className="text-sm font-medium text-beer-gold capitalize">{beerInfo}</span>
            </div>
          </div>

          {/* Happy Hour times */}
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="inline-flex items-center gap-1 bg-slate-700/50 px-2 py-1 rounded-md">
              <span>🕐</span>
              <span>{pub.happyHour}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Bottom accent line */}
      <div className={`h-1 w-full bg-gradient-to-r ${
        isHappyHour 
          ? 'from-green-500 via-emerald-400 to-green-500' 
          : 'from-transparent via-beer-gold/50 to-transparent'
      }`} />
    </div>
  )
}
