'use client'

import { useState, useMemo, useEffect } from 'react'
import dynamic from 'next/dynamic'
import pubs from '@/data/pubs.json'
import { Pub } from '@/types/pub'
import SubmitPubForm from '@/components/SubmitPubForm'
import CrowdBadge from '@/components/CrowdBadge'
import CrowdReporter from '@/components/CrowdReporter'
import { supabase, CrowdReport } from '@/lib/supabase'

const Map = dynamic(() => import('@/components/Map'), {
  ssr: false,
  loading: () => (
    <div className="h-[400px] bg-stone-100 rounded-xl flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-12 h-12 border-4 border-amber-700 border-t-transparent rounded-full animate-spin"></div>
        <span className="text-amber-800 font-medium">Loading map...</span>
      </div>
    </div>
  )
})

const MiniMap = dynamic(() => import('@/components/MiniMap'), {
  ssr: false,
  loading: () => <div className="h-24 bg-stone-200 rounded-lg animate-pulse"></div>
})

const typedPubs: Pub[] = pubs as Pub[]

function isHappyHour(happyHour: string | null | undefined): boolean {
  if (!happyHour) return false
  const now = new Date()
  const currentDay = now.toLocaleDateString('en-US', { weekday: 'short' })
  const currentHour = now.getHours()
  const hhLower = happyHour.toLowerCase()
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
  const timeMatch = happyHour.match(/(\d{1,2})[-–](\d{1,2})(pm)?/i)
  if (!timeMatch) return false
  let startHour = parseInt(timeMatch[1])
  let endHour = parseInt(timeMatch[2])
  if (startHour < 12 && (hhLower.includes('pm') || startHour < 6)) startHour += 12
  if (endHour < 12 && (hhLower.includes('pm') || endHour <= 8)) endHour += 12
  return currentHour >= startHour && currentHour < endHour
}

function getPriceColor(price: number): string {
  if (price <= 7) return 'from-green-600 to-green-700'
  if (price <= 8) return 'from-yellow-600 to-yellow-700'
  if (price <= 9) return 'from-orange-600 to-orange-700'
  return 'from-red-600 to-red-700'
}

function getPriceBgColor(price: number): string {
  if (price <= 7) return 'bg-green-700'
  if (price <= 8) return 'bg-yellow-700'
  if (price <= 9) return 'bg-orange-700'
  return 'bg-red-700'
}

function formatLastUpdated(dateStr: string | undefined): string {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-AU', { month: 'short', year: 'numeric' })
}

