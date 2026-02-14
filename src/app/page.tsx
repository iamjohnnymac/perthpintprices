'use client'

import { useState, useMemo } from 'react'
import dynamic from 'next/dynamic'
import PubCard from '@/components/PubCard'
import pubsData from '@/data/pubs.json'
import { Pub } from '@/types/pub'

// Dynamic import for map (client-side only)
const Map = dynamic(() => import('@/components/Map'), { 
  ssr: false,
  loading: () => (
    <div className="h-[400px] md:h-[500px] rounded-2xl bg-gray-800/50 flex items-center justify-center border border-gray-700">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-amber-500 border-t-transparent mb-3"></div>
        <p className="text-gray-400">Loading map...</p>
      </div>
    </div>
  )
})

// Check if current time is within happy hour
function isCurrentlyHappyHour(pub: Pub): boolean {
  if (!pub.happyHour) return false
  
  const now = new Date()
  const currentDay = now.toLocaleDateString('en-US', { weekday: 'short' }) // Mon, Tue, etc.
  const currentHour = now.getHours()
  const currentMinutes = now.getMinutes()
  const currentTime = currentHour + currentMinutes / 60
  
  // Check if today is in the happy hour days
  const isToday = pub.happyHour.days.some(day => 
    day.toLowerCase() === currentDay.toLowerCase() ||
    day === 'Daily' ||
    (day === 'Mon-Fri' && ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].includes(currentDay)) ||
    (day === 'Mon-Sun' && true) ||
    (day === 'Mon-Sat' && ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].includes(currentDay))
  )
  
  if (!isToday) return false
  
  // Parse times (e.g., "4pm", "4:30pm", "16:00")
  const parseTime = (timeStr: string): number => {
    const lower = timeStr.toLowerCase().trim()
    let hours = 0
    let minutes = 0
    
    if (lower.includes('pm') || lower.includes('am')) {
      const match = lower.match(/(\d{1,2}):?(\d{2})?(am|pm)/)
      if (match) {
        hours = parseInt(match[1])
        minutes = match[2] ? parseInt(match[2]) : 0
        if (match[3] === 'pm' && hours !== 12) hours += 12
        if (match[3] === 'am' && hours === 12) hours = 0
      }
    } else {
      const match = lower.match(/(\d{1,2}):(\d{2})/)
      if (match) {
        hours = parseInt(match[1])
        minutes = parseInt(match[2])
      }
    }
    
    return hours + minutes / 60
  }
  
  const startTime = parseTime(pub.happyHour.start)
  const endTime = parseTime(pub.happyHour.end)
  
  return currentTime >= startTime && currentTime < endTime
}

