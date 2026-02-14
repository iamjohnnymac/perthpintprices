'use client'

import { useState, useMemo } from 'react'
import dynamic from 'next/dynamic'
import PubCard from '@/components/PubCard'
import Filters from '@/components/Filters'
import pubsData from '@/data/pubs.json'
import { Pub } from '@/types/pub'

// Dynamic import for map (client-side only)
const Map = dynamic(() => import('@/components/Map'), { 
  ssr: false,
  loading: () => (
    <div className="h-[400px] md:h-[550px] rounded-2xl bg-slate-800/50 flex items-center justify-center border border-slate-700">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-beer-gold border-t-transparent mb-3"></div>
        <p className="text-slate-400">Loading map...</p>
      </div>
    </div>
  )
})

// Check if current time is within happy hour
function isCurrentlyHappyHour(pub: Pub): boolean {
  const now = new Date()
  const day = now.getDay() // 0=Sun, 1=Mon, etc.
  const currentHour = now.getHours()
  const currentMinutes = now.getMinutes()
  const currentTime = currentHour + currentMinutes / 60

  const happyHour = pub.happyHour.toLowerCase()
  
  // Check if today is included
  const dayMap: Record<string, number[]> = {
    'mon-sun': [0, 1, 2, 3, 4, 5, 6],
    'mon-sat': [1, 2, 3, 4, 5, 6],
    'mon-fri': [1, 2, 3, 4, 5],
    'tue-sun': [0, 2, 3, 4, 5, 6],
    'wed-sun': [0, 3, 4, 5, 6],
    'wed-fri': [3, 4, 5],
    'sat-sun': [0, 6],
  }
  
  let todayIncluded = false
  for (const [pattern, days] of Object.entries(dayMap)) {
    if (happyHour.includes(pattern) && days.includes(day)) {
      todayIncluded = true
      break
    }
  }
  
  if (!todayIncluded) return false
  
  // Parse time range (e.g., "4-6pm", "4:30-6:30pm", "3-6pm")
  const timeMatch = happyHour.match(/(\d{1,2}):?(\d{2})?-(\d{1,2}):?(\d{2})?pm/)
  if (!timeMatch) return false
  
  let startHour = parseInt(timeMatch[1])
  const startMin = timeMatch[2] ? parseInt(timeMatch[2]) : 0
  let endHour = parseInt(timeMatch[3])
  const endMin = timeMatch[4] ? parseInt(timeMatch[4]) : 0
  
  // Convert to 24h (all times are PM for happy hours)
  if (startHour < 12) startHour += 12
  if (endHour < 12) endHour += 12
  
  const startTime = startHour + startMin / 60
  const endTime = endHour + endMin / 60
  
  return currentTime >= startTime && currentTime < endTime
}

