'use client'

import { useState, useMemo, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { Pub } from '@/types/pub'
import SubmitPubForm from '@/components/SubmitPubForm'
import CrowdBadge from '@/components/CrowdBadge'
import CrowdReporter from '@/components/CrowdReporter'
import { FilterSection } from '@/components/FilterSection'
import { getCrowdLevels, CrowdReport, CROWD_LEVELS, getPubs } from '@/lib/supabase'
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


function getDirectionsUrl(pub: Pub): string {
  const query = encodeURIComponent(`${pub.name}, ${pub.address}`)
  return `https://www.google.com/maps/dir/?api=1&destination=${query}`
}

function formatLastUpdated(dateStr: string | undefined): string {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-AU', { month: 'short', year: 'numeric' })
}

export default function Home() {
  const [pubs, setPubs] = useState<Pub[]>([])
  const [isLoading, setIsLoading] = useState(true)
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
  const [viewMode, setViewMode] = useState<'cards' | 'list'>('list')
  const [showMoreFilters, setShowMoreFilters] = useState(false)

  useEffect(() => {
    async function loadPubs() {
      const data = await getPubs()
      setPubs(data)
      setIsLoading(false)
    }
    loadPubs()
  }, [])

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 60000)
    return () => clearInterval(interval)
  }, [])

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
    const suburbSet = new Set(pubs.map(pub => pub.suburb))
    return Array.from(suburbSet).sort()
  }, [pubs])

  const filteredPubs = useMemo(() => {
    return pubs
      .filter(pub => {
        const matchesSearch =
          pub.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          pub.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (pub.description?.toLowerCase() || '').includes(searchTerm.toLowerCase())
        const matchesSuburb = !selectedSuburb || selectedSuburb === 'all' || pub.suburb === selectedSuburb
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
  }, [pubs, searchTerm, selectedSuburb, maxPrice, sortBy, showHappyHourOnly])

  const stats = useMemo(() => {
    if (pubs.length === 0) return { total: 0, minPrice: 0, maxPriceValue: 0, avgPrice: '0', happyHourNow: 0 }
    return {
      total: pubs.length,
      minPrice: Math.min(...pubs.map(p => p.price)),
      maxPriceValue: Math.max(...pubs.map(p => p.price)),
      avgPrice: (pubs.reduce((sum, p) => sum + p.price, 0) / pubs.length).toFixed(2),
      happyHourNow: pubs.filter(p => isHappyHour(p.happyHour)).length
    }
  }, [pubs, currentTime])

  const liveCrowdCount = Object.keys(crowdReports).length

  if (isLoading) {
    return (
      <main className="min-h-screen bg-stone-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-16 h-16 border-4 border-amber-700 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-amber-800 font-medium text-lg">Loading pubs...</span>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-stone-100">
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
        <FilterSection
          viewMode={viewMode}
          setViewMode={setViewMode}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          selectedSuburb={selectedSuburb}
          setSelectedSuburb={setSelectedSuburb}
          suburbs={suburbs}
          showHappyHourOnly={showHappyHourOnly}
          setShowHappyHourOnly={setShowHappyHourOnly}
          showMiniMaps={showMiniMaps}
          setShowMiniMaps={setShowMiniMaps}
          sortBy={sortBy}
          setSortBy={setSortBy}
          maxPrice={maxPrice}
          setMaxPrice={setMaxPrice}
          showMoreFilters={showMoreFilters}
          setShowMoreFilters={setShowMoreFilters}
          stats={stats}
        />

        <p className="text-stone-600 text-sm mb-4">
          Showing <span className="text-amber-700 font-semibold">{filteredPubs.length}</span> of {stats.total} venues
        </p>

        <div className="mb-6 rounded-xl overflow-hidden shadow-lg border border-stone-200">
          <Map pubs={filteredPubs} isHappyHour={isHappyHour} />
        </div>

        {viewMode === 'list' && (
          <div className="bg-white rounded-xl shadow-md border border-stone-200 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-stone-50 border-b border-stone-200">
                  <th className="text-left py-3 px-4 text-xs font-semibold text-stone-600 uppercase tracking-wide">Pub</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-stone-600 uppercase tracking-wide hidden sm:table-cell">Suburb</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-stone-600 uppercase tracking-wide hidden sm:table-cell">Beer</th>
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
                      <td className="py-3 px-2 sm:px-4">
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
                            <div className="flex items-center gap-1.5">
                              <a 
                                href={getDirectionsUrl(pub)}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="flex-shrink-0 hover:scale-110 transition-transform"
                                title="Get directions in Google Maps"
                              >
                                <svg className="w-5 h-5" viewBox="0 0 92.3 132.3" fill="none">
                                  <path fill="#1a73e8" d="M60.2 2.2C55.8.8 51 0 46.1 0 32 0 19.3 6.4 10.8 16.5l21.8 18.3L60.2 2.2z"/>
                                  <path fill="#ea4335" d="M10.8 16.5C4.1 24.5 0 34.9 0 46.1c0 8.7 1.7 15.7 4.6 22l28-33.3-21.8-18.3z"/>
                                  <path fill="#4285f4" d="M46.1 28.5c9.8 0 17.7 7.9 17.7 17.7 0 4.3-1.6 8.3-4.2 11.4 0 0 13.9-16.6 27.5-32.7-5.6-10.8-15.3-19-27-22.7L32.6 34.8c3.7-3.9 8.8-6.3 13.5-6.3z"/>
                                  <path fill="#fbbc04" d="M46.1 63.5c-9.8 0-17.7-7.9-17.7-17.7 0-4.3 1.6-8.3 4.2-11.4L4.6 68.1C11.3 81.8 24.8 99.7 46.1 132.3c6.7-10.2 12.7-19.1 17.9-27.1L46.1 63.5z"/>
                                  <path fill="#34a853" d="M59.6 57.6c2.6-3.1 4.2-7.1 4.2-11.4 0-9.8-7.9-17.7-17.7-17.7-4.7 0-9.8 2.4-13.5 6.3L64 105.2c14.5-23.3 23.2-40.5 23.2-59.1 0-5.8-.8-11.3-2.4-16.4L59.6 57.6z"/>
                                </svg>
                              </a>
                              <p className="font-semibold text-stone-900 text-sm">{pub.name}</p>
                            </div>
                            <p className="text-xs text-stone-500 sm:hidden">{pub.suburb}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-stone-600 hidden sm:table-cell">
                        {pub.suburb}
                      </td>
                      <td className="py-3 px-4 hidden sm:table-cell">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium text-white ${getPriceBgColor(pub.price)}`}>
                          🍺 {pub.beerType}
                        </span>
                      </td>
                      <td className={`py-3 px-2 sm:px-4 text-right font-bold text-lg whitespace-nowrap ${getPriceTextColor(pub.price)}`}>
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
                  {index < 3 && sortBy === 'price' && (
                    <div className={`absolute -top-1 -right-1 w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md z-10 ${
                      index === 0 ? 'bg-yellow-500' :
                      index === 1 ? 'bg-stone-400' :
                      'bg-amber-700'
                    }`}>
                      #{index + 1}
                    </div>
                  )}

                  {happyHourStatus.isActive && (
                    <div className="absolute top-2 left-2 px-2 py-1 bg-green-600 text-white text-xs font-bold rounded-full shadow z-10 animate-pulse">
                      🎉 HAPPY HOUR!
                    </div>
                  )}

                  {showMiniMaps && (
                    <div className="h-24 relative overflow-hidden">
                      <MiniMap lat={pub.lat} lng={pub.lng} name={pub.name} />
                      <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent pointer-events-none"></div>
                    </div>
                  )}

                  <div className={`p-4 ${!showMiniMaps ? 'pt-5' : ''}`}>
                    <div className="flex justify-between items-start gap-2 mb-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <a 
                            href={getDirectionsUrl(pub)}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="flex-shrink-0 hover:scale-110 transition-transform"
                            title="Get directions in Google Maps"
                          >
                            <svg className="w-5 h-5" viewBox="0 0 92.3 132.3" fill="none">
                              <path fill="#1a73e8" d="M60.2 2.2C55.8.8 51 0 46.1 0 32 0 19.3 6.4 10.8 16.5l21.8 18.3L60.2 2.2z"/>
                              <path fill="#ea4335" d="M10.8 16.5C4.1 24.5 0 34.9 0 46.1c0 8.7 1.7 15.7 4.6 22l28-33.3-21.8-18.3z"/>
                              <path fill="#4285f4" d="M46.1 28.5c9.8 0 17.7 7.9 17.7 17.7 0 4.3-1.6 8.3-4.2 11.4 0 0 13.9-16.6 27.5-32.7-5.6-10.8-15.3-19-27-22.7L32.6 34.8c3.7-3.9 8.8-6.3 13.5-6.3z"/>
                              <path fill="#fbbc04" d="M46.1 63.5c-9.8 0-17.7-7.9-17.7-17.7 0-4.3 1.6-8.3 4.2-11.4L4.6 68.1C11.3 81.8 24.8 99.7 46.1 132.3c6.7-10.2 12.7-19.1 17.9-27.1L46.1 63.5z"/>
                              <path fill="#34a853" d="M59.6 57.6c2.6-3.1 4.2-7.1 4.2-11.4 0-9.8-7.9-17.7-17.7-17.7-4.7 0-9.8 2.4-13.5 6.3L64 105.2c14.5-23.3 23.2-40.5 23.2-59.1 0-5.8-.8-11.3-2.4-16.4L59.6 57.6z"/>
                            </svg>
                          </a>
                          <h3 className="font-bold text-stone-900 truncate">{pub.name}</h3>
                        </div>
                        <p className="text-xs text-stone-500">{pub.suburb}</p>
                      </div>
                      <div className={`text-xl font-bold bg-gradient-to-br ${getPriceColor(pub.price)} bg-clip-text text-transparent`}>
                        ${pub.price.toFixed(2)}
                      </div>
                    </div>

                    {crowdReport && <CrowdBadge report={crowdReport} />}

                    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold text-white mb-2 ${getPriceBgColor(pub.price)}`}>
                      🍺 {pub.beerType}
                    </div>

                    <p className="text-xs text-stone-600 mb-1.5">📍 {pub.address}</p>

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

                    {pub.description && (
                      <p className="text-xs text-stone-500 mb-2 line-clamp-2 italic">"{pub.description}"</p>
                    )}

                    {pub.lastUpdated && (
                      <p className="text-xs text-stone-400 mb-2">Updated: {formatLastUpdated(pub.lastUpdated)}</p>
                    )}

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

                  <div className={`h-1 bg-gradient-to-r ${getPriceColor(pub.price)}`}></div>
                </div>
              )
            })}
          </div>
        )}

        {filteredPubs.length === 0 && (
          <div className="text-center py-12 bg-white rounded-xl border border-stone-200">
            <div className="text-5xl mb-3">🔍</div>
            <h3 className="text-lg font-bold text-stone-700 mb-1">No pubs found</h3>
            <p className="text-stone-500 text-sm">Try adjusting your filters</p>
          </div>
        )}
      </div>

      <footer className="bg-stone-800 text-white py-8 mt-8">
        <div className="max-w-7xl mx-auto px-4">
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

      <SubmitPubForm isOpen={showSubmitForm} onClose={() => setShowSubmitForm(false)} />

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
