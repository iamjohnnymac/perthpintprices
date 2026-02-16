'use client'

import { useState, useMemo } from 'react'
import dynamic from 'next/dynamic'
import pubs from '@/data/pubs.json'
import { Pub } from '@/types/pub'
import SubmitPubForm from '@/components/SubmitPubForm'

const Map = dynamic(() => import('@/components/Map'), {
  ssr: false,
  loading: () => (
    <div className="h-[400px] bg-gradient-to-br from-amber-50 to-orange-100 rounded-xl flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
        <span className="text-amber-700 font-medium">Loading map...</span>
      </div>
    </div>
  )
})

// Mini map component for pub cards
const MiniMap = dynamic(() => import('@/components/MiniMap'), {
  ssr: false,
  loading: () => <div className="h-24 bg-gray-200 rounded-lg animate-pulse"></div>
})

const typedPubs: Pub[] = pubs as Pub[]

// Check if current time falls within happy hour
function isHappyHour(happyHour: string | null | undefined): boolean {
  if (!happyHour) return false

  const now = new Date()
  const currentDay = now.toLocaleDateString('en-US', { weekday: 'short' })
  const currentHour = now.getHours()

  const hhLower = happyHour.toLowerCase()

  // Check day
  const isToday =
    hhLower.includes('daily') ||
    hhLower.includes(currentDay.toLowerCase()) ||
    (hhLower.includes('mon-fri') && ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].includes(currentDay)) ||
    (hhLower.includes('wed-sun') && ['Wed', 'Thu', 'Fri', 'Sat', 'Sun'].includes(currentDay)) ||
    (hhLower.includes('tue-sat') && ['Tue', 'Wed', 'Thu', 'Fri', 'Sat'].includes(currentDay)) ||
    (hhLower.includes('wed-sat') && ['Wed', 'Thu', 'Fri', 'Sat'].includes(currentDay)) ||
    (hhLower.includes('thu-sat') && ['Thu', 'Fri', 'Sat'].includes(currentDay)) ||
    (hhLower.includes('fri-sat') && ['Fri', 'Sat'].includes(currentDay))

  if (!isToday) return false

  // Parse time
  const timeMatch = happyHour.match(/(\d{1,2})[-–](\d{1,2})(pm)?/i)
  if (!timeMatch) return false

  let startHour = parseInt(timeMatch[1])
  let endHour = parseInt(timeMatch[2])

  // Convert to 24h
  if (startHour < 12 && (hhLower.includes('pm') || startHour < 6)) startHour += 12
  if (endHour < 12 && (hhLower.includes('pm') || endHour <= 8)) endHour += 12

  return currentHour >= startHour && currentHour < endHour
}

// Get price color
function getPriceColor(price: number): string {
  if (price <= 7) return 'from-green-400 to-green-600'
  if (price <= 8) return 'from-yellow-400 to-yellow-600'
  if (price <= 9) return 'from-orange-400 to-orange-600'
  return 'from-red-400 to-red-600'
}

function getPriceBgColor(price: number): string {
  if (price <= 7) return 'bg-green-500'
  if (price <= 8) return 'bg-yellow-500'
  if (price <= 9) return 'bg-orange-500'
  return 'bg-red-500'
}

