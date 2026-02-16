'use client'

import { useState, useMemo, useEffect } from 'react'
import dynamic from 'next/dynamic'
import pubs from '@/data/pubs.json'
import { Pub } from '@/types/pub'
import SubmitPubForm from '@/components/SubmitPubForm'
import CrowdReporter from '@/components/CrowdReporter'
import CrowdBadge, { NoCrowdBadge } from '@/components/CrowdBadge'
import { getCrowdLevels, CrowdReport } from '@/lib/supabase'

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
  if (price <= 7) return 'bg-emerald-700'
  if (price <= 8) return 'bg-amber-700'
  if (price <= 9) return 'bg-orange-700'
  return 'bg-red-800'
}

function getPriceTextColor(price: number): string {
  if (price <= 7) return 'text-emerald-800'
  if (price <= 8) return 'text-amber-800'
  if (price <= 9) return 'text-orange-800'
  return 'text-red-800'
}

export default function Home() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSuburb, setSelectedSuburb] = useState('')
  const [maxPrice, setMaxPrice] = useState(15)
  const [sortBy, setSortBy] = useState<'price' | 'name' | 'suburb'>('price')
  const [showHappyHourOnly, setShowHappyHourOnly] = useState(false)
  const [showMiniMaps, setShowMiniMaps] = useState(true)
  const [isSubmitFormOpen, setIsSubmitFormOpen] = useState(false)
  const [crowdReportPub, setCrowdReportPub] = useState<Pub | null>(null)
  const [crowdReports, setCrowdReports] = useState<Record<string, CrowdReport>>({})  
  const [liveCrowdCount, setLiveCrowdCount] = useState(0)

  // Fetch crowd reports using the proper API
  useEffect(() => {
    async function fetchCrowdReports() {
      const reports = await getCrowdLevels()
      setCrowdReports(reports)
      setLiveCrowdCount(Object.keys(reports).length)
    }
    fetchCrowdReports()
    const interval = setInterval(fetchCrowdReports, 60000)
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

  const stats = useMemo(() => ({
    total: typedPubs.length,
    minPrice: Math.min(...typedPubs.map(p => p.price)),
  }), [])

  // Refresh crowd reports after a report is submitted
  const handleCrowdReported = async () => {
    const reports = await getCrowdLevels()
    setCrowdReports(reports)
    setLiveCrowdCount(Object.keys(reports).length)
    setCrowdReportPub(null)
  }

  return (
    <main className="min-h-screen bg-stone-100">
      {/* Clean Vintage Header */}
      <header className="bg-amber-900 text-white">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-4xl">🍺</span>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                  Perth Pint Prices
                </h1>
                <p className="text-amber-200 text-sm">
                  {stats.total} venues · From ${stats.minPrice.toFixed(2)}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {liveCrowdCount > 0 && (
                <span className="px-3 py-1.5 bg-amber-800 rounded-full text-sm font-medium flex items-center gap-1.5">
                  🍻 {liveCrowdCount} live reports
                </span>
              )}
              <button
                onClick={() => setIsSubmitFormOpen(true)}
                className="px-4 py-2 bg-white text-amber-900 rounded-lg font-semibold hover:bg-amber-50 transition-colors text-sm"
              >
                + Submit a Pub
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Filters Card */}
        <div className="bg-white rounded-xl shadow-sm p-5 mb-6 border border-stone-200">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-stone-600 mb-1.5">Search</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search pubs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 border border-stone-300 rounded-lg focus:border-amber-600 focus:ring-2 focus:ring-amber-100 transition-all outline-none text-sm"
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400">🔍</span>
              </div>
            </div>

            {/* Suburb Filter */}
            <div>
              <label className="block text-sm font-medium text-stone-600 mb-1.5">Suburb</label>
              <select
                value={selectedSuburb}
                onChange={(e) => setSelectedSuburb(e.target.value)}
                className="w-full px-3 py-2.5 border border-stone-300 rounded-lg focus:border-amber-600 focus:ring-2 focus:ring-amber-100 transition-all outline-none bg-white text-sm"
              >
                <option value="">All Suburbs</option>
                {suburbs.map(suburb => (
                  <option key={suburb} value={suburb}>{suburb}</option>
                ))}
              </select>
            </div>

            {/* Sort By */}
            <div>
              <label className="block text-sm font-medium text-stone-600 mb-1.5">Sort By</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'price' | 'name' | 'suburb')}
                className="w-full px-3 py-2.5 border border-stone-300 rounded-lg focus:border-amber-600 focus:ring-2 focus:ring-amber-100 transition-all outline-none bg-white text-sm"
              >
                <option value="price">Price (Low to High)</option>
                <option value="name">Name (A-Z)</option>
                <option value="suburb">Suburb</option>
              </select>
            </div>

            {/* Max Price Slider */}
            <div>
              <label className="block text-sm font-medium text-stone-600 mb-1.5">
                Max Price: <span className="text-amber-700 font-semibold">${maxPrice}</span>
              </label>
              <input
                type="range"
                min="6"
                max="15"
                step="0.5"
                value={maxPrice}
                onChange={(e) => setMaxPrice(parseFloat(e.target.value))}
                className="w-full h-2 bg-stone-200 rounded-full appearance-none cursor-pointer accent-amber-700"
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
                className="w-4 h-4 rounded border-stone-300 text-amber-700 focus:ring-amber-600"
              />
              <span className="text-sm text-stone-600">🕐 Happy Hour Now Only</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showMiniMaps}
                onChange={(e) => setShowMiniMaps(e.target.checked)}
                className="w-4 h-4 rounded border-stone-300 text-amber-700 focus:ring-amber-600"
              />
              <span className="text-sm text-stone-600">🗺️ Show Mini Maps</span>
            </label>
          </div>
        </div>

        {/* Results Count */}
        <p className="text-stone-500 text-sm mb-4">
          Showing <span className="text-amber-800 font-semibold">{filteredPubs.length}</span> of {stats.total} venues
        </p>

        {/* Main Map */}
        <div className="mb-6 rounded-xl overflow-hidden shadow-sm border border-stone-200">
          <Map pubs={filteredPubs} isHappyHour={isHappyHour} />
        </div>

        {/* Pub Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPubs.map((pub, index) => {
            const pubReport = crowdReports[String(pub.id)]
            return (
              <div
                key={pub.id}
                className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden hover:shadow-md transition-shadow relative"
              >
                {/* Rank Badge for Top 3 */}
                {index < 3 && sortBy === 'price' && (
                  <div className={`absolute -top-1 -right-1 w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm shadow z-10 ${
                    index === 0 ? 'bg-amber-600' :
                    index === 1 ? 'bg-stone-500' :
                    'bg-amber-800'
                  }`}>
                    #{index + 1}
                  </div>
                )}

                {/* Happy Hour Now Badge */}
                {isHappyHour(pub.happyHour) && (
                  <div className="absolute top-2 left-2 px-2 py-1 bg-emerald-700 text-white text-xs font-semibold rounded-full z-10">
                    🍻 HAPPY HOUR
                  </div>
                )}

                {/* Mini Map */}
                {showMiniMaps && (
                  <div className="h-24 relative overflow-hidden">
                    <MiniMap lat={pub.lat} lng={pub.lng} name={pub.name} />
                  </div>
                )}

                {/* Content */}
                <div className="p-4">
                  {/* Header Row */}
                  <div className="flex justify-between items-start gap-2 mb-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-stone-900 truncate">
                        {pub.name}
                      </h3>
                      <p className="text-xs text-stone-500">{pub.suburb}</p>
                    </div>
                    <div className={`text-xl font-bold ${getPriceTextColor(pub.price)}`}>
                      ${pub.price.toFixed(2)}
                    </div>
                  </div>

                  {/* Beer Type Badge */}
                  <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium text-white mb-2 ${getPriceColor(pub.price)}`}>
                    🍺 {pub.beerType}
                  </div>

                  {/* Crowd Badge */}
                  <div className="mb-2">
                    {pubReport ? (
                      <CrowdBadge 
                        report={pubReport}
                        onClick={() => setCrowdReportPub(pub)}
                      />
                    ) : (
                      <NoCrowdBadge onClick={() => setCrowdReportPub(pub)} />
                    )}
                  </div>

                  {/* Address */}
                  <p className="text-xs text-stone-500 mb-1.5 flex items-start gap-1">
                    <span>📍</span>
                    <span className="flex-1 line-clamp-1">{pub.address}</span>
                  </p>

                  {/* Happy Hour */}
                  {pub.happyHour && (
                    <p className={`text-xs mb-1.5 flex items-center gap-1 ${
                      isHappyHour(pub.happyHour) ? 'text-emerald-700 font-medium' : 'text-stone-500'
                    }`}>
                      🕐 {pub.happyHour}
                    </p>
                  )}

                  {/* Last Updated */}
                  {pub.lastUpdated && (
                    <p className="text-xs text-stone-400 mb-2">
                      Updated: {new Date(pub.lastUpdated).toLocaleDateString('en-AU', { month: 'short', year: 'numeric' })}
                    </p>
                  )}

                  {/* Website Link */}
                  {pub.website && (
                    <div className="mt-3 pt-3 border-t border-stone-100">
                      <a
                        href={pub.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-amber-700 hover:text-amber-800 text-xs font-medium"
                      >
                        Visit website →
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Empty State */}
        {filteredPubs.length === 0 && (
          <div className="text-center py-12 bg-white rounded-xl border border-stone-200">
            <div className="text-5xl mb-3">🔍</div>
            <h3 className="text-lg font-semibold text-stone-700 mb-1">No pubs found</h3>
            <p className="text-stone-500 text-sm">Try adjusting your filters</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-stone-800 text-white py-6 mt-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-center md:text-left">
              <p className="text-stone-300 text-sm">
                🍺 Perth Pint Prices — Finding cheap drinks since 2024
              </p>
              <p className="text-stone-500 text-xs mt-1">
                Prices may vary. Always drink responsibly.
              </p>
            </div>
            <a
              href="mailto:perthpintprices@gmail.com?subject=Price%20Correction&body=Hi%2C%20I%20noticed%20a%20wrong%20price%20on%20the%20site.%0A%0APub%20name%3A%20%0ACorrect%20price%3A%20%0ADetails%3A%20"
              className="px-4 py-2 bg-stone-700 hover:bg-stone-600 rounded-lg text-sm text-stone-300 transition-colors"
            >
              Report Wrong Price
            </a>
          </div>
        </div>
      </footer>

      {/* Submit Pub Form Modal */}
      <SubmitPubForm isOpen={isSubmitFormOpen} onClose={() => setIsSubmitFormOpen(false)} />

      {/* Crowd Reporter Modal */}
      {crowdReportPub && (
        <CrowdReporter
          pubId={String(crowdReportPub.id)}
          pubName={crowdReportPub.name}
          onClose={() => setCrowdReportPub(null)}
          onReport={handleCrowdReported}
        />
      )}
    </main>
  )
}
