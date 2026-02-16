'use client'

import { useState, useMemo, useEffect } from 'react'
import dynamic from 'next/dynamic'
import pubs from '@/data/pubs.json'
import { Pub } from '@/types/pub'
import SubmitPubForm from '@/components/SubmitPubForm'
import CrowdReporter from '@/components/CrowdReporter'
import CrowdBadge from '@/components/CrowdBadge'
import { getCrowdLevels } from '@/lib/supabase'

const Map = dynamic(() => import('@/components/Map'), {
  ssr: false,
  loading: () => (
    <div className="h-[400px] bg-[#f5ebe0] rounded-xl flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-12 h-12 border-4 border-[#8b4513] border-t-transparent rounded-full animate-spin"></div>
        <span className="text-[#6b5c4a] font-medium">Loading map...</span>
      </div>
    </div>
  )
})

// Mini map component for pub cards
const MiniMap = dynamic(() => import('@/components/MiniMap'), {
  ssr: false,
  loading: () => <div className="h-24 bg-[#f5ebe0] rounded-lg animate-pulse"></div>
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

// Get price color - using warm palette
function getPriceColor(price: number): string {
  if (price <= 7) return 'from-emerald-600 to-emerald-700'
  if (price <= 8) return 'from-amber-600 to-amber-700'
  if (price <= 9) return 'from-orange-600 to-orange-700'
  return 'from-red-600 to-red-700'
}

function getPriceBgColor(price: number): string {
  if (price <= 7) return 'bg-emerald-700'
  if (price <= 8) return 'bg-amber-700'
  if (price <= 9) return 'bg-orange-700'
  return 'bg-red-700'
}

export default function Home() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSuburb, setSelectedSuburb] = useState('')
  const [maxPrice, setMaxPrice] = useState(15)
  const [sortBy, setSortBy] = useState<'price' | 'name' | 'suburb'>('price')
  const [showHappyHourOnly, setShowHappyHourOnly] = useState(false)
  const [showMiniMaps, setShowMiniMaps] = useState(true)
  const [showSubmitForm, setShowSubmitForm] = useState(false)
  const [crowdReporterPub, setCrowdReporterPub] = useState<{ id: string; name: string } | null>(null)
  const [crowdLevels, setCrowdLevels] = useState<Map<string, { level: number; reportedAt: Date }>>(new Map())

  // Fetch crowd levels on mount
  useEffect(() => {
    async function fetchCrowdLevels() {
      const levels = await getCrowdLevels()
      setCrowdLevels(levels)
    }
    fetchCrowdLevels()
    // Refresh every 2 minutes
    const interval = setInterval(fetchCrowdLevels, 120000)
    return () => clearInterval(interval)
  }, [])

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

  // Format lastUpdated date
  function formatLastUpdated(dateStr: string | undefined): string {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-AU', { month: 'short', year: 'numeric' })
  }

  return (
    <main className="min-h-screen" style={{ background: 'linear-gradient(135deg, #faf6f0 0%, #f5ebe0 50%, #faf6f0 100%)' }}>
      {/* Header - Warm muted palette */}
      <header style={{ background: 'linear-gradient(135deg, #8b4513 0%, #a0522d 50%, #8b4513 100%)' }} className="text-white shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="text-6xl animate-bounce">🍺</div>
              <div>
                <h1 className="text-4xl md:text-5xl font-black tracking-tight">
                  Perth Pint Prices
                </h1>
                <p className="text-[#f5ebe0] text-lg mt-1">
                  Find the cheapest pints in Perth, Western Australia
                </p>
              </div>
            </div>
            {/* Submit Pub Button - Desktop */}
            <button
              onClick={() => setShowSubmitForm(true)}
              className="hidden md:flex items-center gap-2 px-6 py-3 bg-white/20 hover:bg-white/30 backdrop-blur rounded-full font-semibold transition-all border border-white/30"
            >
              <span>➕</span> Submit a Pub
            </button>
          </div>

          {/* Stats Pills */}
          <div className="flex flex-wrap gap-3 mt-6">
            <span className="px-4 py-2 bg-white/20 backdrop-blur rounded-full font-semibold flex items-center gap-2 hover:bg-white/30 transition-all border border-white/10">
              📊 {stats.total} venues
            </span>
            <span className="px-4 py-2 bg-white/20 backdrop-blur rounded-full font-semibold flex items-center gap-2 hover:bg-white/30 transition-all border border-white/10">
              💰 From ${stats.minPrice.toFixed(2)}
            </span>
            <span className="px-4 py-2 bg-white/20 backdrop-blur rounded-full font-semibold flex items-center gap-2 hover:bg-white/30 transition-all border border-white/10">
              🏆 Cheapest: {cheapestPub.name}
            </span>
            {stats.happyHourNow > 0 && (
              <span className="px-4 py-2 bg-emerald-600/80 backdrop-blur rounded-full font-semibold flex items-center gap-2 animate-pulse border border-emerald-400/30">
                🍻 {stats.happyHourNow} happy hours NOW!
              </span>
            )}
            {/* Submit Pub Button - Mobile */}
            <button
              onClick={() => setShowSubmitForm(true)}
              className="md:hidden px-4 py-2 bg-white/20 backdrop-blur rounded-full font-semibold flex items-center gap-2 hover:bg-white/30 transition-all border border-white/10"
            >
              ➕ Submit
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Filters Card */}
        <div className="bg-[#fffdf8]/90 backdrop-blur-xl rounded-2xl shadow-xl p-6 mb-8 border border-[#d4a574]/20">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-semibold text-[#3d3529] mb-2">Search</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search pubs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border-2 border-[#d4a574]/30 rounded-xl focus:border-[#8b4513] focus:ring-4 focus:ring-[#d4a574]/20 transition-all outline-none bg-white text-[#3d3529]"
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6b5c4a]">🔍</span>
              </div>
            </div>

            {/* Suburb Filter */}
            <div>
              <label className="block text-sm font-semibold text-[#3d3529] mb-2">Suburb</label>
              <select
                value={selectedSuburb}
                onChange={(e) => setSelectedSuburb(e.target.value)}
                className="w-full px-4 py-3 border-2 border-[#d4a574]/30 rounded-xl focus:border-[#8b4513] focus:ring-4 focus:ring-[#d4a574]/20 transition-all outline-none bg-white text-[#3d3529]"
              >
                <option value="">All Suburbs</option>
                {suburbs.map(suburb => (
                  <option key={suburb} value={suburb} className="text-[#3d3529]">{suburb}</option>
                ))}
              </select>
            </div>

            {/* Sort By */}
            <div>
              <label className="block text-sm font-semibold text-[#3d3529] mb-2">Sort By</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'price' | 'name' | 'suburb')}
                className="w-full px-4 py-3 border-2 border-[#d4a574]/30 rounded-xl focus:border-[#8b4513] focus:ring-4 focus:ring-[#d4a574]/20 transition-all outline-none bg-white text-[#3d3529]"
              >
                <option value="price">Price (Low to High)</option>
                <option value="name">Name (A-Z)</option>
                <option value="suburb">Suburb</option>
              </select>
            </div>

            {/* Max Price Slider */}
            <div>
              <label className="block text-sm font-semibold text-[#3d3529] mb-2">
                Max Price: <span className="text-[#8b4513] font-bold">${maxPrice}</span>
              </label>
              <input
                type="range"
                min="6"
                max="15"
                step="0.5"
                value={maxPrice}
                onChange={(e) => setMaxPrice(parseFloat(e.target.value))}
                className="w-full h-3 bg-gradient-to-r from-emerald-600 via-amber-500 to-red-600 rounded-full appearance-none cursor-pointer"
              />
            </div>
          </div>

          {/* Toggle Filters */}
          <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-[#d4a574]/20">
            <label className="flex items-center gap-2 cursor-pointer group">
              <input
                type="checkbox"
                checked={showHappyHourOnly}
                onChange={(e) => setShowHappyHourOnly(e.target.checked)}
                className="w-5 h-5 rounded border-2 border-[#d4a574]/50 text-[#8b4513] focus:ring-[#8b4513]"
              />
              <span className="text-[#3d3529] group-hover:text-[#8b4513] transition-colors">
                🕐 Happy Hour Now Only
              </span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer group">
              <input
                type="checkbox"
                checked={showMiniMaps}
                onChange={(e) => setShowMiniMaps(e.target.checked)}
                className="w-5 h-5 rounded border-2 border-[#d4a574]/50 text-[#8b4513] focus:ring-[#8b4513]"
              />
              <span className="text-[#3d3529] group-hover:text-[#8b4513] transition-colors">
                🗺️ Show Mini Maps
              </span>
            </label>
          </div>
        </div>

        {/* Results Count */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-[#6b5c4a] font-medium">
            Showing <span className="text-[#8b4513] font-bold">{filteredPubs.length}</span> of {stats.total} venues
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
              className="group relative bg-[#fffdf8]/95 backdrop-blur-xl rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-[#d4a574]/20 hover:-translate-y-1"
            >
              {/* Rank Badge for Top 3 */}
              {index < 3 && sortBy === 'price' && (
                <div className={`absolute -top-2 -right-2 w-12 h-12 rounded-full flex items-center justify-center text-white font-black text-lg shadow-lg z-10 ${
                  index === 0 ? 'bg-gradient-to-br from-amber-500 to-amber-700' :
                  index === 1 ? 'bg-gradient-to-br from-gray-400 to-gray-600' :
                  'bg-gradient-to-br from-orange-700 to-orange-900'
                }`}>
                  #{index + 1}
                </div>
              )}

              {/* Happy Hour Now Badge */}
              {isHappyHour(pub.happyHour) && (
                <div className="absolute top-3 left-3 px-3 py-1 bg-emerald-600 text-white text-xs font-bold rounded-full animate-pulse shadow-lg z-10">
                  🍻 HAPPY HOUR!
                </div>
              )}

              {/* Mini Map */}
              {showMiniMaps && (
                <div className="h-28 relative overflow-hidden">
                  <MiniMap lat={pub.lat} lng={pub.lng} name={pub.name} />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#fffdf8] via-transparent to-transparent pointer-events-none"></div>
                </div>
              )}

              {/* Content */}
              <div className={`p-5 ${!showMiniMaps ? 'pt-6' : ''}`}>
                {/* Header Row */}
                <div className="flex justify-between items-start gap-3 mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-lg text-[#3d3529] truncate group-hover:text-[#8b4513] transition-colors">
                      {pub.name}
                    </h3>
                    <p className="text-sm text-[#6b5c4a] truncate">{pub.suburb}</p>
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

                {/* Crowd Badge */}
                <div className="mb-3">
                  <CrowdBadge pubId={String(pub.id)} crowdData={crowdLevels.get(String(pub.id))} />
                </div>

                {/* Address */}
                <p className="text-sm text-[#6b5c4a] mb-2 flex items-start gap-1">
                  <span>📍</span>
                  <span className="flex-1">{pub.address}</span>
                </p>

                {/* Happy Hour */}
                {pub.happyHour && (
                  <p className={`text-sm mb-2 flex items-center gap-1 ${
                    isHappyHour(pub.happyHour) ? 'text-emerald-700 font-semibold' : 'text-[#6b5c4a]'
                  }`}>
                    <span>🕐</span>
                    {pub.happyHour}
                  </p>
                )}

                {/* Description */}
                {pub.description && (
                  <p className="text-sm text-[#6b5c4a] mb-3 line-clamp-2 italic">
                    "{pub.description}"
                  </p>
                )}

                {/* Last Updated Badge */}
                {pub.lastUpdated && (
                  <p className="text-xs text-[#a08b76] mb-2">
                    Updated: {formatLastUpdated(pub.lastUpdated)}
                  </p>
                )}

                {/* Actions Row */}
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#d4a574]/20">
                  {/* Website Link */}
                  {pub.website ? (
                    <a
                      href={pub.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[#8b4513] hover:text-[#a0522d] text-sm font-semibold group/link"
                    >
                      Visit website
                      <span className="group-hover/link:translate-x-1 transition-transform">→</span>
                    </a>
                  ) : <div></div>}
                  
                  {/* Report Crowd Button */}
                  <button
                    onClick={() => setCrowdReporterPub({ id: String(pub.id), name: pub.name })}
                    className="text-xs px-3 py-1.5 bg-[#f5ebe0] hover:bg-[#d4a574]/30 text-[#6b5c4a] rounded-full transition-colors"
                  >
                    How busy? 📊
                  </button>
                </div>
              </div>

              {/* Bottom Gradient Border */}
              <div className={`h-1 bg-gradient-to-r ${getPriceColor(pub.price)}`}></div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredPubs.length === 0 && (
          <div className="text-center py-16 bg-[#fffdf8]/80 rounded-2xl border border-[#d4a574]/20">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-bold text-[#3d3529] mb-2">No pubs found</h3>
            <p className="text-[#6b5c4a]">Try adjusting your filters</p>
          </div>
        )}
      </div>

      {/* Footer - Deep brown */}
      <footer style={{ background: '#2d241c' }} className="text-white py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-[#d4a574]">
            🍺 Perth Pint Prices — Helping you find cheap drinks since 2024
          </p>
          <p className="text-[#a08b76] text-sm mt-2">
            Prices may vary. Always drink responsibly.
          </p>
          <div className="mt-4 pt-4 border-t border-[#3d3529]">
            <a
              href="mailto:perthpintprices@gmail.com?subject=Price%20Correction&body=Hi%20Perth%20Pint%20Prices%2C%0A%0AI%20noticed%20an%20incorrect%20price%20on%20your%20website.%0A%0APub%20Name%3A%20%0ACorrect%20Price%3A%20%0AAdditional%20Details%3A%20%0A%0AThanks!"
              className="inline-flex items-center gap-2 text-[#a08b76] hover:text-[#d4a574] text-sm transition-colors"
            >
              📧 Report Wrong Price
            </a>
            <span className="mx-3 text-[#3d3529]">•</span>
            <button
              onClick={() => setShowSubmitForm(true)}
              className="text-[#a08b76] hover:text-[#d4a574] text-sm transition-colors"
            >
              ➕ Submit a Pub
            </button>
          </div>
        </div>
      </footer>

      {/* Submit Pub Form Modal */}
      <SubmitPubForm isOpen={showSubmitForm} onClose={() => setShowSubmitForm(false)} />

      {/* Crowd Reporter Modal */}
      {crowdReporterPub && (
        <CrowdReporter
          pubId={crowdReporterPub.id}
          pubName={crowdReporterPub.name}
          onClose={() => setCrowdReporterPub(null)}
        />
      )}
    </main>
  )
}
