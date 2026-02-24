'use client'
import { useState, useMemo, useEffect, useRef } from 'react'
import { Pub } from '@/types/pub'
import { getPubs, getCrowdLevels, CrowdReport } from '@/lib/supabase'

import { getDistanceKm } from '@/lib/location'
import Link from 'next/link'
import dynamic from 'next/dynamic'

// Extracted components
import HeroSection from '@/components/HeroSection'
import StatsBar from '@/components/StatsBar'
import TabBar, { TabId } from '@/components/TabBar'
import { FilterSection } from '@/components/FilterSection'
import PubListView from '@/components/PubListView'
import PubCardsView from '@/components/PubCardsView'
import PintIndexCompact from '@/components/PintIndexCompact'
import PintIndex from '@/components/PintIndex'
import SuburbLeague from '@/components/SuburbLeague'
import TonightsMoves from '@/components/TonightsMoves'
import VenueIntel from '@/components/VenueIntel'
import CrowdPulse from '@/components/CrowdPulse'
import BeerWeather from '@/components/BeerWeather'
import SunsetSippers from '@/components/SunsetSippers'
import PuntNPints from '@/components/PuntNPints'
import DadBar from '@/components/DadBar'
import PriceTicker from '@/components/PriceTicker'
import HowItWorks from '@/components/HowItWorks'
import SocialProof from '@/components/SocialProof'
import FAQ from '@/components/FAQ'
import Footer from '@/components/Footer'
import MyLocals from '@/components/MyLocals'
import SubmitPubForm from '@/components/SubmitPubForm'
import CrowdReporter from '@/components/CrowdReporter'
import NotificationBell from '@/components/NotificationBell'

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

const INITIAL_PUB_COUNT = 20

