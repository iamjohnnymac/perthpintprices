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
import PintIndex from '@/components/PintIndex'
import SuburbLeague from '@/components/SuburbLeague'
import TonightsMoves from '@/components/TonightsMoves'
import VenueIntel from '@/components/VenueIntel'
import CrowdPulse from '@/components/CrowdPulse'
import PintOfTheDay from '@/components/PintOfTheDay'
import BeerWeather from '@/components/BeerWeather'
import RainyDay from '@/components/RainyDay'
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

const INITIAL_PUB_COUNT = 10

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
  const [scrolledPastHero, setScrolledPastHero] = useState(false)
  const [showMap, setShowMap] = useState(true)
  const heroRef = useRef<HTMLDivElement>(null)
  const headerRef = useRef<HTMLElement>(null)
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

  // Unified nav: expand when scrolled past hero (LATCHES — never collapses back)
  useEffect(() => {
    const handleScroll = () => {
      if (heroRef.current && !scrolledPastHero) {
        const heroBottom = heroRef.current.getBoundingClientRect().bottom
        if (heroBottom <= 64) setScrolledPastHero(true)
      }
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()
    return () => window.removeEventListener('scroll', handleScroll)
  }, [scrolledPastHero])

  const isNavExpanded = scrolledPastHero

  // Dynamically set --nav-height for FilterSection positioning
  useEffect(() => {
    const updateNavHeight = () => {
      if (headerRef.current) {
        document.documentElement.style.setProperty(
          '--nav-height',
          `${headerRef.current.offsetHeight}px`
        )
      }
    }
    updateNavHeight()
    const observer = new ResizeObserver(updateNavHeight)
    if (headerRef.current) observer.observe(headerRef.current)
    return () => observer.disconnect()
  }, [isNavExpanded])

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
    setTimeout(() => {
      if (contentRef.current) {
        const rect = contentRef.current.getBoundingClientRect()
        const scrollTarget = rect.top + window.scrollY - 180
        window.scrollTo({ top: Math.max(0, scrollTarget), behavior: 'smooth' })
      }
    }, 50)
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
      {/* ═══ UNIFIED NAV — one component, expands on scroll ═══ */}
      <header ref={headerRef} className="bg-white/95 backdrop-blur-sm sticky top-0 z-[1000] border-b border-stone-200/60 transition-all duration-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-2 pb-1">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <span className="text-amber text-xl">✳</span>
              <h1 className="font-serif text-xl text-charcoal">arvo</h1>
            </Link>
            <div className="flex items-center gap-3">
              {isNavExpanded && <NotificationBell />}
              <button
                onClick={() => setShowSubmitForm(true)}
                className="flex-shrink-0 px-4 py-2 bg-charcoal hover:bg-charcoal/90 text-white rounded-full font-semibold transition-all text-xs"
              >
                <span className="hidden sm:inline">Submit a Price</span>
                <span className="sm:hidden text-xs">+ Price</span>
              </button>
            </div>
          </div>

          {isNavExpanded && (
            <>
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
            </>
          )}
        </div>

      </header>

      {/* ═══ HERO — compact branding moment ═══ */}
      <div ref={heroRef}>
        <HeroSection pubs={pubs} />
      </div>

      {/* ═══ FILTER BAR — below header, above content ═══ */}
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

      {/* ═══ CONTENT ═══ */}
      <div ref={contentRef} className="max-w-5xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
        {/* ═══ PUBS TAB ═══ */}
        {activeTab === 'pubs' && (
          <>
            <MyLocals pubs={pubs} userLocation={userLocation} />

            <div className="flex items-center justify-between mb-3">
              <p className="text-stone-warm text-sm">
                Displaying <span className="font-semibold text-charcoal">{showAllPubs ? filteredPubs.length : Math.min(INITIAL_PUB_COUNT, filteredPubs.length)}</span> of {filteredPubs.length} venues
              </p>
              {filteredPubs.length > INITIAL_PUB_COUNT && (
                <button
                  onClick={() => setShowAllPubs(!showAllPubs)}
                  className="text-sm font-semibold text-charcoal hover:text-amber transition-colors flex items-center gap-1"
                >
                  {showAllPubs ? 'Show Less' : `View All`}
                  <svg className={`w-4 h-4 transition-transform ${showAllPubs ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
                </button>
              )}
            </div>
          </>
        )}

        {/* ═══ INSIGHTS TAB ═══ */}
        {activeTab === 'market' && (
          <div className="space-y-3 sm:space-y-4">
            <PintOfTheDay />
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
            {/* Featured: Pub Golf, Pint Crawl, Leaderboard */}
            <div className="grid grid-cols-3 gap-3 sm:gap-4">
              <Link href="/pub-golf" className="bg-white rounded-xl p-4 sm:p-5 shadow-sm hover:shadow-md transition-all active:scale-[0.98] group text-center">
                <div className="text-2xl sm:text-3xl mb-2">⛳</div>
                <h3 className="font-serif text-charcoal text-sm sm:text-base group-hover:text-amber transition-colors">Pub Golf</h3>
                <p className="text-[11px] text-stone-warm mt-1">Score your crawl</p>
              </Link>
              <Link href="/pint-crawl" className="bg-white rounded-xl p-4 sm:p-5 shadow-sm hover:shadow-md transition-all active:scale-[0.98] group text-center">
                <div className="text-2xl sm:text-3xl mb-2">🗺️</div>
                <h3 className="font-serif text-charcoal text-sm sm:text-base group-hover:text-amber transition-colors">Pint Crawl</h3>
                <p className="text-[11px] text-stone-warm mt-1">Plan your route</p>
              </Link>
              <Link href="/leaderboard" className="bg-white rounded-xl p-4 sm:p-5 shadow-sm hover:shadow-md transition-all active:scale-[0.98] group text-center">
                <div className="text-2xl sm:text-3xl mb-2">🏆</div>
                <h3 className="font-serif text-charcoal text-sm sm:text-base group-hover:text-amber transition-colors">Leaderboard</h3>
                <p className="text-[11px] text-stone-warm mt-1">Top scouts</p>
              </Link>
            </div>
            <BeerWeather pubs={pubs} userLocation={userLocation} />
            <RainyDay pubs={pubs} userLocation={userLocation} />
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
            userLocation={userLocation}
            showAll={showAllPubs}
            initialCount={INITIAL_PUB_COUNT}
            onShowAll={() => setShowAllPubs(true)}
          />
        )}

        {activeTab === 'pubs' && filteredPubs.length === 0 && (
          <div className="text-center py-16 bg-white rounded-xl shadow-sm">
            <div className="text-5xl mb-4">{showHappyHourOnly ? '\u{1F37B}' : '\u{1F50D}'}</div>
            <h3 className="font-serif text-xl text-charcoal mb-2">{showHappyHourOnly ? 'No pubs with happy hour info yet' : 'No pubs found'}</h3>
            <p className="text-stone-warm text-sm">{showHappyHourOnly ? 'We\u2019re building our happy hour database \u2014 submit yours!' : 'Try adjusting your filters'}</p>
          </div>
        )}

        {/* ═══ MAP — after pub list ═══ */}
        {activeTab === 'pubs' && (
          <>
            <button
              onClick={() => setShowMap(!showMap)}
              className="flex items-center gap-2 text-sm text-stone-500 hover:text-charcoal transition-colors mb-3 mt-4"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
              {showMap ? 'Hide map' : 'Show map'}
            </button>

            {showMap && (
              <div className="mb-3 rounded-xl overflow-hidden shadow-sm relative z-0 isolate">
                <Map pubs={filteredPubs} userLocation={userLocation} totalPubCount={pubs.length} />
              </div>
            )}
          </>
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
