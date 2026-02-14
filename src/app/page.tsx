'use client'

import { useState, useMemo, useEffect } from 'react'
import dynamic from 'next/dynamic'
import pubsData from '@/data/pubs.json'
import { Pub } from '@/types/pub'

// Dynamically import Map component to avoid SSR issues with Leaflet
const Map = dynamic(() => import('@/components/Map'), { 
  ssr: false,
  loading: () => (
    <div className="h-[400px] bg-gray-100 animate-pulse rounded-lg flex items-center justify-center">
      <span className="text-gray-500">Loading map...</span>
    </div>
  )
})

// Check if pub is currently in happy hour
function isCurrentlyHappyHour(happyHour: string | null | undefined): boolean {
  if (!happyHour) return false
  
  const now = new Date()
  const day = now.toLocaleDateString('en-US', { weekday: 'short' })
  const hour = now.getHours()
  
  const happyHourLower = happyHour.toLowerCase()
  
  // Check if today is included
  const days = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']
  const todayShort = day.toLowerCase().slice(0, 3)
  
  let dayMatch = false
  if (happyHourLower.includes('daily')) {
    dayMatch = true
  } else if (happyHourLower.includes(todayShort)) {
    dayMatch = true
  } else if (happyHourLower.includes('mon-fri') && ['mon', 'tue', 'wed', 'thu', 'fri'].includes(todayShort)) {
    dayMatch = true
  } else if (happyHourLower.includes('mon-sun')) {
    dayMatch = true
  }
  
  if (!dayMatch) return false
  
  // Parse time range (e.g., "4-7pm", "4pm-6pm", "5-7pm")
  const timeMatch = happyHourLower.match(/(\d{1,2})(?:pm|am)?\s*-\s*(\d{1,2})(?:pm|am)?/)
  if (timeMatch) {
    let startHour = parseInt(timeMatch[1])
    let endHour = parseInt(timeMatch[2])
    
    // Assume PM for typical happy hour times
    if (startHour < 12 && startHour >= 1 && startHour <= 8) startHour += 12
    if (endHour < 12 && endHour >= 1 && endHour <= 11) endHour += 12
    
    return hour >= startHour && hour < endHour
  }
  
  return false
}

