'use client'

import { Pub } from '@/types/pub'

interface PubCardProps {
  pub: Pub
  rank?: number
  isHappyHour?: boolean
}

export default function PubCard({ pub, rank, isHappyHour }: PubCardProps) {
  // Format beer description nicely - remove "Pints of" prefix if present
  const beerInfo = (pub.description || pub.beerType)
    .replace(/^pints?\s+of\s+/i, '')
    .replace(/^house\s+/i, 'House ')
  
  return (
    <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all p-4 relative border border-gray-100">
      {/* Rank badge for top 3 */}
      {rank && rank <= 3 && (
        <div className={`absolute -top-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center text-white font-bold shadow-md ${
          rank === 1 ? 'bg-yellow-500' : rank === 2 ? 'bg-gray-400' : 'bg-amber-600'
        }`}>
          #{rank}
        </div>
      )}
      
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-lg font-bold text-gray-800 pr-8">{pub.name}</h3>
        <span className={`text-2xl font-bold ${
          pub.price <= 7.5 ? 'text-green-600' : 
          pub.price <= 9 ? 'text-amber-600' : 'text-red-600'
        }`}>
          ${pub.price.toFixed(2)}
        </span>
      </div>
      
      {/* Beer type highlight */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-3">
        <p className="text-amber-700 font-medium">
          🍺 {beerInfo}
        </p>
      </div>
      
      <p className="text-gray-500 text-sm mb-2">📍 {pub.address}</p>
      
      {pub.happyHour && (
        <p className={`text-sm mb-2 ${
          isHappyHour 
            ? 'text-green-600 font-semibold' 
            : 'text-gray-600'
        }`}>
          🕐 {pub.happyHour}
          {isHappyHour && ' ✨ NOW!'}
        </p>
      )}
      
      {pub.website && (
        <a 
          href={pub.website} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-amber-600 hover:text-amber-700 text-sm mt-2 inline-block"
        >
          Visit website →
        </a>
      )}
    </div>
  )
}
