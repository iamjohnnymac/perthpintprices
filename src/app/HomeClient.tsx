'use client'
// Production deploy trigger
import { useState, useMemo, useEffect, useRef, useCallback, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Pub } from '@/types/pub'
import { getPubs, getCrowdLevels, CrowdReport } from '@/lib/supabase'

import { getDistanceKm } from '@/lib/location'
import Link from 'next/link'
// Extracted components
import HeroSection from '@/components/HeroSection'
import { FilterSection } from '@/components/FilterSection'
import PubCardList from '@/components/PubCardList'
import HowItWorks from '@/components/HowItWorks'
import SocialProof from '@/components/SocialProof'
import FAQ from '@/components/FAQ'
import Footer from '@/components/Footer'
import SubmitPubForm from '@/components/SubmitPubForm'
import CrowdReporter from '@/components/CrowdReporter'

const INITIAL_PUB_COUNT = 10

function LoadingSkeleton() {
  return (
    <main className="min-h-screen bg-white flex items-center justify-center">
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
  // showMap state removed — now handled by MapPeek component
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
    <main className="min-h-screen bg-white">
      {/* ═══ HEADER — minimal monospace with pill CTA ═══ */}
      <header ref={headerRef} className="max-w-container mx-auto px-6 py-6 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 no-underline">
          <div className="w-7 h-7 bg-amber border-2 border-ink rounded-md flex items-center justify-center text-sm shadow-[2px_2px_0_#171717]">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 2v20M2 12h20M4.93 4.93l14.14 14.14M19.07 4.93L4.93 19.07" stroke="white" strokeWidth="2.5" strokeLinecap="round"/></svg>
          </div>
          <span className="font-mono text-[1.6rem] font-extrabold text-ink tracking-[-0.04em]">arvo</span>
        </Link>
        <button
          onClick={() => setShowSubmitForm(true)}
          className="font-mono text-[0.72rem] font-bold uppercase tracking-[0.05em] text-ink bg-white border-3 border-ink rounded-pill px-5 py-2.5 shadow-hard-sm hover:translate-x-[1.5px] hover:translate-y-[1.5px] hover:shadow-hard-hover transition-all cursor-pointer"
          data-submit-trigger
        >
          Submit a Price
        </button>
      </header>

      {/* ═══ HERO — beer glass, dots, stat strip ═══ */}
      <div ref={heroRef}>
        <HeroSection pubs={pubs} />
      </div>

      {/* ═══ LIVE HAPPY HOUR BANNER ═══ */}
      {(() => {
        const liveHH = pubs.find(p => p.isHappyHourNow)
        if (!liveHH) return null
        return (
          <Link href="/happy-hour" className="block max-w-container mx-auto px-6 mb-5">
            <div className="bg-ink border-3 border-ink rounded-pill px-6 py-3 flex items-center gap-3 shadow-hard">
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <span className="w-2 h-2 rounded-full bg-green shadow-[0_0_8px_rgba(45,122,61,0.5)] animate-pulse" />
                <span className="font-mono font-bold text-[0.72rem] uppercase tracking-[0.05em] text-white">Live</span>
              </div>
              <span className="text-white font-medium text-[0.85rem] flex-1 truncate">
                <strong className="text-amber-light font-bold">{liveHH.name}</strong> has ${liveHH.price?.toFixed(2)} pints right now
              </span>
              <span className="font-mono font-extrabold text-[1.1rem] text-amber-light flex-shrink-0">
                ${liveHH.price?.toFixed(2)}
              </span>
            </div>
          </Link>
        )
      })()}

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

      {/* ═══ PUB LIST ═══ */}
      <div ref={contentRef}>
        <PubCardList
          pubs={filteredPubs}
          crowdReports={crowdReports}
          userLocation={userLocation}
          onCrowdReport={setCrowdReportPub}
          showAll={showAllPubs}
          initialCount={INITIAL_PUB_COUNT}
          onShowAll={() => setShowAllPubs(true)}
        />
      </div>

      <HowItWorks venueCount={pubs.length} suburbCount={suburbs.length} />
      <SocialProof venueCount={stats.total} suburbCount={suburbs.length} avgPrice={stats.avgPrice} />
      <FAQ />
      <Footer />

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

export default function HomeClient() {
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <HomeContent />
    </Suspense>
  )
}
