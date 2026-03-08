'use client'
// Production deploy trigger
import { useState, useMemo, useEffect, useRef, useCallback, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Pub } from '@/types/pub'
import { getCrowdLevels, CrowdReport } from '@/lib/supabase'

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
import MobileNav from '@/components/MobileNav'
import PintIndexBadge from '@/components/PintIndexBadge'
import ScrollReveal from '@/components/ScrollReveal'

const INITIAL_PUB_COUNT = 10

function LoadingSkeleton() {
  return (
    <main className="min-h-screen bg-[#FDF8F0] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        {/* Branded beer glass loading animation */}
        <div className="w-[60px] h-[80px] relative animate-pulse">
          <div className="w-[46px] h-[62px] mx-auto relative border-3 border-ink rounded-[3px_3px_6px_6px] overflow-hidden bg-amber-pale">
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-amber to-amber-light animate-beer-fill" style={{ height: '100%' }} />
            <div className="absolute -top-[5px] -left-[2px] -right-[2px] h-[18px] bg-[#FFFEF0] rounded-[12px_12px_40%_40%] border-3 border-ink border-b-0 animate-foam-wobble" />
            <div className="absolute -right-[14px] top-[12px] w-[12px] h-[28px] border-3 border-ink border-l-0 rounded-[0_8px_8px_0] bg-white" />
          </div>
        </div>
        <span className="font-mono text-[0.75rem] font-bold uppercase tracking-[0.1em] text-gray-mid">Loading pubs...</span>
      </div>
    </main>
  )
}

interface HomeClientProps {
  initialPubs: Pub[]
  initialStats: { venueCount: number; suburbCount: number; avgPrice: string; cheapestPrice: string }
}

