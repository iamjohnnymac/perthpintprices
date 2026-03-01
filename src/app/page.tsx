'use client'
// Production deploy trigger
import { useState, useMemo, useEffect, useRef, useCallback, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Pub } from '@/types/pub'
import { getPubs, getCrowdLevels, CrowdReport } from '@/lib/supabase'

import { getDistanceKm } from '@/lib/location'
import Link from 'next/link'
import dynamic from 'next/dynamic'

// Extracted components
import HeroSection from '@/components/HeroSection'
import { FilterSection } from '@/components/FilterSection'
import PubListView from '@/components/PubListView'
import PubCardsView from '@/components/PubCardsView'
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
    <div className="h-[250px] sm:h-[350px] md:h-[450px] bg-stone-100 rounded-xl flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-12 h-12 border-4 border-stone-300 border-t-stone-600 rounded-full animate-spin"></div>
        <span className="text-stone-600 font-medium">Loading map...</span>
      </div>
    </div>
  )
})

const INITIAL_PUB_COUNT = 10

function LoadingSkeleton() {
  return (
    <main className="min-h-screen bg-cream flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-16 h-16 border-4 border-stone-300 border-t-amber rounded-full animate-spin"></div>
        <span className="text-stone-600 font-medium text-lg">Loading pubs...</span>
      </div>
    </main>
  )
}