export default function Home() {
  const [pubs, setPubs] = useState<Pub[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSuburb, setSelectedSuburb] = useState('')
  const [maxPrice, setMaxPrice] = useState(20)
  const [sortBy, setSortBy] = useState<'price' | 'name' | 'suburb' | 'nearest'>('price')
  const [showHappyHourOnly, setShowHappyHourOnly] = useState(false)
  const [showMiniMaps, setShowMiniMaps] = useState(true)
  const [showSubmitForm, setShowSubmitForm] = useState(false)
  const [crowdReports, setCrowdReports] = useState<Record<string, CrowdReport>>({})
  const [crowdReportPub, setCrowdReportPub] = useState<Pub | null>(null)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [activeTab, setActiveTab] = useState<TabId>('pubs')
  const [viewMode, setViewMode] = useState<'cards' | 'list'>('list')
  const [showMoreFilters, setShowMoreFilters] = useState(false)
  const [showAllPubs, setShowAllPubs] = useState(false)
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null)
  const [locationState, setLocationState] = useState<'idle' | 'granted' | 'denied' | 'dismissed'>('idle')
  const [heroVisible, setHeroVisible] = useState(true)
  const [showMap, setShowMap] = useState(true)
  const appRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)

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
        if (showHappyHourOnly) {
          const aActive = a.isHappyHourNow ? 1 : 0
          const bActive = b.isHappyHourNow ? 1 : 0
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
    if (pubs.length === 0) return { total: 0, minPrice: 0, maxPriceValue: 0, avgPrice: '0', happyHourNow: 0, cheapestSuburb: '', cheapestSlug: '', priciestSuburb: '', priciestSlug: '' }
    const priced = pubs.filter(p => p.price !== null)
    const minP = Math.min(...priced.map(p => p.price!))
    const maxP = Math.max(...priced.map(p => p.price!))
    const cheapest = priced.find(p => p.price === minP)
    const priciest = priced.find(p => p.price === maxP)
    return {
      total: priced.length,
      minPrice: minP,
      maxPriceValue: maxP,
      avgPrice: priced.length > 0 ? (priced.reduce((sum, p) => sum + p.price!, 0) / priced.length).toFixed(2) : '0',
      happyHourNow: pubs.filter(p => p.isHappyHourNow).length,
      cheapestSuburb: cheapest?.suburb || '',
      cheapestSlug: cheapest?.slug || '',
      priciestSuburb: priciest?.suburb || '',
      priciestSlug: priciest?.slug || ''
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pubs, currentTime])

  const liveCrowdCount = Object.keys(crowdReports).length

  function handleTabChange(tab: TabId) {
    setActiveTab(tab)
    // Scroll content area to just below sticky header
    setTimeout(() => {
      if (contentRef.current) {
        const header = contentRef.current.previousElementSibling as HTMLElement
        const headerHeight = header?.offsetHeight || 0
        const contentTop = contentRef.current.getBoundingClientRect().top + window.scrollY - headerHeight - 8
        window.scrollTo({ top: contentTop, behavior: 'smooth' })
      }
    }, 50)
  }

  function scrollToApp() {
    setHeroVisible(false)
    // After hero unmounts, app section is at top — just scroll to 0
    setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 50)
  }

  if (isLoading) {
    return (
      <main className="min-h-screen bg-cream flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-16 h-16 border-4 border-stone-300 border-t-amber rounded-full animate-spin"></div>
          <span className="text-stone-600 font-medium text-lg">Loading pubs...</span>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-cream">
      {/* ═══ HERO SECTION ═══ */}
      {heroVisible && (
        <HeroSection
          avgPrice={stats.avgPrice}
          cheapestPrice={stats.minPrice}
            cheapestSlug={stats.cheapestSlug}
          venueCount={stats.total}
          suburbCount={suburbs.length}
          happyHourCount={stats.happyHourNow}
          onExploreClick={() => { handleTabChange('pubs'); scrollToApp(); }}
          onDiscoverClick={() => { scrollToApp(); handleTabChange('explore'); }}
          onSubmitClick={() => setShowSubmitForm(true)}
        />
      )}

      {/* ═══ APP SECTION ═══ */}
      <div ref={appRef}>
        <header className="bg-cream sticky top-0 z-[1000] shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-2 pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <img src="/logo.png" alt="PintDex" className="w-10 h-10 rounded-lg flex-shrink-0 object-contain" />
                <h1 className="text-lg font-bold tracking-tight leading-none font-heading text-charcoal">PintDex</h1>
                <div className="flex items-center gap-1 ml-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber animate-pulse" />
                  <span className="text-[10px] text-amber/70 uppercase tracking-wider font-medium">Live</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <NotificationBell />
                <button
                  onClick={() => setShowSubmitForm(true)}
                  className="flex-shrink-0 flex items-center gap-2 px-4 py-2 bg-charcoal hover:bg-charcoal/90 text-white rounded-full font-bold transition-all text-xs"
                >
                  <span className="hidden sm:inline">+ Submit a Price</span>
                  <span className="sm:hidden text-xs font-bold">+ Price</span>
                </button>
              </div>
            </div>

            <StatsBar
              avgPrice={stats.avgPrice}
              cheapestPrice={stats.minPrice}
              cheapestSuburb={stats.cheapestSuburb}
              cheapestSlug={stats.cheapestSlug}
              priciestPrice={stats.maxPriceValue}
              priciestSuburb={stats.priciestSuburb}
              priciestSlug={stats.priciestSlug}
              happyHourCount={stats.happyHourNow}
              suburbCount={suburbs.length}
              venueCount={stats.total}
            />

          <TabBar
            activeTab={activeTab}
            onTabChange={handleTabChange}
            pubCount={filteredPubs.length}
            crowdCount={liveCrowdCount}
          />
          </div>

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

        <div ref={contentRef} className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-5">
          {/* ═══ PUBS TAB ═══ */}
          {activeTab === 'pubs' && (
            <>
              <PintIndexCompact pubs={pubs} filteredPubs={filteredPubs} onViewMore={() => setActiveTab('market')} />

              <MyLocals pubs={pubs} userLocation={userLocation} />

              <button
                onClick={() => setShowMap(!showMap)}
                className="flex items-center gap-2 text-sm text-stone-500 hover:text-charcoal transition-colors mb-3"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
                {showMap ? 'Hide map' : 'Show map'}
              </button>

              {showMap && (
                <div className="mb-5 rounded-2xl overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.06)] border border-stone-200/60 relative z-0 isolate">
                  <Map pubs={filteredPubs} userLocation={userLocation} totalPubCount={pubs.length} />
                </div>
              )}

              <div className="flex items-center justify-between mb-4">
                <p className="text-stone-600 text-sm">
                  Showing <span className="text-amber font-semibold">{showAllPubs ? filteredPubs.length : Math.min(INITIAL_PUB_COUNT, filteredPubs.length)}</span> of {filteredPubs.length} venues
                </p>
                {filteredPubs.length > INITIAL_PUB_COUNT && (
                  <button
                    onClick={() => setShowAllPubs(!showAllPubs)}
                    className="text-sm font-medium text-charcoal hover:text-amber transition-colors flex items-center gap-1"
                  >
                    {showAllPubs ? 'Show Less' : `Show All ${filteredPubs.length}`}
                    <span className={`inline-block transition-transform ${showAllPubs ? 'rotate-180' : ''}`}>&#9660;</span>
                  </button>
                )}
              </div>
            </>
          )}

          {/* ═══ INSIGHTS TAB ═══ */}
          {activeTab === 'market' && (
            <div className="space-y-3 sm:space-y-4">
              <PintIndex />
              <TonightsMoves pubs={pubs} userLocation={userLocation} />
              <SuburbLeague pubs={pubs} />
              <CrowdPulse pubs={pubs} crowdReports={crowdReports} userLocation={userLocation} />
              <VenueIntel pubs={pubs} userLocation={userLocation} />
            </div>
          )}

          {/* ═══ GUIDES TAB ═══ */}
          {activeTab === 'explore' && (
            <div className="space-y-3 sm:space-y-4">
              {/* Featured: Pub Golf & Pint Crawl */}
              <div className="grid grid-cols-2 gap-3">
                <Link href="/pub-golf" className="bg-white rounded-2xl border border-stone-200/60 p-4 sm:p-5 hover:border-amber/40 hover:shadow-md transition-all active:scale-[0.98] group">
                  <div className="text-2xl mb-2">⛳</div>
                  <h3 className="font-bold font-heading text-charcoal text-sm group-hover:text-amber transition-colors">Pub Golf</h3>
                  <p className="text-xs text-stone-500 mt-0.5">Score your crawl</p>
                </Link>
                <Link href="/pint-crawl" className="bg-white rounded-2xl border border-stone-200/60 p-4 sm:p-5 hover:border-amber/40 hover:shadow-md transition-all active:scale-[0.98] group">
                  <div className="text-2xl mb-2">🗺️</div>
                  <h3 className="font-bold font-heading text-charcoal text-sm group-hover:text-amber transition-colors">Pint Crawl</h3>
                  <p className="text-xs text-stone-500 mt-0.5">Plan your route</p>
                </Link>
              </div>
              <BeerWeather pubs={pubs} userLocation={userLocation} />
              <SunsetSippers pubs={pubs} userLocation={userLocation} />
              <PuntNPints pubs={pubs} userLocation={userLocation} />
              <DadBar pubs={pubs} userLocation={userLocation} />
            </div>
          )}

          {activeTab === 'pubs' && viewMode === 'list' && (
            <PubListView
              pubs={filteredPubs}
              crowdReports={crowdReports}
              userLocation={userLocation}
              onCrowdReport={setCrowdReportPub}
              showAll={showAllPubs}
              initialCount={INITIAL_PUB_COUNT}
              onShowAll={() => setShowAllPubs(true)}
            />
          )}

          {activeTab === 'pubs' && viewMode === 'cards' && (
            <PubCardsView
              pubs={filteredPubs}
              crowdReports={crowdReports}
              showMiniMaps={showMiniMaps}
              userLocation={userLocation}
              sortBy={sortBy}
              onCrowdReport={setCrowdReportPub}
              showAll={showAllPubs}
              initialCount={INITIAL_PUB_COUNT}
              onShowAll={() => setShowAllPubs(true)}
            />
          )}

          {activeTab === 'pubs' && filteredPubs.length === 0 && (
            <div className="text-center py-12 bg-white rounded-2xl border border-stone-200/60">
              <div className="text-5xl mb-3">{showHappyHourOnly ? '\u{1F37B}' : '\u{1F50D}'}</div>
              <h3 className="text-lg font-bold text-stone-700 mb-2">{showHappyHourOnly ? 'No pubs with happy hour info yet' : 'No pubs found'}</h3>
              <p className="text-stone-500 text-sm">{showHappyHourOnly ? 'We\u2019re building our happy hour database \u2014 submit yours!' : 'Try adjusting your filters'}</p>
            </div>
          )}
        </div>

        {activeTab === 'pubs' && (
          <>
            <HowItWorks />
            <SocialProof venueCount={stats.total} suburbCount={suburbs.length} avgPrice={stats.avgPrice} />
            <FAQ />
          </>
        )}
        <Footer />
      <div className="h-9" /> {/* Spacer for fixed bottom ticker */}
      <PriceTicker pubs={pubs} />
      </div>

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
