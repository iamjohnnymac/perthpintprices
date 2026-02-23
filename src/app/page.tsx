'use client'
import Link from 'next/link'

import { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { Pub } from '@/types/pub'
import SubmitPubForm from '@/components/SubmitPubForm'
import CrowdBadge from '@/components/CrowdBadge'
import CrowdReporter from '@/components/CrowdReporter'
import { FilterSection } from '@/components/FilterSection'
import PintIndex from '@/components/PintIndex'
import PriceTicker from '@/components/PriceTicker'
import SunsetSippers from '@/components/SunsetSippers'
import BeerWeather from '@/components/BeerWeather'
import SuburbLeague from '@/components/SuburbLeague'
import CrowdPulse from '@/components/CrowdPulse'
import TonightsMoves from '@/components/TonightsMoves'
import VenueIntel from '@/components/VenueIntel'
import PuntNPints from '@/components/PuntNPints'
import DadBar from '@/components/DadBar'
import TabBar, { TabId } from '@/components/TabBar'
import PintIndexCompact from '@/components/PintIndexCompact'
import PubCard from '@/components/PubCard'
import { getDistanceKm, formatDistance } from '@/lib/location'
import { getCrowdLevels, CrowdReport, CROWD_LEVELS, getPubs } from '@/lib/supabase'
import { getHappyHourStatus } from '@/lib/happyHour'

const Map = dynamic(() => import('@/components/Map'), {
  ssr: false,
  loading: () => (
    <div className="h-[200px] sm:h-[300px] md:h-[400px] bg-stone-100 rounded-xl flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-12 h-12 border-4 border-stone-300 border-t-stone-600 rounded-full animate-spin"></div>
        <span className="text-stone-600 font-medium">Loading map...</span>
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

function getPriceColor(price: number | null): string {
  if (price === null) return 'from-stone-400 to-stone-500'
  if (price <= 7) return 'from-green-600 to-green-700'
  if (price <= 8) return 'from-yellow-600 to-yellow-700'
  if (price <= 9) return 'from-orange-600 to-orange-700'
  return 'from-red-600 to-red-700'
}

function getPriceBgColor(price: number | null): string {
  if (price === null) return 'bg-stone-400'
  if (price <= 7) return 'bg-green-700'
  if (price <= 8) return 'bg-yellow-700'
  if (price <= 9) return 'bg-orange-700'
  return 'bg-red-700'
}

function getPriceTextColor(price: number | null): string {
  if (price === null) return 'text-stone-400'
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
  const [sortBy, setSortBy] = useState<'price' | 'name' | 'suburb' | 'nearest'>('price')
  const [showHappyHourOnly, setShowHappyHourOnly] = useState(false)
  const [showMiniMaps, setShowMiniMaps] = useState(true)
  const [showSubmitForm, setShowSubmitForm] = useState(false)
  const [crowdReports, setCrowdReports] = useState<Record<string, CrowdReport>>({})
  const [crowdReportPub, setCrowdReportPub] = useState<Pub | null>(null)
  const [currentTime, setCurrentTime] = useState(new Date())
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<TabId>('pubs')
  const [viewMode, setViewMode] = useState<'cards' | 'list'>('list')
  const [showMoreFilters, setShowMoreFilters] = useState(false)
  const [showAllPubs, setShowAllPubs] = useState(false)
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null)
  const [locationState, setLocationState] = useState<'idle' | 'granted' | 'denied' | 'dismissed'>('idle')
  const INITIAL_PUB_COUNT = 20

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

  // Auto-request location on load (native browser prompt, no custom UI)
  useEffect(() => {
    if (typeof window !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude })
          setLocationState('granted')
          setSortBy('nearest')
        },
        () => setLocationState('denied'),
        { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 }
      )
    }
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
        const matchesPrice = pub.price === null || pub.price <= maxPrice
        const matchesHappyHour = !showHappyHourOnly || !!pub.happyHour
        return matchesSearch && matchesSuburb && matchesPrice && matchesHappyHour
      })
      .sort((a, b) => {
        // When HH filter is on, put currently-active happy hours first
        if (showHappyHourOnly) {
          const aActive = a.isHappyHourNow || isHappyHour(a.happyHour) ? 1 : 0
          const bActive = b.isHappyHourNow || isHappyHour(b.happyHour) ? 1 : 0
          if (aActive !== bActive) return bActive - aActive
        }
        if (sortBy === 'price') { if (a.price === null && b.price === null) return 0; if (a.price === null) return 1; if (b.price === null) return -1; return a.price - b.price; }
        if (sortBy === 'name') return a.name.localeCompare(b.name)
        if (sortBy === 'suburb') return a.suburb.localeCompare(b.suburb)
        if (sortBy === 'nearest' && userLocation) {
          const distA = getDistanceKm(userLocation.lat, userLocation.lng, a.lat, a.lng)
          const distB = getDistanceKm(userLocation.lat, userLocation.lng, b.lat, b.lng)
          return distA - distB
        }
        return 0
      })
  }, [pubs, searchTerm, selectedSuburb, maxPrice, sortBy, showHappyHourOnly, userLocation])

  const stats = useMemo(() => {
    if (pubs.length === 0) return { total: 0, minPrice: 0, maxPriceValue: 0, avgPrice: '0', happyHourNow: 0, cheapestSuburb: '', priciestSuburb: '' }
    const priced = pubs.filter(p => p.price !== null)
    const minP = Math.min(...priced.map(p => p.price!))
    const maxP = Math.max(...priced.map(p => p.price!))
    const cheapest = priced.find(p => p.price === minP)
    const priciest = priced.find(p => p.price === maxP)
    return {
      total: pubs.length,
      minPrice: minP,
      maxPriceValue: maxP,
      avgPrice: priced.length > 0 ? (priced.reduce((sum, p) => sum + p.price!, 0) / priced.length).toFixed(2) : '0',
      happyHourNow: pubs.filter(p => p.isHappyHourNow || isHappyHour(p.happyHour)).length,
      cheapestSuburb: cheapest?.suburb || '',
      priciestSuburb: priciest?.suburb || ''
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pubs, currentTime]) // currentTime triggers happyHourNow recount every minute

  const liveCrowdCount = Object.keys(crowdReports).length

  if (isLoading) {
    return (
      <main className="min-h-screen bg-stone-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-16 h-16 border-4 border-stone-300 border-t-stone-600 rounded-full animate-spin"></div>
          <span className="text-stone-600 font-medium text-lg">Loading pubs...</span>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-cream">
      <PriceTicker pubs={pubs} />
      <header className="bg-white sticky top-0 z-[1000] shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
        {/* Compact brand bar */}
        <div className="max-w-7xl mx-auto px-4 pt-2.5 pb-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img src="/logo.png" alt="PintDex" className="w-10 h-10 rounded-lg flex-shrink-0 object-contain" />
              <h1 className="text-lg font-extrabold tracking-tight leading-none font-heading text-stone-900">PintDex</h1>
              <div className="flex items-center gap-1 ml-1">
                <div className="w-1.5 h-1.5 rounded-full bg-teal animate-pulse" />
                <span className="text-[10px] text-teal/70 uppercase tracking-wider font-medium">Live</span>
              </div>
            </div>
            <button
              onClick={() => setShowSubmitForm(true)}
              className="flex-shrink-0 flex items-center gap-1.5 px-3.5 py-2 bg-ocean hover:bg-ocean/90 text-white rounded-xl font-bold transition-all text-xs shadow-md shadow-ocean/20"
            >
              <span className="hidden sm:inline">+ Submit a Price</span>
              <span className="sm:hidden text-base leading-none font-bold">+</span>
            </button>
          </div>

          {/* CoinMarketCap-style stat pods */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2.5 pb-2.5">
            {/* Perth Average */}
            <div className="bg-stone-50 rounded-lg px-2.5 py-1.5 border border-stone-200">
              <span className="text-stone-500 text-[9px] uppercase tracking-wider block leading-none">Perth Avg</span>
              <span className="text-ocean font-mono font-black text-base sm:text-lg leading-tight">${stats.avgPrice}</span>
              <span className="text-stone-400 text-[9px] block leading-none mt-0.5">{stats.total} venues</span>
            </div>
            {/* Cheapest */}
            <div className="bg-stone-50 rounded-lg px-2.5 py-1.5 border border-stone-200">
              <span className="text-stone-500 text-[9px] uppercase tracking-wider block leading-none">Cheapest</span>
              <span className="text-teal font-mono font-black text-base sm:text-lg leading-tight">${stats.minPrice}</span>
              <span className="text-stone-400 text-[9px] block leading-none mt-0.5 truncate">{stats.cheapestSuburb}</span>
            </div>
            {/* Priciest */}
            <div className="bg-stone-50 rounded-lg px-2.5 py-1.5 border border-stone-200">
              <span className="text-stone-500 text-[9px] uppercase tracking-wider block leading-none">Priciest</span>
              <span className="text-coral font-mono font-black text-base sm:text-lg leading-tight">${stats.maxPriceValue}</span>
              <span className="text-stone-400 text-[9px] block leading-none mt-0.5 truncate">{stats.priciestSuburb}</span>
            </div>
            {/* Market Status */}
            <div className="bg-stone-50 rounded-lg px-2.5 py-1.5 border border-stone-200">
              <span className="text-stone-500 text-[9px] uppercase tracking-wider block leading-none">Happy Hour</span>
              <span className="text-ocean font-mono font-black text-base sm:text-lg leading-tight">{stats.happyHourNow}</span>
              <span className="text-stone-400 text-[9px] block leading-none mt-0.5">{suburbs.length} suburbs</span>
            </div>
          </div>
        </div>

        {/* Tab navigation — primary, always visible */}
        <TabBar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          pubCount={filteredPubs.length}
          crowdCount={liveCrowdCount}
        />

        {/* Filters — only on Pubs tab */}
        {activeTab === 'pubs' && (
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
            hasLocation={!!userLocation}
          />
        )}
      </header>

      <div className="max-w-7xl mx-auto px-4 py-5">

        {/* ═══ PUBS TAB ═══ */}
        {activeTab === 'pubs' && (
          <>
            <PintIndexCompact pubs={pubs} filteredPubs={filteredPubs} onViewMore={() => setActiveTab('market')} />

            <div className="mb-5 rounded-2xl overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.06)] border border-stone-200/60 relative z-0 isolate">
              <Map pubs={filteredPubs} isHappyHour={isHappyHour} userLocation={userLocation} totalPubCount={pubs.length} />
            </div>

            <div className="flex items-center justify-between mb-4">
              <p className="text-stone-600 text-sm">
                Showing <span className="text-ocean font-semibold">{showAllPubs ? filteredPubs.length : Math.min(INITIAL_PUB_COUNT, filteredPubs.length)}</span> of {filteredPubs.length} venues
              </p>
              {filteredPubs.length > INITIAL_PUB_COUNT && (
                <button
                  onClick={() => setShowAllPubs(!showAllPubs)}
                  className="text-sm font-medium text-ocean hover:text-ocean/80 transition-colors flex items-center gap-1"
                >
                  {showAllPubs ? 'Show Less' : `Show All ${filteredPubs.length}`}
                  <span className={`inline-block transition-transform ${showAllPubs ? 'rotate-180' : ''}`}>&#9660;</span>
                </button>
              )}
            </div>
          </>
        )}

        {/* ═══ MARKET TAB ═══ */}
        {activeTab === 'market' && (
          <div className="space-y-4">
            <PintIndex />
            <SuburbLeague pubs={pubs} />
            <TonightsMoves pubs={pubs} userLocation={userLocation} />
            <VenueIntel pubs={pubs} userLocation={userLocation} />
            <CrowdPulse pubs={pubs} crowdReports={crowdReports} userLocation={userLocation} />
          </div>
        )}

        {/* ═══ EXPLORE TAB ═══ */}
        {activeTab === 'explore' && (
          <div className="space-y-4">
            <BeerWeather pubs={pubs} userLocation={userLocation} />
            <SunsetSippers pubs={pubs} userLocation={userLocation} />
            <PuntNPints pubs={pubs} userLocation={userLocation} />
            <DadBar pubs={pubs} userLocation={userLocation} />
          </div>
        )}

        {activeTab === 'pubs' && viewMode === 'list' && (
          <div className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.06)] border border-stone-200/60 overflow-hidden">
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
                {(showAllPubs ? filteredPubs : filteredPubs.slice(0, INITIAL_PUB_COUNT)).map((pub, index) => {
                  const crowdReport = getLatestCrowdReport(pub.id)
                  const happyHourStatus = getHappyHourStatus(pub.happyHour)
                  return (
                    <tr 
                      key={pub.id} 
                      className={`border-b border-stone-100 hover:bg-cyan-50/50 transition-colors cursor-pointer ${
                        index % 2 === 0 ? 'bg-white' : 'bg-stone-50/30'
                      }`}
                      onClick={() => router.push(`/pub/${pub.slug}`)}
                    >
                      <td className="py-3 px-2 sm:px-4">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-stone-300 w-5 text-right tabular-nums">{index + 1}</span>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <a
                                href={getDirectionsUrl(pub)}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="flex-shrink-0 text-stone-300 hover:text-ocean transition-colors"
                                title="Get directions"
                              >
                                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                                </svg>
                              </a>
                              <Link href={`/pub/${pub.slug}`} className="font-semibold text-stone-900 text-sm hover:text-ocean transition-colors">{pub.name}</Link>
                            </div>
                            <p className="text-xs text-stone-500 sm:hidden">{pub.suburb}{userLocation && ` · ${formatDistance(getDistanceKm(userLocation.lat, userLocation.lng, pub.lat, pub.lng))}`}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-stone-600 hidden sm:table-cell">
                        {pub.suburb}
                        {userLocation && <span className="text-stone-400 text-xs ml-1">· {formatDistance(getDistanceKm(userLocation.lat, userLocation.lng, pub.lat, pub.lng))}</span>}
                      </td>
                      <td className="py-3 px-4 hidden sm:table-cell">
                        <span className="text-xs text-stone-500 truncate max-w-[120px] block">
                          {pub.beerType || '—'}
                        </span>
                      </td>
                      <td className={`py-3 px-2 sm:px-4 text-right font-bold font-mono text-lg whitespace-nowrap ${getPriceTextColor(pub.price)}`}>
                        {pub.isHappyHourNow && pub.regularPrice !== null && pub.regularPrice !== pub.price && (
                          <span className="text-xs text-stone-400 line-through font-normal mr-1">${pub.regularPrice.toFixed(2)}</span>
                        )}
                        {pub.price !== null ? `$${pub.price.toFixed(2)}` : 'TBC'}
                      </td>
                      <td className="py-3 px-4 hidden md:table-cell">
                        {pub.happyHour ? (
                          <span className={`text-xs ${
                            happyHourStatus.isActive ? 'text-teal font-bold' : 
                            happyHourStatus.isToday ? 'text-ocean font-semibold' : 
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
                            className="text-xs text-stone-400 hover:text-ocean"
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
            {!showAllPubs && filteredPubs.length > INITIAL_PUB_COUNT && (
              <button
                onClick={() => setShowAllPubs(true)}
                className="w-full py-3 text-sm font-medium text-ocean hover:text-ocean/80 hover:bg-cyan-50/50 transition-colors flex items-center justify-center gap-1 border-t border-stone-200"
              >
                Show All {filteredPubs.length} Venues
                <span className="inline-block">&#9660;</span>
              </button>
            )}
          </div>
        )}

        {activeTab === 'pubs' && viewMode === 'cards' && (
          <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-stretch">
            {(showAllPubs ? filteredPubs : filteredPubs.slice(0, INITIAL_PUB_COUNT)).map((pub, index) => {
              const crowdReport = getLatestCrowdReport(pub.id)
              const happyHourStatus = getHappyHourStatus(pub.happyHour)
              return (
                <PubCard
                  key={pub.id}
                  pub={pub}
                  index={index}
                  sortBy={sortBy}
                  showMiniMaps={showMiniMaps}
                  crowdReport={crowdReport}
                  happyHourStatus={happyHourStatus}
                  getDirectionsUrl={getDirectionsUrl}
                  getPriceColor={getPriceColor}
                  getPriceBgColor={getPriceBgColor}
                  formatLastUpdated={formatLastUpdated}
                  onCrowdReport={setCrowdReportPub}
                  distance={userLocation ? formatDistance(getDistanceKm(userLocation.lat, userLocation.lng, pub.lat, pub.lng)) : undefined}
                />
              )
            })}
          </div>
          {!showAllPubs && filteredPubs.length > INITIAL_PUB_COUNT && (
            <button
              onClick={() => setShowAllPubs(true)}
              className="w-full mt-4 py-3 text-sm font-medium text-ocean hover:text-ocean/80 bg-white hover:bg-cyan-50/50 rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.06)] border border-stone-200/60 transition-colors flex items-center justify-center gap-1"
            >
              Show All {filteredPubs.length} Venues
              <span className="inline-block">&#9660;</span>
            </button>
          )}
          </>
        )}

        {activeTab === 'pubs' && filteredPubs.length === 0 && (
          <div className="text-center py-12 bg-white rounded-xl border border-stone-200">
            <div className="text-5xl mb-3">{showHappyHourOnly ? '\u{1F37B}' : '\u{1F50D}'}</div>
            <h3 className="text-lg font-bold text-stone-700 mb-1">{showHappyHourOnly ? 'No pubs with happy hour info yet' : 'No pubs found'}</h3>
            <p className="text-stone-500 text-sm">{showHappyHourOnly ? 'We\u2019re building our happy hour database \u2014 submit yours!' : 'Try adjusting your filters'}</p>
          </div>
        )}
      </div>

      <footer className="bg-stone-100 border-t border-stone-200 text-stone-700 py-8 mt-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-wrap justify-center gap-6 mb-6 pb-6 border-b border-stone-300">
            <div className="flex items-center gap-2">
              <span className="text-xl text-stone-400">⬡</span>
              <div>
                <p className="font-semibold text-stone-700">Schooner</p>
                <p className="text-xs text-stone-500">425ml</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xl text-stone-400">⬡</span>
              <div>
                <p className="font-semibold text-ocean">Pint</p>
                <p className="text-xs text-stone-500">570ml</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xl text-stone-400">⬡</span>
              <div>
                <p className="font-semibold text-stone-700">Long Neck</p>
                <p className="text-xs text-stone-500">750ml</p>
              </div>
            </div>
          </div>

          <div className="text-center">
            <p className="text-stone-600 text-sm font-medium">PintDex — Perth&apos;s Beer Market since 2024</p>
            <p className="text-stone-400 text-xs mt-1">Prices may vary. Pint prices shown. Always drink responsibly.</p>
            <a
              href="mailto:perthpintprices@gmail.com?subject=Price%20Correction&body=Hi%2C%20I%20noticed%20a%20wrong%20price%20on%20the%20site.%0A%0APub%20name%3A%20%0ACorrect%20price%3A%20%0ADetails%3A%20"
              className="inline-block mt-3 text-ocean hover:text-cyan-500 text-xs"
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
