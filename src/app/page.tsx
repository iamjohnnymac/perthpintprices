'use client'
import Link from 'next/link'

import { useState, useMemo, useEffect, useRef } from 'react'
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

/* ═══════════════════════════════════════ */
/* ═══  HOW IT WORKS SECTION            ═══ */
/* ═══════════════════════════════════════ */
function HowItWorks() {
  const steps = [
    {
      num: '01',
      title: 'Find pubs near you',
      desc: 'Browse 200+ pubs across 90 Perth suburbs with real-time prices and happy hour info.',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
        </svg>
      ),
    },
    {
      num: '02',
      title: 'Compare prices',
      desc: 'See how every pub stacks up against the Perth average. Track happy hours and price changes.',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
        </svg>
      ),
    },
    {
      num: '03',
      title: 'Go enjoy your pint',
      desc: 'Get directions, check the vibe, and save money on your next round. Simple as.',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.182 15.182a4.5 4.5 0 01-6.364 0M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75zm-.375 0h.008v.015h-.008V9.75zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75z" />
        </svg>
      ),
    },
  ]

  return (
    <section className="py-16 border-t border-stone-200">
      <div className="max-w-4xl mx-auto px-4">
        <h2 className="text-3xl sm:text-4xl font-bold text-charcoal font-heading text-center mb-3">
          How it works
        </h2>
        <p className="text-stone-500 text-center mb-12 text-lg">No app download. No sign-up. Just prices.</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-12">
          {steps.map((step) => (
            <div key={step.num} className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber/10 text-amber mb-5">
                {step.icon}
              </div>
              <div className="text-sm font-mono text-amber font-bold mb-2">{step.num}</div>
              <h3 className="text-xl font-bold text-charcoal mb-2 font-heading">{step.title}</h3>
              <p className="text-stone-500 leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ═══════════════════════════════════════ */
/* ═══  FAQ SECTION                     ═══ */
/* ═══════════════════════════════════════ */
function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  const faqs = [
    {
      q: 'How are prices verified?',
      a: 'Every price on PintDex is manually verified through pub menus, direct calls, and community submissions. We never estimate or guess — if we don\'t have a verified price, we show "Price TBC" until we confirm it.',
    },
    {
      q: 'How often is the data updated?',
      a: 'We run automated checks weekly and accept community submissions around the clock. Every price includes a "last verified" date so you know how fresh it is.',
    },
    {
      q: 'What does the price represent?',
      a: 'All prices shown are for a standard pint (570ml) of the cheapest tap beer available at each venue. Happy hour prices are shown when they\'re currently active.',
    },
    {
      q: 'How can I submit a price?',
      a: 'Tap the "Submit a Price" button at the top of the page. Tell us the pub name, suburb, and the pint price you paid. We\'ll verify and add it to the database.',
    },
    {
      q: 'Why is a pub showing "Price TBC"?',
      a: 'We only display prices we\'ve confirmed. "Price TBC" means we know the pub exists but haven\'t verified its current pint price yet. You can help by submitting it!',
    },
    {
      q: 'Is PintDex free?',
      a: 'Yep — completely free. No app download, no sign-up, no ads. Just Perth pint prices, sorted.',
    },
  ]

  return (
    <section className="py-16 border-t border-stone-200">
      <div className="max-w-3xl mx-auto px-4">
        <h2 className="text-3xl sm:text-4xl font-bold text-charcoal font-heading text-center mb-3">
          Questions?
        </h2>
        <p className="text-stone-500 text-center mb-10 text-lg">Everything you need to know about PintDex.</p>
        <div className="space-y-0">
          {faqs.map((faq, i) => (
            <div key={i} className="border-b border-stone-200">
              <button
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="w-full flex items-center justify-between py-5 text-left group"
              >
                <span className="text-lg font-semibold text-charcoal group-hover:text-amber transition-colors pr-4">
                  {faq.q}
                </span>
                <svg
                  className={`w-5 h-5 text-stone-400 flex-shrink-0 transition-transform duration-200 ${openIndex === i ? 'rotate-180' : ''}`}
                  fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {openIndex === i && (
                <div className="pb-5 text-stone-600 leading-relaxed -mt-1">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ═══════════════════════════════════════ */
/* ═══  SOCIAL PROOF / STATS BAR        ═══ */
/* ═══════════════════════════════════════ */
function SocialProof({ stats }: { stats: { total: number; avgPrice: string } }) {
  const proofs = [
    { value: `${stats.total}+`, label: 'Venues tracked' },
    { value: '90', label: 'Perth suburbs' },
    { value: `$${stats.avgPrice}`, label: 'Perth average pint' },
    { value: '100%', label: 'Verified prices' },
  ]
  return (
    <section className="py-12 border-t border-stone-200 bg-cream-dark">
      <div className="max-w-5xl mx-auto px-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
          {proofs.map((p) => (
            <div key={p.label}>
              <div className="text-3xl sm:text-4xl font-black text-charcoal font-heading">{p.value}</div>
              <div className="text-stone-500 text-sm mt-1">{p.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
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
  const [heroVisible, setHeroVisible] = useState(true)
  const INITIAL_PUB_COUNT = 20
  const appRef = useRef<HTMLDivElement>(null)

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

  function scrollToApp() {
    setHeroVisible(false)
    appRef.current?.scrollIntoView({ behavior: 'smooth' })
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

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* ═══  HERO SECTION — EatClub-style brand-first landing       ═══ */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {heroVisible && (
        <section className="bg-cream relative overflow-hidden">
          {/* Top nav bar — minimal like EatClub */}
          <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <img src="/logo.png" alt="PintDex" className="w-10 h-10 rounded-lg object-contain" />
              <span className="text-xl font-extrabold tracking-tight font-heading text-charcoal">PintDex</span>
            </div>
            <button
              onClick={() => setShowSubmitForm(true)}
              className="px-5 py-2.5 bg-charcoal hover:bg-charcoal/90 text-white rounded-full font-bold transition-all text-sm"
            >
              Submit a Price
            </button>
          </div>

          {/* Hero content — big, confident, breathing room */}
          <div className="max-w-4xl mx-auto px-4 pt-12 sm:pt-20 pb-16 sm:pb-24 text-center">
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-charcoal font-heading leading-[1.05] mb-6">
              Perth&apos;s pint prices,{' '}
              <span className="text-amber">sorted.</span>
            </h1>
            <p className="text-lg sm:text-xl text-stone-500 max-w-2xl mx-auto mb-10 leading-relaxed">
              Real-time prices across {stats.total}+ pubs and {suburbs.length} suburbs.
              Find happy hours, compare prices, and save on your next round.
            </p>

            {/* Hero stat highlights — EatClub-style bold numbers */}
            <div className="flex flex-wrap justify-center gap-4 sm:gap-8 mb-10">
              <div className="bg-white rounded-2xl px-5 py-3 shadow-sm border border-stone-200/60">
                <span className="block text-2xl sm:text-3xl font-black font-mono text-green-700">${stats.minPrice}</span>
                <span className="text-xs text-stone-500">Cheapest pint</span>
              </div>
              <div className="bg-white rounded-2xl px-5 py-3 shadow-sm border border-stone-200/60">
                <span className="block text-2xl sm:text-3xl font-black font-mono text-charcoal">${stats.avgPrice}</span>
                <span className="text-xs text-stone-500">Perth average</span>
              </div>
              {stats.happyHourNow > 0 && (
                <div className="bg-white rounded-2xl px-5 py-3 shadow-sm border border-amber/30 bg-amber/5">
                  <span className="block text-2xl sm:text-3xl font-black font-mono text-amber">{stats.happyHourNow}</span>
                  <span className="text-xs text-stone-500">Happy hours live</span>
                </div>
              )}
            </div>

            {/* CTA buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={scrollToApp}
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-charcoal hover:bg-charcoal/90 text-white rounded-full font-bold text-lg transition-all shadow-lg shadow-charcoal/10"
              >
                Explore {stats.total} venues
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </button>
              <button
                onClick={() => { scrollToApp(); setActiveTab('explore'); }}
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white hover:bg-stone-50 text-charcoal rounded-full font-bold text-lg transition-all border border-stone-300"
              >
                Discover features
              </button>
            </div>
          </div>
        </section>
      )}


      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* ═══  APP SECTION — the full PintDex experience              ═══ */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <div ref={appRef}>
        <PriceTicker pubs={pubs} />
        <header className="bg-white sticky top-0 z-[1000] shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
          {/* Compact brand bar */}
          <div className="max-w-7xl mx-auto px-4 pt-2.5 pb-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <img src="/logo.png" alt="PintDex" className="w-10 h-10 rounded-lg flex-shrink-0 object-contain" />
                <h1 className="text-lg font-extrabold tracking-tight leading-none font-heading text-charcoal">PintDex</h1>
                <div className="flex items-center gap-1 ml-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber animate-pulse" />
                  <span className="text-[10px] text-amber/70 uppercase tracking-wider font-medium">Live</span>
                </div>
              </div>
              <button
                onClick={() => setShowSubmitForm(true)}
                className="flex-shrink-0 flex items-center gap-1.5 px-3.5 py-2 bg-charcoal hover:bg-charcoal/90 text-white rounded-full font-bold transition-all text-xs"
              >
                <span className="hidden sm:inline">+ Submit a Price</span>
                <span className="sm:hidden text-base leading-none font-bold">+</span>
              </button>
            </div>

            {/* Stat pods — warm amber accent */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2.5 pb-2.5">
              <div className="bg-stone-50 rounded-lg px-2.5 py-1.5 border border-stone-200">
                <span className="text-stone-500 text-[9px] uppercase tracking-wider block leading-none">Perth Avg</span>
                <span className="text-charcoal font-mono font-black text-base sm:text-lg leading-tight">${stats.avgPrice}</span>
                <span className="text-stone-400 text-[9px] block leading-none mt-0.5">{stats.total} venues</span>
              </div>
              <div className="bg-stone-50 rounded-lg px-2.5 py-1.5 border border-stone-200">
                <span className="text-stone-500 text-[9px] uppercase tracking-wider block leading-none">Cheapest</span>
                <span className="text-green-700 font-mono font-black text-base sm:text-lg leading-tight">${stats.minPrice}</span>
                <span className="text-stone-400 text-[9px] block leading-none mt-0.5 truncate">{stats.cheapestSuburb}</span>
              </div>
              <div className="bg-stone-50 rounded-lg px-2.5 py-1.5 border border-stone-200">
                <span className="text-stone-500 text-[9px] uppercase tracking-wider block leading-none">Priciest</span>
                <span className="text-red-700 font-mono font-black text-base sm:text-lg leading-tight">${stats.maxPriceValue}</span>
                <span className="text-stone-400 text-[9px] block leading-none mt-0.5 truncate">{stats.priciestSuburb}</span>
              </div>
              <div className="bg-stone-50 rounded-lg px-2.5 py-1.5 border border-stone-200">
                <span className="text-stone-500 text-[9px] uppercase tracking-wider block leading-none">Happy Hour</span>
                <span className="text-amber font-mono font-black text-base sm:text-lg leading-tight">{stats.happyHourNow}</span>
                <span className="text-stone-400 text-[9px] block leading-none mt-0.5">{suburbs.length} suburbs</span>
              </div>
            </div>
          </div>

          {/* Tab navigation */}
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
                        className={`border-b border-stone-100 hover:bg-amber/5 transition-colors cursor-pointer ${
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
                                  className="flex-shrink-0 text-stone-300 hover:text-amber transition-colors"
                                  title="Get directions"
                                >
                                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                                  </svg>
                                </a>
                                <Link href={`/pub/${pub.slug}`} className="font-semibold text-stone-900 text-sm hover:text-amber transition-colors">{pub.name}</Link>
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
                              happyHourStatus.isActive ? 'text-amber font-bold' : 
                              happyHourStatus.isToday ? 'text-amber-dark font-semibold' : 
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
                              className="text-xs text-stone-400 hover:text-amber"
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
                  className="w-full py-3 text-sm font-medium text-charcoal hover:text-amber hover:bg-amber/5 transition-colors flex items-center justify-center gap-1 border-t border-stone-200"
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
                className="w-full mt-4 py-3 text-sm font-medium text-charcoal hover:text-amber bg-white hover:bg-amber/5 rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.06)] border border-stone-200/60 transition-colors flex items-center justify-center gap-1"
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

        {/* ═══  HOW IT WORKS  ═══ */}
        <HowItWorks />

        {/* ═══  SOCIAL PROOF  ═══ */}
        <SocialProof stats={stats} />

        {/* ═══  FAQ  ═══ */}
        <FAQ />

        {/* ═══  FOOTER  ═══ */}
        <footer className="bg-charcoal text-white py-12">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6 mb-8">
              <div className="flex items-center gap-2.5">
                <img src="/logo.png" alt="PintDex" className="w-10 h-10 rounded-lg object-contain" />
                <span className="text-xl font-extrabold tracking-tight font-heading">PintDex</span>
              </div>
              <p className="text-stone-400 text-sm text-center">Perth&apos;s pint prices, sorted. Community-driven since 2024.</p>
            </div>

            <div className="flex flex-wrap justify-center gap-6 mb-8 pb-8 border-b border-stone-700">
              <div className="flex items-center gap-2">
                <span className="text-amber text-lg">⬡</span>
                <div>
                  <p className="font-semibold text-white">Schooner</p>
                  <p className="text-xs text-stone-400">425ml</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-amber text-lg">⬡</span>
                <div>
                  <p className="font-semibold text-amber">Pint</p>
                  <p className="text-xs text-stone-400">570ml</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-amber text-lg">⬡</span>
                <div>
                  <p className="font-semibold text-white">Long Neck</p>
                  <p className="text-xs text-stone-400">750ml</p>
                </div>
              </div>
            </div>

            <div className="text-center">
              <p className="text-stone-400 text-xs">Prices may vary. Pint prices shown. Always drink responsibly.</p>
              <a
                href="mailto:perthpintprices@gmail.com?subject=Price%20Correction&body=Hi%2C%20I%20noticed%20a%20wrong%20price%20on%20the%20site.%0A%0APub%20name%3A%20%0ACorrect%20price%3A%20%0ADetails%3A%20"
                className="inline-block mt-3 text-amber hover:text-amber-light text-xs"
              >
                Report Wrong Price
              </a>
            </div>
          </div>
        </footer>
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