function HomeContent({ initialPubs }: { initialPubs: Pub[] }) {
  const searchParams = useSearchParams()
  const router = useRouter()

  const [pubs] = useState<Pub[]>(initialPubs)
  const [isLoading] = useState(false)
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
  const [nearbyRadius, setNearbyRadius] = useState<number>(5) // km - 1, 3, 5, or 0 = all
  const [beerTypeFilter, setBeerTypeFilter] = useState<string>('')
  const [scrolledPastHero, setScrolledPastHero] = useState(false)
  // showMap state removed - now handled by MapPeek component
  const heroRef = useRef<HTMLDivElement>(null)
  const headerRef = useRef<HTMLElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  // Auto-open submit form when ?submit=1 is in URL (e.g. from suburb page links)
  useEffect(() => {
    if (searchParams.get('submit') === '1') {
      setShowSubmitForm(true)
      // Clean the param from URL
      const params = new URLSearchParams(searchParams.toString())
      params.delete('submit')
      const newUrl = params.toString() ? `?${params.toString()}` : '/'
      router.replace(newUrl, { scroll: false })
    }
  }, [searchParams, router])

  // P2a: New filter state
  const [vibeTagFilter, setVibeTagFilter] = useState(searchParams.get('vibe') || '')
  const [kidFriendlyOnly, setKidFriendlyOnly] = useState(searchParams.get('kids') === '1')
  const [hasTabOnly, setHasTabOnly] = useState(searchParams.get('tab') === '1')

  // P2a: URL sync - update URL params on filter change
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

  // Manual location request (triggered by NEAREST button when location not yet granted)
  const requestLocation = () => {
    if (typeof window !== 'undefined' && navigator.geolocation) {
      setLocationState('idle')
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
  }

  // Unified nav: expand when scrolled past hero (LATCHES - never collapses back)
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

  const normalizeBeerType = useCallback((type: string): string | null => {
    const t = type.toLowerCase()
    if (t === 'schooners') return null // glass size, not a beer type
    if (/^house\s/.test(t) || t === 'all pints') return 'House Beer'
    if (t === 'selected tap' || t === 'tap beer') return 'Tap Beer'
    return type // keep as-is: Swan Draught, Emu Export, Guinness, Craft Beer, etc.
  }, [])

  const beerTypes = useMemo(() => {
    const counts = new Map<string, number>()
    pubs.forEach(p => {
      if (!p.beerType) return
      const normalized = normalizeBeerType(p.beerType)
      if (normalized) counts.set(normalized, (counts.get(normalized) || 0) + 1)
    })
    return Array.from(counts.entries())
      .filter(([, cnt]) => cnt >= 2)
      .sort((a, b) => b[1] - a[1])
      .map(([type]) => type)
  }, [pubs, normalizeBeerType])

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
        const matchesRadius = !(sortBy === 'nearest' && userLocation && nearbyRadius > 0) ||
          getDistanceKm(userLocation!.lat, userLocation!.lng, pub.lat, pub.lng) <= nearbyRadius
        const matchesBeerType = !beerTypeFilter || (pub.beerType && normalizeBeerType(pub.beerType) === beerTypeFilter)
        return matchesSearch && matchesSuburb && matchesPrice && matchesHappyHour && matchesVibe && matchesKids && matchesTab && matchesRadius && matchesBeerType
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
  }, [pubs, searchTerm, selectedSuburb, maxPrice, sortBy, showHappyHourOnly, userLocation, vibeTagFilter, kidFriendlyOnly, hasTabOnly, nearbyRadius, beerTypeFilter])

  const stats = useMemo(() => {
    if (pubs.length === 0) return { total: 0, minPrice: 0, maxPriceValue: 0, avgPrice: '0', happyHourNow: 0, cheapestSuburb: '', cheapestSlug: '', priciestSuburb: '', priciestSlug: '' }
    const priced = pubs.filter(p => p.price !== null && p.priceVerified)
    const minP = priced.length > 0 ? Math.min(...priced.map(p => p.price!)) : 0
    const maxP = priced.length > 0 ? Math.max(...priced.map(p => p.price!)) : 0
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
    <main className="min-h-screen bg-[#FDF8F0]">
      {/* ═══ HEADER - minimal monospace with pill CTA ═══ */}
      <header ref={headerRef} className="max-w-container mx-auto px-6 py-6 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 no-underline">
          <div className="w-7 h-7 bg-amber border-2 border-ink rounded-md flex items-center justify-center text-sm shadow-[2px_2px_0_#171717]">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 2v20M2 12h20M4.93 4.93l14.14 14.14M19.07 4.93L4.93 19.07" stroke="white" strokeWidth="2.5" strokeLinecap="round"/></svg>
          </div>
          <span className="font-mono text-[1.6rem] font-extrabold text-ink tracking-[-0.04em]">arvo</span>
        </Link>
        <nav className="hidden sm:flex items-center gap-0.5">
          {[
            { href: '/discover', label: 'Discover' },
            { href: '/happy-hour', label: 'Happy Hours' },
            { href: '/weekly-report', label: 'Pint Report' },
          ].map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="font-mono text-[0.7rem] font-bold uppercase tracking-[0.04em] text-gray-mid hover:text-amber transition-colors no-underline px-2.5 py-1.5"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <PintIndexBadge />
          <button
            onClick={() => setShowSubmitForm(true)}
            className="hidden sm:inline-flex font-mono text-[0.72rem] font-bold uppercase tracking-[0.05em] text-ink bg-white border-3 border-ink rounded-pill px-5 py-2.5 shadow-hard-sm hover:translate-x-[1.5px] hover:translate-y-[1.5px] hover:shadow-hard-hover transition-all cursor-pointer"
            data-submit-trigger
          >
            Submit a Price
          </button>
          <MobileNav />
        </div>
      </header>

      {/* ═══ HERO - beer glass, dots, stat strip ═══ */}
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

      {/* ═══ FILTER BAR - below header, above content ═══ */}
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
        locationState={locationState}
        requestLocation={requestLocation}
        nearbyRadius={nearbyRadius}
        setNearbyRadius={setNearbyRadius}
        beerTypes={beerTypes}
        beerTypeFilter={beerTypeFilter}
        setBeerTypeFilter={setBeerTypeFilter}
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

      <ScrollReveal><HowItWorks venueCount={pubs.length} suburbCount={suburbs.length} /></ScrollReveal>
      <ScrollReveal><SocialProof venueCount={pubs.length} suburbCount={suburbs.length} avgPrice={stats.avgPrice} cheapestPrice={stats.minPrice} priciestPrice={stats.maxPriceValue} onSubmitClick={() => setShowSubmitForm(true)} /></ScrollReveal>
      <ScrollReveal><FAQ /></ScrollReveal>
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

export default function HomeClient({ initialPubs, initialStats }: HomeClientProps) {
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <HomeContent initialPubs={initialPubs} />
    </Suspense>
  )
}