export default function Home() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSuburb, setSelectedSuburb] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'price' | 'name' | 'suburb'>('price')
  const [showHappyHourOnly, setShowHappyHourOnly] = useState(false)
  const [showMap, setShowMap] = useState(true)
  const [maxPrice, setMaxPrice] = useState<number>(15)
  
  const pubs: Pub[] = pubsData as Pub[]
  
  // Get unique suburbs
  const suburbs = useMemo(() => {
    const uniqueSuburbs = Array.from(new Set(pubs.map(pub => pub.suburb))).sort()
    return ['all', ...uniqueSuburbs]
  }, [pubs])
  
  // Filter and sort pubs
  const filteredPubs = useMemo(() => {
    let result = pubs.filter(pub => {
      const search = searchTerm.toLowerCase()
      if (search) {
        return pub.name.toLowerCase().includes(search) || 
               pub.address.toLowerCase().includes(search) ||
               (pub.description?.toLowerCase().includes(search) ?? false)
      }
      return true
    })
    
    if (selectedSuburb !== 'all') {
      result = result.filter(pub => pub.suburb === selectedSuburb)
    }
    
    if (showHappyHourOnly) {
      result = result.filter(pub => isCurrentlyHappyHour(pub.happyHour))
    }
    
    result = result.filter(pub => pub.price <= maxPrice)
    
    // Sort
    result.sort((a, b) => {
      if (sortBy === 'price') return a.price - b.price
      if (sortBy === 'name') return a.name.localeCompare(b.name)
      if (sortBy === 'suburb') return a.suburb.localeCompare(b.suburb)
      return 0
    })
    
    return result
  }, [pubs, searchTerm, selectedSuburb, sortBy, showHappyHourOnly, maxPrice])
  
  // Find cheapest pubs
  const cheapestPrice = Math.min(...pubs.map(p => p.price))
  const cheapestPubs = pubs.filter(p => p.price === cheapestPrice)
  
  return (
    <main className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-amber-600 to-orange-500 text-white py-8 px-4 shadow-lg">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold mb-2">🍺 Perth Pint Prices</h1>
          <p className="text-amber-100 text-lg">Find the cheapest pints in Perth, Western Australia</p>
          <div className="mt-4 flex flex-wrap gap-4 text-sm">
            <span className="bg-amber-700/50 px-3 py-1 rounded-full">
              📍 {pubs.length} venues
            </span>
            <span className="bg-amber-700/50 px-3 py-1 rounded-full">
              💰 From ${cheapestPrice.toFixed(2)}
            </span>
            <span className="bg-amber-700/50 px-3 py-1 rounded-full">
              🏆 Cheapest: {cheapestPubs[0]?.name}
            </span>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Filters */}
        <div className="bg-white rounded-xl shadow-md p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
              <input
                type="text"
                placeholder="Search pubs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
            </div>
            
            {/* Suburb Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Suburb</label>
              <select
                value={selectedSuburb}
                onChange={(e) => setSelectedSuburb(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              >
                {suburbs.map(suburb => (
                  <option key={suburb} value={suburb}>
                    {suburb === 'all' ? 'All Suburbs' : suburb}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Sort */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'price' | 'name' | 'suburb')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              >
                <option value="price">Price (Low to High)</option>
                <option value="name">Name (A-Z)</option>
                <option value="suburb">Suburb (A-Z)</option>
              </select>
            </div>
            
            {/* Max Price */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max Price: ${maxPrice}</label>
              <input
                type="range"
                min="5"
                max="15"
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="w-full"
              />
            </div>
          </div>
          
          <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showHappyHourOnly}
                onChange={(e) => setShowHappyHourOnly(e.target.checked)}
                className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500"
              />
              <span className="text-sm">🕐 Happy Hour Now Only</span>
            </label>
            
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showMap}
                onChange={(e) => setShowMap(e.target.checked)}
                className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500"
              />
              <span className="text-sm">🗺️ Show Map</span>
            </label>
          </div>
        </div>

        {/* Results count */}
        <p className="text-gray-600 mb-4">
          Showing {filteredPubs.length} of {pubs.length} venues
        </p>

        {/* Map */}
        {showMap && (
          <div className="mb-6 rounded-xl overflow-hidden shadow-lg">
            <Map pubs={filteredPubs} />
          </div>
        )}

        {/* Pub Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPubs.map((pub, index) => (
            <div 
              key={pub.id} 
              className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow p-4 relative"
            >
              {/* Rank badge for top 3 */}
              {index < 3 && sortBy === 'price' && (
                <div className={`absolute -top-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                  index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : 'bg-amber-600'
                }`}>
                  #{index + 1}
                </div>
              )}
              
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-lg font-bold text-gray-800">{pub.name}</h3>
                <span className={`text-2xl font-bold ${
                  pub.price <= 7.5 ? 'text-green-600' : 
                  pub.price <= 9 ? 'text-amber-600' : 'text-red-600'
                }`}>
                  ${pub.price.toFixed(2)}
                </span>
              </div>
              
              <p className="text-amber-700 font-medium mb-1">🍺 {pub.beerType}</p>
              <p className="text-gray-500 text-sm mb-2">📍 {pub.address}</p>
              
              {pub.happyHour && (
                <p className={`text-sm mb-2 ${
                  isCurrentlyHappyHour(pub.happyHour) 
                    ? 'text-green-600 font-semibold' 
                    : 'text-gray-600'
                }`}>
                  🕐 {pub.happyHour}
                  {isCurrentlyHappyHour(pub.happyHour) && ' ✨ NOW!'}
                </p>
              )}
              
              {pub.description && (
                <p className="text-gray-600 text-sm">{pub.description}</p>
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
          ))}
        </div>
        
        {filteredPubs.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <p className="text-4xl mb-4">🍺</p>
            <p>No pubs found matching your criteria.</p>
            <p className="text-sm mt-2">Try adjusting your filters.</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-gray-800 text-gray-400 py-8 px-4 mt-12">
        <div className="max-w-6xl mx-auto text-center">
          <p>© 2024 Perth Pint Prices</p>
          <p className="text-sm mt-2">Prices may vary. Always drink responsibly.</p>
          <p className="text-sm mt-2">Data sourced from public listings. Last updated: Feb 2024</p>
        </div>
      </footer>
    </main>
  )
}