export default function Home() {
  const [maxPrice, setMaxPrice] = useState(15)
  const [showHappyHourOnly, setShowHappyHourOnly] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSuburb, setSelectedSuburb] = useState('all')
  const [showMap, setShowMap] = useState(true)

  const pubs: Pub[] = pubsData as Pub[]
  
  // Get unique suburbs
  const suburbs = useMemo(() => {
    const uniqueSuburbs = new Set(pubs.map(p => p.suburb))
    return Array.from(uniqueSuburbs).sort()
  }, [pubs])

  const filteredPubs = useMemo(() => {
    let result = pubs.filter(pub => {
      if (pub.price > maxPrice) return false
      if (showHappyHourOnly && !isCurrentlyHappyHour(pub)) return false
      if (selectedSuburb !== 'all' && pub.suburb !== selectedSuburb) return false
      if (searchTerm) {
        const search = searchTerm.toLowerCase()
        return pub.name.toLowerCase().includes(search) || 
               pub.address.toLowerCase().includes(search) ||
               pub.beerType.toLowerCase().includes(search) ||
               pub.suburb.toLowerCase().includes(search)
      }
      return true
    })

    // Sort by price
    result.sort((a, b) => a.price - b.price)

    return result
  }, [pubs, maxPrice, showHappyHourOnly, searchTerm, selectedSuburb])

  const happyHourCount = pubs.filter(isCurrentlyHappyHour).length
  const cheapestPub = pubs.reduce((min, pub) => pub.price < min.price ? pub : min, pubs[0])
  const avgPrice = (pubs.reduce((sum, pub) => sum + pub.price, 0) / pubs.length).toFixed(2)

  // Get rank for each pub (by price)
  const sortedByPrice = [...pubs].sort((a, b) => a.price - b.price)
  const getRank = (pubId: string) => sortedByPrice.findIndex(p => p.id === pubId) + 1

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-900 to-black">
      {/* Hero */}
      <header className="relative overflow-hidden border-b border-gray-800">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-amber-600/10 rounded-full blur-3xl" />
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 py-10 md:py-16">
          <div className="text-center">
            <span className="text-6xl md:text-7xl mb-4 block">🍺</span>
            
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-black mb-4 tracking-tight">
              <span className="bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-600 bg-clip-text text-transparent">
                Perth Pint Prices
              </span>
            </h1>
            
            <p className="text-gray-400 text-lg md:text-xl mb-8 max-w-2xl mx-auto">
              Your guide to the <span className="text-amber-400 font-semibold">cheapest pints</span> across Perth.
              Never overpay for a beer again.
            </p>
            
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 max-w-3xl mx-auto">
              <div className="bg-gray-800/60 backdrop-blur-sm px-4 py-4 rounded-2xl border border-gray-700/50">
                <div className="text-3xl md:text-4xl font-black text-amber-400 mb-1">{pubs.length}</div>
                <div className="text-xs md:text-sm text-gray-400 uppercase tracking-wide">Venues</div>
              </div>
              
              <div className="bg-gray-800/60 backdrop-blur-sm px-4 py-4 rounded-2xl border border-gray-700/50">
                <div className="text-3xl md:text-4xl font-black text-green-400 mb-1">${cheapestPub?.price}</div>
                <div className="text-xs md:text-sm text-gray-400 uppercase tracking-wide">Cheapest</div>
              </div>
              
              <div className="bg-gray-800/60 backdrop-blur-sm px-4 py-4 rounded-2xl border border-gray-700/50">
                <div className="text-3xl md:text-4xl font-black text-white mb-1">${avgPrice}</div>
                <div className="text-xs md:text-sm text-gray-400 uppercase tracking-wide">Average</div>
              </div>
              
              <div className={`px-4 py-4 rounded-2xl border backdrop-blur-sm ${
                happyHourCount > 0 
                  ? 'bg-green-500/20 border-green-500/50' 
                  : 'bg-gray-800/60 border-gray-700/50'
              }`}>
                <div className={`text-3xl md:text-4xl font-black mb-1 ${happyHourCount > 0 ? 'text-green-400' : 'text-gray-500'}`}>
                  {happyHourCount}
                </div>
                <div className={`text-xs md:text-sm uppercase tracking-wide ${happyHourCount > 0 ? 'text-green-300' : 'text-gray-400'}`}>
                  Happy Now
                </div>
              </div>
            </div>

            {/* Cheapest callout */}
            {cheapestPub && (
              <div className="mt-6 inline-flex items-center gap-2 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/30 px-4 py-2 rounded-full">
                <span className="text-green-400">🏆</span>
                <span className="text-sm text-gray-300">
                  Cheapest: <span className="font-bold text-green-400">${cheapestPub.price}</span> at{' '}
                  <span className="font-bold text-white">{cheapestPub.name}</span>
                  <span className="text-gray-400 ml-1">({cheapestPub.beerType})</span>
                </span>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Filters */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-4 border border-gray-700/50 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm text-gray-400 mb-2">Search</label>
              <input
                type="text"
                placeholder="Pub name, suburb, beer..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:border-amber-500 focus:outline-none transition-colors"
              />
            </div>
            
            {/* Suburb */}
            <div>
              <label className="block text-sm text-gray-400 mb-2">Suburb</label>
              <select
                value={selectedSuburb}
                onChange={(e) => setSelectedSuburb(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-2.5 text-white focus:border-amber-500 focus:outline-none transition-colors"
              >
                <option value="all">All suburbs</option>
                {suburbs.map(suburb => (
                  <option key={suburb} value={suburb}>{suburb}</option>
                ))}
              </select>
            </div>
            
            {/* Max Price */}
            <div>
              <label className="block text-sm text-gray-400 mb-2">Max Price: ${maxPrice}</label>
              <input
                type="range"
                min="5"
                max="15"
                step="0.5"
                value={maxPrice}
                onChange={(e) => setMaxPrice(parseFloat(e.target.value))}
                className="w-full accent-amber-500"
              />
            </div>
            
            {/* Happy Hour Toggle */}
            <div className="flex items-end">
              <button
                onClick={() => setShowHappyHourOnly(!showHappyHourOnly)}
                className={`w-full py-2.5 rounded-xl font-semibold transition-all ${
                  showHappyHourOnly 
                    ? 'bg-green-500 text-white' 
                    : 'bg-gray-900 border border-gray-700 text-gray-300 hover:border-green-500/50'
                }`}
              >
                🕐 Happy Hour Only
              </button>
            </div>
          </div>
        </div>

        {/* Mobile toggle */}
        <div className="flex gap-2 mb-4 md:hidden">
          <button
            onClick={() => setShowMap(false)}
            className={`flex-1 py-3 rounded-xl font-semibold transition-all ${
              !showMap 
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-black' 
                : 'bg-gray-800 text-gray-300 border border-gray-700'
            }`}
          >
            📋 List
          </button>
          <button
            onClick={() => setShowMap(true)}
            className={`flex-1 py-3 rounded-xl font-semibold transition-all ${
              showMap 
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-black' 
                : 'bg-gray-800 text-gray-300 border border-gray-700'
            }`}
          >
            🗺️ Map
          </button>
        </div>

        {/* Main content */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Map */}
          <div className={`${showMap ? 'block' : 'hidden'} md:block md:sticky md:top-4 md:self-start`}>
            <Map pubs={filteredPubs} />
          </div>

          {/* List */}
          <div className={`${!showMap ? 'block' : 'hidden'} md:block`}>
            <div className="flex items-center justify-between mb-4">
              <div className="text-gray-400 text-sm">
                Showing <span className="text-white font-semibold">{filteredPubs.length}</span> of {pubs.length} venues
              </div>
            </div>
            
            <div className="space-y-4 max-h-[700px] overflow-y-auto pr-2">
              {filteredPubs.map((pub) => (
                <PubCard 
                  key={pub.id} 
                  pub={pub} 
                  rank={getRank(pub.id)}
                />
              ))}
              {filteredPubs.length === 0 && (
                <div className="text-center py-16 bg-gray-800/30 rounded-2xl border border-gray-700/50">
                  <span className="text-5xl mb-4 block">🔍</span>
                  <h3 className="text-xl font-bold text-white mb-2">No pubs found</h3>
                  <p className="text-gray-400">Try adjusting your filters.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-16 text-center border-t border-gray-800 pt-8 pb-8">
          <p className="text-gray-400 text-sm mb-4">
            Data sourced from eatdrinkcheap.com.au • Prices may vary
          </p>
          <p className="text-gray-600 text-xs">
            © 2025 Perth Pint Prices 🍺
          </p>
        </footer>
      </div>
    </main>
  )
}
