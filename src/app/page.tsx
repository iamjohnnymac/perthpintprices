'use client'

import { useState, useMemo, useEffect } from 'react'
import dynamic from 'next/dynamic'
import pubs from '@/data/pubs.json'
import { Pub } from '@/types/pub'
import SubmitPubForm from '@/components/SubmitPubForm'
import CrowdBadge from '@/components/CrowdBadge'
import CrowdReporter from '@/components/CrowdReporter'
import { getCrowdLevels, CrowdReport, CROWD_LEVELS } from '@/lib/supabase'
import { getHappyHourStatus } from '@/lib/happyHour'

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
  const status = getHappyHourStatus(happyHour)
  return status.isActive
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

function getPriceTextColor(price: number): string {
  if (price <= 7) return 'text-green-700'
  if (price <= 8) return 'text-yellow-700'
  if (price <= 9) return 'text-orange-700'
  return 'text-red-700'
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
  const [crowdReports, setCrowdReports] = useState<Record<string, CrowdReport>>({})
  const [crowdReportPub, setCrowdReportPub] = useState<Pub | null>(null)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [viewMode, setViewMode] = useState<'cards' | 'list'>('cards')
  const [showMoreFilters, setShowMoreFilters] = useState(false)

  // Update time every minute for countdown displays
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 60000)
    return () => clearInterval(interval)
  }, [])

  // Fetch crowd reports
  useEffect(() => {
    fetchCrowdReports()
    const interval = setInterval(fetchCrowdReports, 60000)
    return () => clearInterval(interval)
  }, [])

  async function fetchCrowdReports() {
    const reports = await getCrowdLevels()
    setCrowdReports(reports)
  }

  function getLatestCrowdReport(pubId: number): CrowdReport | undefined {
    return crowdReports[String(pubId)]
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
  }), [currentTime])

  const liveCrowdCount = Object.keys(crowdReports).length
  const activeFilterCount = (selectedSuburb ? 1 : 0) + (maxPrice < 15 ? 1 : 0) + (sortBy !== 'price' ? 1 : 0)

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
        {/* FILTERS - Cleaner Layout */}
        <div className="bg-white rounded-xl shadow-md p-4 mb-6 border border-stone-200">
          {/* Row 1: View Toggle + Search + Suburb */}
          <div className="flex flex-col sm:flex-row gap-3">
            {/* View Toggle - First and Prominent */}
            <div className="flex bg-stone-100 rounded-lg p-1 self-start">
              <button
                onClick={() => setViewMode('cards')}
                className={`px-4 py-2 rounded-md text-sm font-semibold transition-all ${
                  viewMode === 'cards'
                    ? 'bg-amber-700 text-white shadow-sm'
                    : 'text-stone-600 hover:text-stone-800'
                }`}
              >
                🃏 Cards
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-4 py-2 rounded-md text-sm font-semibold transition-all ${
                  viewMode === 'list'
                    ? 'bg-amber-700 text-white shadow-sm'
                    : 'text-stone-600 hover:text-stone-800'
                }`}
              >
                📋 List
              </button>
            </div>

            {/* Search */}
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Search pubs or suburbs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-stone-200 rounded-lg focus:border-amber-600 focus:ring-2 focus:ring-amber-100 transition-all outline-none bg-stone-50"
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400">🔍</span>
            </div>

            {/* Suburb Dropdown */}
            <select
              value={selectedSuburb}
              onChange={(e) => setSelectedSuburb(e.target.value)}
              className="px-4 py-2.5 border border-stone-200 rounded-lg focus:border-amber-600 focus:ring-2 focus:ring-amber-100 transition-all outline-none bg-stone-50 text-stone-700 min-w-[160px]"
            >
              <option value="">All Suburbs</option>
              {suburbs.map(suburb => (
                <option key={suburb} value={suburb}>{suburb}</option>
              ))}
            </select>
          </div>

          {/* Row 2: Toggle Pills + More Filters */}
          <div className="flex flex-wrap items-center gap-2 mt-3">
            {/* Happy Hour Toggle Pill */}
            <button
              onClick={() => setShowHappyHourOnly(!showHappyHourOnly)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                showHappyHourOnly
                  ? 'bg-green-600 text-white'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              🕐 Happy Hour Now {showHappyHourOnly && '✓'}
            </button>

            {/* Mini Maps Toggle Pill - Only in Cards view */}
            {viewMode === 'cards' && (
              <button
                onClick={() => setShowMiniMaps(!showMiniMaps)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                  showMiniMaps
                    ? 'bg-amber-600 text-white'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                🗺️ Mini Maps {showMiniMaps && '✓'}
              </button>
            )}

            {/* More Filters Button */}
            <button
              onClick={() => setShowMoreFilters(!showMoreFilters)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ml-auto ${
                showMoreFilters || activeFilterCount > 0
                  ? 'bg-stone-700 text-white'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              ⚙️ More Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
              <span className={`ml-1 transition-transform inline-block ${showMoreFilters ? 'rotate-180' : ''}`}>▼</span>
            </button>
          </div>

          {/* Collapsible More Filters */}
          {showMoreFilters && (
            <div className="mt-4 pt-4 border-t border-stone-100 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Sort By */}
              <div>
                <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1.5">Sort By</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'price' | 'name' | 'suburb')}
                  className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:border-amber-600 focus:ring-2 focus:ring-amber-100 transition-all outline-none bg-white text-sm"
                >
                  <option value="price">Price (Low to High)</option>
                  <option value="name">Name (A-Z)</option>
                  <option value="suburb">Suburb</option>
                </select>
              </div>

              {/* Max Price */}
              <div>
                <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1.5">
                  Max Price: <span className="text-amber-700">${maxPrice}</span>
                </label>
                <input
                  type="range"
                  min="6"
                  max="15"
                  step="0.5"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(parseFloat(e.target.value))}
                  className="w-full h-2 bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 rounded-full appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-stone-400 mt-1">
                  <span>$6</span>
                  <span>$15</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Results Count */}
        <p className="text-stone-600 text-sm mb-4">
          Showing <span className="text-amber-700 font-semibold">{filteredPubs.length}</span> of {stats.total} venues
        </p>

        {/* Main Map */}
        <div className="mb-6 rounded-xl overflow-hidden shadow-lg border border-stone-200">
          <Map pubs={filteredPubs} isHappyHour={isHappyHour} />
        </div>

        {/* LIST VIEW */}
        {viewMode === 'list' && (
          <div className="bg-white rounded-xl shadow-md border border-stone-200 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-stone-50 border-b border-stone-200">
                  <th className="text-left py-3 px-4 text-xs font-semibold text-stone-600 uppercase tracking-wide">Pub</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-stone-600 uppercase tracking-wide hidden sm:table-cell">Suburb</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-stone-600 uppercase tracking-wide">Beer</th>
                  <th className="text-right py-3 px-4 text-xs font-semibold text-stone-600 uppercase tracking-wide">Price</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-stone-600 uppercase tracking-wide hidden md:table-cell">Happy Hour</th>
                  <th className="text-center py-3 px-4 text-xs font-semibold text-stone-600 uppercase tracking-wide">Crowd</th>
                </tr>
              </thead>
              <tbody>
                {filteredPubs.map((pub, index) => {
                  const crowdReport = getLatestCrowdReport(pub.id)
                  const happyHourStatus = getHappyHourStatus(pub.happyHour)
                  return (
                    <tr 
                      key={pub.id} 
                      className={`border-b border-stone-100 hover:bg-amber-50/50 transition-colors ${
                        index % 2 === 0 ? 'bg-white' : 'bg-stone-50/30'
                      }`}
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          {index < 3 && sortBy === 'price' && (
                            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                              index === 0 ? 'bg-yellow-500' :
                              index === 1 ? 'bg-stone-400' :
                              'bg-amber-700'
                            }`}>
                              {index + 1}
                            </span>
                          )}
                          <div>
                            <p className="font-semibold text-stone-900 text-sm">{pub.name}</p>
                            <p className="text-xs text-stone-500 sm:hidden">{pub.suburb}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-stone-600 hidden sm:table-cell">
                        {pub.suburb}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium text-white ${getPriceBgColor(pub.price)}`}>
                          🍺 {pub.beerType}
                        </span>
                      </td>
                      <td className={`py-3 px-4 text-right font-bold text-lg ${getPriceTextColor(pub.price)}`}>
                        ${pub.price.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 hidden md:table-cell">
                        {pub.happyHour ? (
                          <span className={`text-xs ${
                            happyHourStatus.isActive ? 'text-green-600 font-bold' : 
                            happyHourStatus.isToday ? 'text-amber-600 font-semibold' : 
                            'text-stone-500'
                          }`}>
                            {happyHourStatus.statusEmoji} {happyHourStatus.statusText}
                          </span>
                        ) : (
                          <span className="text-xs text-stone-400">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {crowdReport ? (
                          <span className="text-sm" title={`${crowdReport.minutes_ago}m ago`}>
                            {CROWD_LEVELS[crowdReport.crowd_level].emoji}
                          </span>
                        ) : (
                          <button
                            onClick={() => setCrowdReportPub(pub)}
                            className="text-xs text-stone-400 hover:text-amber-600"
                          >
                            Report
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* CARD VIEW */}
        {viewMode === 'cards' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredPubs.map((pub, index) => {
              const crowdReport = getLatestCrowdReport(pub.id)
              const happyHourStatus = getHappyHourStatus(pub.happyHour)
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

                  {/* Happy Hour NOW Badge */}
                  {happyHourStatus.isActive && (
                    <div className="absolute top-2 left-2 px-2 py-1 bg-green-600 text-white text-xs font-bold rounded-full shadow z-10 animate-pulse">
                      🎉 HAPPY HOUR!
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

                    {/* Happy Hour Status with Countdown */}
                    {pub.happyHour && (
                      <div className={`text-xs mb-1.5 flex items-center gap-1 ${
                        happyHourStatus.isActive ? 'text-green-600 font-bold' : 
                        happyHourStatus.isToday ? 'text-amber-600 font-semibold' : 
                        'text-stone-500'
                      }`}>
                        <span>{happyHourStatus.statusEmoji}</span>
                        <span>{happyHourStatus.statusText}</span>
                        {happyHourStatus.countdown && happyHourStatus.isActive && (
                          <span className="text-green-500 font-normal">• {happyHourStatus.countdown}</span>
                        )}
                      </div>
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
        )}

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
      <footer className="bg-stone-800 text-white py-8 mt-8">
        <div className="max-w-7xl mx-auto px-4">
          {/* Glass Size Legend */}
          <div className="flex flex-wrap justify-center gap-6 mb-6 pb-6 border-b border-stone-700">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🍺</span>
              <div>
                <p className="font-semibold text-stone-200">Schooner</p>
                <p className="text-xs text-stone-400">425ml</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">🍺</span>
              <div>
                <p className="font-semibold text-amber-400">Pint</p>
                <p className="text-xs text-stone-400">570ml</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">🍾</span>
              <div>
                <p className="font-semibold text-stone-200">Long Neck</p>
                <p className="text-xs text-stone-400">750ml</p>
              </div>
            </div>
          </div>

          {/* Footer Text */}
          <div className="text-center">
            <p className="text-stone-300 text-sm">🍺 Perth Pint Prices — Helping you find cheap drinks since 2024</p>
            <p className="text-stone-500 text-xs mt-1">Prices may vary. Pint prices shown. Always drink responsibly.</p>
            <a
              href="mailto:perthpintprices@gmail.com?subject=Price%20Correction&body=Hi%2C%20I%20noticed%20a%20wrong%20price%20on%20the%20site.%0A%0APub%20name%3A%20%0ACorrect%20price%3A%20%0ADetails%3A%20"
              className="inline-block mt-3 text-amber-400 hover:text-amber-300 text-xs"
            >
              Report Wrong Price
            </a>
          </div>
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