export default function Home() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSuburb, setSelectedSuburb] = useState('')
  const [maxPrice, setMaxPrice] = useState(15)
  const [sortBy, setSortBy] = useState<'price' | 'name' | 'suburb'>('price')
  const [showHappyHourOnly, setShowHappyHourOnly] = useState(false)
  const [showMiniMaps, setShowMiniMaps] = useState(true)
  const [showSubmitForm, setShowSubmitForm] = useState(false)
  const [crowdReports, setCrowdReports] = useState<CrowdReport[]>([])
  const [crowdReportPub, setCrowdReportPub] = useState<Pub | null>(null)

  // Fetch crowd reports
  useEffect(() => {
    fetchCrowdReports()
    const interval = setInterval(fetchCrowdReports, 60000)
    return () => clearInterval(interval)
  }, [])

  async function fetchCrowdReports() {
    const now = new Date().toISOString()
    const { data, error } = await supabase
      .from('crowd_reports')
      .select('*')
      .gt('expires_at', now)
      .order('reported_at', { ascending: false })
    if (!error && data) {
      setCrowdReports(data)
    }
  }

  function getLatestCrowdReport(pubId: number): CrowdReport | undefined {
    return crowdReports.find(r => r.pub_id === String(pubId))
  }

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

  const liveCrowdCount = crowdReports.length

  return (
    <main className="min-h-screen bg-stone-100">
      {/* Header - Flat vintage rust color */}
      <header className="bg-amber-800 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-5xl">🍺</span>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Perth Pint Prices</h1>
                <p className="text-amber-200 text-sm mt-0.5">Find the cheapest pints in Perth, WA</p>
              </div>
            </div>
            <button
              onClick={() => setShowSubmitForm(true)}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg font-medium transition-colors text-sm"
            >
              + Submit a Pub
            </button>
          </div>

          {/* Stats - simpler pills */}
          <div className="flex flex-wrap gap-2 mt-4">
            <span className="px-3 py-1.5 bg-white/15 rounded-full text-sm font-medium">
              📊 {stats.total} venues
            </span>
            <span className="px-3 py-1.5 bg-white/15 rounded-full text-sm font-medium">
              💰 From ${stats.minPrice.toFixed(2)}
            </span>
            {liveCrowdCount > 0 && (
              <span className="px-3 py-1.5 bg-green-600/80 rounded-full text-sm font-medium">
                📡 {liveCrowdCount} live crowd report{liveCrowdCount !== 1 ? 's' : ''}
              </span>
            )}
            {stats.happyHourNow > 0 && (
              <span className="px-3 py-1.5 bg-green-600/80 rounded-full text-sm font-medium animate-pulse">
                🍻 {stats.happyHourNow} happy hours NOW!
              </span>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Filters Card */}
        <div className="bg-white rounded-xl shadow-md p-5 mb-6 border border-stone-200">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1.5">Search</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search pubs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 border border-stone-300 rounded-lg focus:border-amber-600 focus:ring-2 focus:ring-amber-100 transition-all outline-none"
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400">🔍</span>
              </div>
            </div>

            {/* Suburb Filter */}
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1.5">Suburb</label>
              <select
                value={selectedSuburb}
                onChange={(e) => setSelectedSuburb(e.target.value)}
                className="w-full px-4 py-2.5 border border-stone-300 rounded-lg focus:border-amber-600 focus:ring-2 focus:ring-amber-100 transition-all outline-none bg-white"
              >
                <option value="">All Suburbs</option>
                {suburbs.map(suburb => (
                  <option key={suburb} value={suburb}>{suburb}</option>
                ))}
              </select>
            </div>

            {/* Sort By */}
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1.5">Sort By</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'price' | 'name' | 'suburb')}
                className="w-full px-4 py-2.5 border border-stone-300 rounded-lg focus:border-amber-600 focus:ring-2 focus:ring-amber-100 transition-all outline-none bg-white"
              >
                <option value="price">Price (Low to High)</option>
                <option value="name">Name (A-Z)</option>
                <option value="suburb">Suburb</option>
              </select>
            </div>

            {/* Max Price Slider */}
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1.5">
                Max Price: <span className="text-amber-700 font-bold">${maxPrice}</span>
              </label>
              <input
                type="range"
                min="6"
                max="15"
                step="0.5"
                value={maxPrice}
                onChange={(e) => setMaxPrice(parseFloat(e.target.value))}
                className="w-full h-2 bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 rounded-full appearance-none cursor-pointer mt-2"
              />
            </div>
          </div>

          {/* Toggle Filters */}
          <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-stone-100">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showHappyHourOnly}
                onChange={(e) => setShowHappyHourOnly(e.target.checked)}
                className="w-4 h-4 rounded border-stone-300 text-amber-600 focus:ring-amber-500"
              />
              <span className="text-stone-700 text-sm">🕐 Happy Hour Now Only</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showMiniMaps}
                onChange={(e) => setShowMiniMaps(e.target.checked)}
                className="w-4 h-4 rounded border-stone-300 text-amber-600 focus:ring-amber-500"
              />
              <span className="text-stone-700 text-sm">🗺️ Show Mini Maps</span>
            </label>
          </div>
        </div>

        {/* Results Count */}
        <p className="text-stone-600 text-sm mb-4">
          Showing <span className="text-amber-700 font-semibold">{filteredPubs.length}</span> of {stats.total} venues
        </p>

        {/* Main Map */}
        <div className="mb-6 rounded-xl overflow-hidden shadow-lg border border-stone-200">
          <Map pubs={filteredPubs} isHappyHour={isHappyHour} />
        </div>

        {/* Pub Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredPubs.map((pub, index) => {
            const crowdReport = getLatestCrowdReport(pub.id)
            return (
              <div
                key={pub.id}
                className="group relative bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-200 overflow-hidden border border-stone-200"
              >
                {/* Rank Badge for Top 3 */}
                {index < 3 && sortBy === 'price' && (
                  <div className={`absolute -top-1 -right-1 w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md z-10 ${
                    index === 0 ? 'bg-yellow-500' :
                    index === 1 ? 'bg-stone-400' :
                    'bg-amber-700'
                  }`}>
                    #{index + 1}
                  </div>
                )}

                {/* Happy Hour Now Badge */}
                {isHappyHour(pub.happyHour) && (
                  <div className="absolute top-2 left-2 px-2 py-1 bg-green-600 text-white text-xs font-bold rounded-full shadow z-10">
                    🍻 HAPPY HOUR!
                  </div>
                )}

                {/* Mini Map */}
                {showMiniMaps && (
                  <div className="h-24 relative overflow-hidden">
                    <MiniMap lat={pub.lat} lng={pub.lng} name={pub.name} />
                    <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent pointer-events-none"></div>
                  </div>
                )}

                {/* Content */}
                <div className={`p-4 ${!showMiniMaps ? 'pt-5' : ''}`}>
                  {/* Header Row */}
                  <div className="flex justify-between items-start gap-2 mb-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-stone-900 truncate">{pub.name}</h3>
                      <p className="text-xs text-stone-500">{pub.suburb}</p>
                    </div>
                    <div className={`text-xl font-bold bg-gradient-to-br ${getPriceColor(pub.price)} bg-clip-text text-transparent`}>
                      ${pub.price.toFixed(2)}
                    </div>
                  </div>

                  {/* Crowd Badge - only render if report exists */}
                  {crowdReport && <CrowdBadge report={crowdReport} />}

                  {/* Beer Type Badge */}
                  <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold text-white mb-2 ${getPriceBgColor(pub.price)}`}>
                    🍺 {pub.beerType}
                  </div>

                  {/* Address */}
                  <p className="text-xs text-stone-600 mb-1.5">📍 {pub.address}</p>

                  {/* Happy Hour */}
                  {pub.happyHour && (
                    <p className={`text-xs mb-1.5 ${isHappyHour(pub.happyHour) ? 'text-green-600 font-semibold' : 'text-stone-500'}`}>
                      🕐 {pub.happyHour}
                    </p>
                  )}

                  {/* Description */}
                  {pub.description && (
                    <p className="text-xs text-stone-500 mb-2 line-clamp-2 italic">"{pub.description}"</p>
                  )}

                  {/* Last Updated */}
                  {pub.lastUpdated && (
                    <p className="text-xs text-stone-400 mb-2">Updated: {formatLastUpdated(pub.lastUpdated)}</p>
                  )}

                  {/* Action Buttons */}
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-stone-100">
                    {pub.website && (
                      <a
                        href={pub.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-amber-700 hover:text-amber-800 text-xs font-semibold"
                      >
                        Visit website →
                      </a>
                    )}
                    <button
                      onClick={() => setCrowdReportPub(pub)}
                      className="px-2.5 py-1 bg-stone-100 hover:bg-stone-200 rounded-lg text-xs font-medium text-stone-700 transition-colors ml-auto"
                    >
                      How busy?
                    </button>
                  </div>
                </div>

                {/* Bottom color bar */}
                <div className={`h-1 bg-gradient-to-r ${getPriceColor(pub.price)}`}></div>
              </div>
            )
          })}
        </div>

        {/* Empty State */}
        {filteredPubs.length === 0 && (
          <div className="text-center py-12 bg-white rounded-xl border border-stone-200">
            <div className="text-5xl mb-3">🔍</div>
            <h3 className="text-lg font-bold text-stone-700 mb-1">No pubs found</h3>
            <p className="text-stone-500 text-sm">Try adjusting your filters</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-stone-800 text-white py-6 mt-8">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-stone-300 text-sm">🍺 Perth Pint Prices — Helping you find cheap drinks since 2024</p>
          <p className="text-stone-500 text-xs mt-1">Prices may vary. Always drink responsibly.</p>
          <a
            href="mailto:perthpintprices@gmail.com?subject=Price%20Correction&body=Hi%2C%20I%20noticed%20a%20wrong%20price%20on%20the%20site.%0A%0APub%20name%3A%20%0ACorrect%20price%3A%20%0ADetails%3A%20"
            className="inline-block mt-3 text-amber-400 hover:text-amber-300 text-xs"
          >
            Report Wrong Price
          </a>
        </div>
      </footer>

      {/* Submit Pub Form Modal */}
      <SubmitPubForm isOpen={showSubmitForm} onClose={() => setShowSubmitForm(false)} />

      {/* Crowd Reporter Modal */}
      {crowdReportPub && (
        <CrowdReporter
          pubId={String(crowdReportPub.id)}
          pubName={crowdReportPub.name}
          onClose={() => setCrowdReportPub(null)}
          onReport={() => {
            setCrowdReportPub(null)
            fetchCrowdReports()
          }}
        />
      )}
    </main>
  )
}