export default function Home() {
  const [maxPrice, setMaxPrice] = useState(15)
  const [showHappyHourOnly, setShowHappyHourOnly] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<'price' | 'name' | 'distance'>('price')
  const [showMap, setShowMap] = useState(true)

  const pubs: Pub[] = pubsData as Pub[]

  const filteredPubs = useMemo(() => {
    let result = pubs.filter(pub => {
      if (pub.price > maxPrice) return false
      if (showHappyHourOnly && !isCurrentlyHappyHour(pub)) return false
      if (searchTerm) {
        const search = searchTerm.toLowerCase()
        return pub.name.toLowerCase().includes(search) || 
               pub.address.toLowerCase().includes(search) ||
               pub.description.toLowerCase().includes(search)
      }
      return true
    })

    result.sort((a, b) => {
      if (sortBy === 'price') return a.price - b.price
      if (sortBy === 'name') return a.name.localeCompare(b.name)
      return 0
    })

    return result
  }, [pubs, maxPrice, showHappyHourOnly, searchTerm, sortBy])

  const happyHourCount = pubs.filter(isCurrentlyHappyHour).length
  const cheapestPub = pubs.reduce((min, pub) => pub.price < min.price ? pub : min, pubs[0])
  const avgPrice = (pubs.reduce((sum, pub) => sum + pub.price, 0) / pubs.length).toFixed(2)

  // Get rank for each pub
  const sortedByPrice = [...pubs].sort((a, b) => a.price - b.price)
  const getRank = (pubId: number) => sortedByPrice.findIndex(p => p.id === pubId) + 1

  return (
    <main className="min-h-screen">
      {/* Hero */}
      <header className="relative overflow-hidden">
        {/* Animated background blobs */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-beer-gold/10 rounded-full blur-3xl animate-float" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }} />
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 py-10 md:py-16">
          <div className="text-center">
            {/* Logo */}
            <div className="mb-4">
              <span className="beer-emoji text-6xl md:text-7xl">🍺</span>
            </div>
            
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-black mb-4 tracking-tight">
              <span className="gradient-text">Perth Pint Prices</span>
            </h1>
            
            <p className="text-slate-400 text-lg md:text-xl mb-8 max-w-2xl mx-auto">
              Your guide to the <span className="text-beer-gold font-semibold">cheapest pints</span> across Perth.
              <br className="hidden md:block" />
              Never overpay for a beer again.
            </p>
            
            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 max-w-3xl mx-auto">
              {/* Total Pubs */}
              <div className="stat-card bg-slate-800/60 backdrop-blur-sm px-4 py-4 rounded-2xl border border-slate-700/50">
                <div className="text-3xl md:text-4xl font-black text-beer-gold mb-1">{pubs.length}</div>
                <div className="text-xs md:text-sm text-slate-400 uppercase tracking-wide">Venues</div>
              </div>
              
              {/* Cheapest */}
              <div className="stat-card bg-slate-800/60 backdrop-blur-sm px-4 py-4 rounded-2xl border border-slate-700/50">
                <div className="text-3xl md:text-4xl font-black text-green-400 mb-1">${cheapestPub?.price}</div>
                <div className="text-xs md:text-sm text-slate-400 uppercase tracking-wide">Cheapest</div>
              </div>
              
              {/* Average */}
              <div className="stat-card bg-slate-800/60 backdrop-blur-sm px-4 py-4 rounded-2xl border border-slate-700/50">
                <div className="text-3xl md:text-4xl font-black text-white mb-1">${avgPrice}</div>
                <div className="text-xs md:text-sm text-slate-400 uppercase tracking-wide">Average</div>
              </div>
              
              {/* Happy Hour */}
              <div className={`stat-card px-4 py-4 rounded-2xl border backdrop-blur-sm ${
                happyHourCount > 0 
                  ? 'bg-green-500/20 border-green-500/50 badge-pulse' 
                  : 'bg-slate-800/60 border-slate-700/50'
              }`}>
                <div className={`text-3xl md:text-4xl font-black mb-1 ${happyHourCount > 0 ? 'text-green-400' : 'text-slate-500'}`}>
                  {happyHourCount}
                </div>
                <div className={`text-xs md:text-sm uppercase tracking-wide ${happyHourCount > 0 ? 'text-green-300' : 'text-slate-400'}`}>
                  Happy Now
                </div>
              </div>
            </div>

            {/* Cheapest pub callout */}
            <div className="mt-6 inline-flex items-center gap-2 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/30 px-4 py-2 rounded-full">
              <span className="text-green-400">🏆</span>
              <span className="text-sm text-slate-300">
                Cheapest pint: <span className="font-bold text-green-400">${cheapestPub?.price}</span> at{' '}
                <span className="font-bold text-white">{cheapestPub?.name}</span>
                <span className="text-slate-400 ml-1">({cheapestPub?.description.replace('Pints of ', '')})</span>
              </span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Filters */}
        <Filters
          maxPrice={maxPrice}
          setMaxPrice={setMaxPrice}
          showHappyHourOnly={showHappyHourOnly}
          setShowHappyHourOnly={setShowHappyHourOnly}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          sortBy={sortBy}
          setSortBy={setSortBy}
        />

        {/* Toggle Map/List on mobile */}
        <div className="flex gap-2 mt-4 md:hidden">
          <button
            onClick={() => setShowMap(false)}
            className={`glow-button flex-1 py-3 rounded-xl font-semibold transition-all ${
              !showMap 
                ? 'bg-gradient-to-r from-beer-gold to-amber-500 text-black shadow-lg shadow-beer-gold/30' 
                : 'bg-slate-800 text-slate-300 border border-slate-700'
            }`}
          >
            📋 List View
          </button>
          <button
            onClick={() => setShowMap(true)}
            className={`glow-button flex-1 py-3 rounded-xl font-semibold transition-all ${
              showMap 
                ? 'bg-gradient-to-r from-beer-gold to-amber-500 text-black shadow-lg shadow-beer-gold/30' 
                : 'bg-slate-800 text-slate-300 border border-slate-700'
            }`}
          >
            🗺️ Map View
          </button>
        </div>

        {/* Main content */}
        <div className="mt-6 grid md:grid-cols-2 gap-6">
          {/* Map */}
          <div className={`${showMap ? 'block' : 'hidden'} md:block md:sticky md:top-4 md:self-start`}>
            <Map pubs={filteredPubs} isHappyHour={isCurrentlyHappyHour} />
          </div>

          {/* List */}
          <div className={`${!showMap ? 'block' : 'hidden'} md:block`}>
            <div className="flex items-center justify-between mb-4">
              <div className="text-slate-400 text-sm">
                Showing <span className="text-white font-semibold">{filteredPubs.length}</span> of {pubs.length} venues
              </div>
              {filteredPubs.length > 0 && sortBy === 'price' && (
                <div className="text-xs text-slate-500">
                  Sorted by price (low → high)
                </div>
              )}
            </div>
            
            <div className="space-y-4 max-h-[700px] overflow-y-auto pr-2 pb-4">
              {filteredPubs.map((pub) => (
                <PubCard 
                  key={pub.id} 
                  pub={pub} 
                  isHappyHour={isCurrentlyHappyHour(pub)}
                  rank={sortBy === 'price' ? getRank(pub.id) : undefined}
                />
              ))}
              {filteredPubs.length === 0 && (
                <div className="text-center py-16 bg-slate-800/30 rounded-2xl border border-slate-700/50">
                  <span className="text-5xl mb-4 block">🔍</span>
                  <h3 className="text-xl font-bold text-white mb-2">No pubs found</h3>
                  <p className="text-slate-400">Try adjusting your filters or search term.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-16 text-center border-t border-slate-800 pt-8 pb-8">
          <div className="max-w-md mx-auto">
            <p className="text-slate-400 text-sm mb-4">
              Data sourced from eatdrinkcheap.com.au and user submissions.
              <br />
              Prices may vary. Please confirm with venues.
            </p>
            
            <a 
              href="mailto:submit@perthpintprices.com" 
              className="glow-button inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-beer-gold/50 px-6 py-3 rounded-xl transition-all text-sm font-medium"
            >
              <span>📧</span>
              <span>Know a pub? Submit it!</span>
            </a>
            
            <p className="mt-8 text-slate-600 text-xs">
              © 2025 Perth Pint Prices. Drink responsibly. 🍺
            </p>
          </div>
        </footer>
      </div>
    </main>
  )
}