export default function Home() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSuburb, setSelectedSuburb] = useState('')
  const [maxPrice, setMaxPrice] = useState(15)
  const [sortBy, setSortBy] = useState<'price' | 'name' | 'suburb'>('price')
  const [showHappyHourOnly, setShowHappyHourOnly] = useState(false)
  const [showMiniMaps, setShowMiniMaps] = useState(true)
  const [showSubmitForm, setShowSubmitForm] = useState(false)

  const suburbs = useMemo(() => {
    const suburbSet = new Set(typedPubs.map(pub => pub.suburb))
    return Array.from(suburbSet).sort()
  }, [])

  const filteredPubs = useMemo(() => {
    return typedPubs
      .filter(pub => {
        const matchesSearch =
          pub.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          pub.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (pub.description?.toLowerCase() || '').includes(searchTerm.toLowerCase())
        const matchesSuburb = !selectedSuburb || pub.suburb === selectedSuburb
        const matchesPrice = pub.price <= maxPrice
        const matchesHappyHour = !showHappyHourOnly || isHappyHour(pub.happyHour)
        return matchesSearch && matchesSuburb && matchesPrice && matchesHappyHour
      })
      .sort((a, b) => {
        if (sortBy === 'price') return a.price - b.price
        if (sortBy === 'name') return a.name.localeCompare(b.name)
        if (sortBy === 'suburb') return a.suburb.localeCompare(b.suburb)
        return 0
      })
  }, [searchTerm, selectedSuburb, maxPrice, sortBy, showHappyHourOnly])

  const cheapestPub = useMemo(() => {
    return typedPubs.reduce((min, pub) => pub.price < min.price ? pub : min, typedPubs[0])
  }, [])

  const stats = useMemo(() => ({
    total: typedPubs.length,
    minPrice: Math.min(...typedPubs.map(p => p.price)),
    maxPriceValue: Math.max(...typedPubs.map(p => p.price)),
    avgPrice: (typedPubs.reduce((sum, p) => sum + p.price, 0) / typedPubs.length).toFixed(2),
    happyHourNow: typedPubs.filter(p => isHappyHour(p.happyHour)).length
  }), [])

  return (
    <main className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50">
      {/* Submit Pub Modal */}
      <SubmitPubForm isOpen={showSubmitForm} onClose={() => setShowSubmitForm(false)} />
      
      {/* Header */}
      <header className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="text-6xl animate-bounce">🍺</div>
              <div>
                <h1 className="text-4xl md:text-5xl font-black tracking-tight">
                  Perth Pint Prices
                </h1>
                <p className="text-amber-100 text-lg mt-1">
                  Find the cheapest pints in Perth, Western Australia
                </p>
              </div>
            </div>
            
            {/* Submit Button */}
            <button
              onClick={() => setShowSubmitForm(true)}
              className="hidden sm:flex items-center gap-2 px-5 py-3 bg-white/20 hover:bg-white/30 backdrop-blur rounded-xl font-semibold transition-all hover:scale-105 active:scale-95 border border-white/30"
            >
              <span className="text-xl">➕</span>
              <span>Submit a Pub</span>
            </button>
          </div>

          {/* Stats Pills */}
          <div className="flex flex-wrap gap-3 mt-6">
            <span className="px-4 py-2 bg-white/20 backdrop-blur rounded-full font-semibold flex items-center gap-2 hover:bg-white/30 transition-all">
              📊 {stats.total} venues
            </span>
            <span className="px-4 py-2 bg-white/20 backdrop-blur rounded-full font-semibold flex items-center gap-2 hover:bg-white/30 transition-all">
              💰 From ${stats.minPrice.toFixed(2)}
            </span>
            <span className="px-4 py-2 bg-white/20 backdrop-blur rounded-full font-semibold flex items-center gap-2 hover:bg-white/30 transition-all">
              🏆 Cheapest: {cheapestPub.name}
            </span>
            {stats.happyHourNow > 0 && (
              <span className="px-4 py-2 bg-green-500/80 backdrop-blur rounded-full font-semibold flex items-center gap-2 animate-pulse">
                🍻 {stats.happyHourNow} happy hours NOW!
              </span>
            )}
            {/* Mobile Submit Button */}
            <button
              onClick={() => setShowSubmitForm(true)}
              className="sm:hidden px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur rounded-full font-semibold flex items-center gap-2 transition-all"
            >
              ➕ Submit
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Filters Card */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl p-6 mb-8 border border-white/50">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Search</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search pubs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition-all outline-none"
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
              </div>
            </div>

            {/* Suburb Filter */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Suburb</label>
              <select
                value={selectedSuburb}
                onChange={(e) => setSelectedSuburb(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition-all outline-none bg-white"
              >
                <option value="">All Suburbs</option>
                {suburbs.map(suburb => (
                  <option key={suburb} value={suburb}>{suburb}</option>
                ))}
              </select>
            </div>

            {/* Sort By */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Sort By</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'price' | 'name' | 'suburb')}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition-all outline-none bg-white"
              >
                <option value="price">Price (Low to High)</option>
                <option value="name">Name (A-Z)</option>
                <option value="suburb">Suburb</option>
              </select>
            </div>

            {/* Max Price Slider */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Max Price: <span className="text-amber-600 font-bold">${maxPrice}</span>
              </label>
              <input
                type="range"
                min="6"
                max="15"
                step="0.5"
                value={maxPrice}
                onChange={(e) => setMaxPrice(parseFloat(e.target.value))}
                className="w-full h-3 bg-gradient-to-r from-green-400 via-yellow-400 to-red-400 rounded-full appearance-none cursor-pointer"
              />
            </div>
          </div>

          {/* Toggle Filters */}
          <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-gray-100">
            <label className="flex items-center gap-2 cursor-pointer group">
              <input
                type="checkbox"
                checked={showHappyHourOnly}
                onChange={(e) => setShowHappyHourOnly(e.target.checked)}
                className="w-5 h-5 rounded border-2 border-gray-300 text-amber-500 focus:ring-amber-500"
              />
              <span className="text-gray-700 group-hover:text-amber-600 transition-colors">
                🕐 Happy Hour Now Only
              </span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer group">
              <input
                type="checkbox"
                checked={showMiniMaps}
                onChange={(e) => setShowMiniMaps(e.target.checked)}
                className="w-5 h-5 rounded border-2 border-gray-300 text-amber-500 focus:ring-amber-500"
              />
              <span className="text-gray-700 group-hover:text-amber-600 transition-colors">
                🗺️ Show Mini Maps
              </span>
            </label>
          </div>
        </div>

        {/* Results Count */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-gray-600 font-medium">
            Showing <span className="text-amber-600 font-bold">{filteredPubs.length}</span> of {stats.total} venues
          </p>
        </div>

        {/* Main Map */}
        <div className="mb-8 rounded-2xl overflow-hidden shadow-2xl border-4 border-white">
          <Map pubs={filteredPubs} isHappyHour={isHappyHour} />
        </div>

        {/* Pub Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPubs.map((pub, index) => (
            <div
              key={pub.id}
              className="group relative bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-white/50 hover:-translate-y-1"
            >
              {/* Rank Badge for Top 3 */}
              {index < 3 && sortBy === 'price' && (
                <div className={`absolute -top-2 -right-2 w-12 h-12 rounded-full flex items-center justify-center text-white font-black text-lg shadow-lg z-10 ${
                  index === 0 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600' :
                  index === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-500' :
                  'bg-gradient-to-br from-amber-600 to-amber-800'
                }`}>
                  #{index + 1}
                </div>
              )}

              {/* Happy Hour Now Badge */}
              {isHappyHour(pub.happyHour) && (
                <div className="absolute top-3 left-3 px-3 py-1 bg-green-500 text-white text-xs font-bold rounded-full animate-pulse shadow-lg z-10">
                  🍻 HAPPY HOUR!
                </div>
              )}

              {/* Mini Map */}
              {showMiniMaps && (
                <div className="h-28 relative overflow-hidden">
                  <MiniMap lat={pub.lat} lng={pub.lng} name={pub.name} />
                  <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent pointer-events-none"></div>
                </div>
              )}

              {/* Content */}
              <div className={`p-5 ${!showMiniMaps ? 'pt-6' : ''}`}>
                {/* Header Row */}
                <div className="flex justify-between items-start gap-3 mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-lg text-gray-900 truncate group-hover:text-amber-600 transition-colors">
                      {pub.name}
                    </h3>
                    <p className="text-sm text-gray-500 truncate">{pub.suburb}</p>
                  </div>
                  <div className={`text-2xl font-black bg-gradient-to-br ${getPriceColor(pub.price)} bg-clip-text text-transparent`}>
                    ${pub.price.toFixed(2)}
                  </div>
                </div>

                {/* Beer Type - Prominent */}
                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold text-white mb-3 ${getPriceBgColor(pub.price)}`}>
                  <span className="text-base">🍺</span>
                  {pub.beerType}
                </div>

                {/* Address */}
                <p className="text-sm text-gray-600 mb-2 flex items-start gap-1">
                  <span>📍</span>
                  <span className="flex-1">{pub.address}</span>
                </p>

                {/* Happy Hour */}
                {pub.happyHour && (
                  <p className={`text-sm mb-2 flex items-center gap-1 ${
                    isHappyHour(pub.happyHour) ? 'text-green-600 font-semibold' : 'text-gray-500'
                  }`}>
                    <span>🕐</span>
                    {pub.happyHour}
                  </p>
                )}

                {/* Description */}
                {pub.description && (
                  <p className="text-sm text-gray-500 mb-3 line-clamp-2 italic">
                    "{pub.description}"
                  </p>
                )}

                {/* Website Link */}
                {pub.website && (
                  <a
                    href={pub.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-amber-600 hover:text-amber-700 text-sm font-semibold group/link"
                  >
                    Visit website
                    <span className="group-hover/link:translate-x-1 transition-transform">→</span>
                  </a>
                )}
              </div>

              {/* Bottom Gradient Border */}
              <div className={`h-1 bg-gradient-to-r ${getPriceColor(pub.price)}`}></div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredPubs.length === 0 && (
          <div className="text-center py-16 bg-white/50 rounded-2xl">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-bold text-gray-700 mb-2">No pubs found</h3>
            <p className="text-gray-500">Try adjusting your filters</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-gray-400">
            🍺 Perth Pint Prices — Helping you find cheap drinks since 2024
          </p>
          <p className="text-gray-500 text-sm mt-2">
            Prices may vary. Always drink responsibly.
          </p>
          <button
            onClick={() => setShowSubmitForm(true)}
            className="mt-4 text-amber-400 hover:text-amber-300 font-semibold transition-colors"
          >
            Know a cheap pint spot? Let us know! →
          </button>
        </div>
      </footer>
    </main>
  )
}