function HomeContent() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const [pubs, setPubs] = useState<Pub[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '')
  const [selectedSuburb, setSelectedSuburb] = useState(searchParams.get('suburb') || '')
  const [maxPrice, setMaxPrice] = useState(() => {
    const p = searchParams.get('maxPrice')
    return p ? Number(p) : 20
  })
  const [sortBy, setSortBy] = useState<'price' | 'name' | 'suburb' | 'nearest' | 'freshness'>(() => {
    const s = searchParams.get('sort')
    if (s === 'name' || s === 'suburb' || s === 'nearest' || s === 'freshness') return s
    return 'price'
  })
  const [showHappyHourOnly, setShowHappyHourOnly] = useState(false)
  const [showMiniMaps, setShowMiniMaps] = useState(true)
  const [showSubmitForm, setShowSubmitForm] = useState(false)
  const [crowdReports, setCrowdReports] = useState<Record<string, CrowdReport>>({})
  const [crowdReportPub, setCrowdReportPub] = useState<Pub | null>(null)
  const [currentTime, setCurrentTime] = useState(new Date())
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

  // P2a: New filter state
  const [vibeTagFilter, setVibeTagFilter] = useState(searchParams.get('vibe') || '')
  const [kidFriendlyOnly, setKidFriendlyOnly] = useState(searchParams.get('kids') === '1')
  const [hasTabOnly, setHasTabOnly] = useState(searchParams.get('tab') === '1')

  // P2a: URL sync — update URL params on filter change
  const updateUrlParams = useCallback(() => {
    const params = new URLSearchParams()
    if (searchTerm) params.set('q', searchTerm)
    if (selectedSuburb && selectedSuburb !== 'all') params.set('suburb', selectedSuburb)
    if (sortBy !== 'price') params.set('sort', sortBy)
    if (vibeTagFilter) params.set('vibe', vibeTagFilter)
    if (kidFriendlyOnly) params.set('kids', '1')
    if (hasTabOnly) params.set('tab', '1')
    if (maxPrice < 20) params.set('maxPrice', String(maxPrice))

    const paramString = params.toString()
    const newUrl = paramString ? `?${paramString}` : '/'
    router.replace(newUrl, { scroll: false })
  }, [searchTerm, selectedSuburb, sortBy, vibeTagFilter, kidFriendlyOnly, hasTabOnly, maxPrice, router])

  // Debounced URL update
  useEffect(() => {
    const timeout = setTimeout(updateUrlParams, 300)
    return () => clearTimeout(timeout)
  }, [updateUrlParams])

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
          // Only auto-set to nearest if no sort was specified in URL
          if (!searchParams.get('sort')) setSortBy('nearest')
        },
        () => setLocationState('denied'),
        { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 }
      )
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
        // P2a: new filters
        const matchesVibe = !vibeTagFilter || pub.vibeTag === vibeTagFilter
        const matchesKids = !kidFriendlyOnly || pub.kidFriendly === true
        const matchesTab = !hasTabOnly || pub.hasTab === true
        return matchesSearch && matchesSuburb && matchesPrice && matchesHappyHour && matchesVibe && matchesKids && matchesTab
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
        if (sortBy === 'freshness') {
          const aDate = a.lastVerified ? new Date(a.lastVerified).getTime() : 0
          const bDate = b.lastVerified ? new Date(b.lastVerified).getTime() : 0
          return bDate - aDate // Most recently verified first
        }
        return 0
      })
  }, [pubs, searchTerm, selectedSuburb, maxPrice, sortBy, showHappyHourOnly, userLocation, vibeTagFilter, kidFriendlyOnly, hasTabOnly])

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

  if (isLoading) {
    return <LoadingSkeleton />
  }

  return (
    <main className="min-h-screen bg-cream">
      {/* ═══ UNIFIED NAV — one component, expands on scroll ═══ */}
      <header ref={headerRef} className="bg-white/95 backdrop-blur-sm sticky top-0 z-[1000] border-b border-stone-200/60 transition-all duration-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-2.5">
          <div className="flex items-center justify-between gap-2">
            <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity flex-shrink-0 focus-visible:ring-2 focus-visible:ring-amber/50 focus-visible:ring-offset-1 rounded-lg">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="flex-shrink-0"><path d="M12 2v20M2 12h20M4.93 4.93l14.14 14.14M19.07 4.93L4.93 19.07" stroke="#E8820C" strokeWidth="2.5" strokeLinecap="round"/></svg>
              <h1 className="font-serif text-xl text-charcoal">arvo</h1>
            </Link>
            <nav className="flex items-center gap-1.5 sm:gap-2">
              <Link href="/discover" className="px-2.5 sm:px-3 py-1 text-xs sm:text-sm font-semibold text-charcoal bg-cream-dark hover:bg-amber/10 hover:text-amber rounded-full transition-all focus-visible:ring-2 focus-visible:ring-amber/50 focus-visible:ring-offset-1">
                Discover
              </Link>
              <Link href="/happy-hour" className="px-2.5 sm:px-3 py-1 text-xs sm:text-sm font-semibold text-charcoal bg-cream-dark hover:bg-amber/10 hover:text-amber rounded-full transition-all focus-visible:ring-2 focus-visible:ring-amber/50 focus-visible:ring-offset-1">
                Happy Hours
              </Link>
            </nav>
            <div className="flex items-center gap-2 flex-shrink-0">
              {isNavExpanded && <NotificationBell />}
              <button
                onClick={() => setShowSubmitForm(true)}
                className="flex-shrink-0 px-3 sm:px-4 py-1.5 sm:py-2 bg-charcoal hover:bg-charcoal/90 text-white rounded-full font-semibold transition-all text-xs focus-visible:ring-2 focus-visible:ring-amber/50 focus-visible:ring-offset-1"
              >
                <span className="hidden sm:inline">Submit a Price</span>
                <span className="sm:hidden">Submit</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ═══ HERO — compact branding moment ═══ */}
      <div ref={heroRef}>
        <HeroSection pubs={pubs} />
      </div>

      {/* ═══ FILTER BAR — below header, above content ═══ */}
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
        vibeTagFilter={vibeTagFilter}
        setVibeTagFilter={setVibeTagFilter}
        kidFriendlyOnly={kidFriendlyOnly}
        setKidFriendlyOnly={setKidFriendlyOnly}
        hasTabOnly={hasTabOnly}
        setHasTabOnly={setHasTabOnly}
      />

      {/* ═══ CONTENT ═══ */}
      <div ref={contentRef} className="max-w-5xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8 pb-6 sm:pb-8">
        <MyLocals pubs={pubs} userLocation={userLocation} />

        <div className="flex items-center justify-between mb-3">
          <p className="text-stone-500 text-sm">
            Displaying <span className="font-semibold text-charcoal">{showAllPubs ? filteredPubs.length : Math.min(INITIAL_PUB_COUNT, filteredPubs.length)}</span> of {filteredPubs.length} venues
          </p>
          {filteredPubs.length > INITIAL_PUB_COUNT && (
            <button
              onClick={() => setShowAllPubs(!showAllPubs)}
              className="text-sm font-semibold text-charcoal hover:text-amber transition-colors flex items-center gap-1 focus-visible:ring-2 focus-visible:ring-amber/50 focus-visible:ring-offset-1 rounded-lg"
            >
              {showAllPubs ? 'Show Less' : `View All`}
              <svg className={`w-4 h-4 transition-transform ${showAllPubs ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
            </button>
          )}
        </div>

        {viewMode === 'list' && (
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

        {viewMode === 'cards' && (
          <PubCardsView
            pubs={filteredPubs}
            userLocation={userLocation}
            showAll={showAllPubs}
            initialCount={INITIAL_PUB_COUNT}
            onShowAll={() => setShowAllPubs(true)}
          />
        )}

        {filteredPubs.length === 0 && (
          <div className="text-center py-16 bg-white rounded-xl shadow-sm">
            <div className="text-5xl mb-4">{showHappyHourOnly ? '\u{1F37B}' : '\u{1F50D}'}</div>
            <h3 className="font-serif text-xl text-charcoal mb-2">{showHappyHourOnly ? 'No pubs with happy hour info yet' : 'No pubs found'}</h3>
            <p className="text-stone-500 text-sm">{showHappyHourOnly ? 'We\u2019re building our happy hour database \u2014 submit yours!' : 'Try adjusting your filters'}</p>
          </div>
        )}

        {/* Map below pub list */}
        <button
          onClick={() => setShowMap(!showMap)}
          className="flex items-center gap-2 text-sm text-stone-500 hover:text-charcoal transition-colors mb-3 mt-6 focus-visible:ring-2 focus-visible:ring-amber/50 focus-visible:ring-offset-1 rounded-lg"
          aria-pressed={showMap}
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
          {showMap ? 'Hide map' : 'Show map'}
        </button>

        {showMap && (
          <div className="mb-6 rounded-xl overflow-hidden shadow-sm relative z-0 isolate">
            <Map pubs={filteredPubs} userLocation={userLocation} totalPubCount={pubs.length} />
          </div>
        )}
      </div>

      <HowItWorks />
      <SocialProof venueCount={stats.total} suburbCount={suburbs.length} avgPrice={stats.avgPrice} />
      <FAQ />
      <Footer />
      <div className="h-9" /> {/* Spacer for fixed bottom ticker */}
      <PriceTicker pubs={pubs} />

      <SubmitPubForm isOpen={showSubmitForm} onClose={() => setShowSubmitForm(false)} userLocation={userLocation} />

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

export default function Home() {
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <HomeContent />
    </Suspense>
  )
}
