"use client"

import { Search, SlidersHorizontal, ChevronDown, X, MapPin, LayoutGrid, List, Clock, Map as MapIcon } from "lucide-react"
import { useState, useRef, useEffect } from "react"
import { cn } from "@/lib/utils"

const VIBE_TAGS = [
  "Beachside chill",
  "Family-friendly",
  "Golf Club",
  "Hidden gem",
  "Lively nightspot",
  "Local favourite",
  "Neighbourhood local",
  "Perth institution",
  "Sunset sessions",
] as const

interface FilterSectionProps {
  viewMode: 'cards' | 'list'
  setViewMode: (mode: 'cards' | 'list') => void
  searchTerm: string
  setSearchTerm: (term: string) => void
  selectedSuburb: string
  setSelectedSuburb: (suburb: string) => void
  suburbs: string[]
  showHappyHourOnly: boolean
  setShowHappyHourOnly: (show: boolean) => void
  showMiniMaps: boolean
  setShowMiniMaps: (show: boolean) => void
  sortBy: 'price' | 'name' | 'suburb' | 'nearest' | 'freshness'
  setSortBy: (sort: 'price' | 'name' | 'suburb' | 'nearest' | 'freshness') => void
  maxPrice: number
  setMaxPrice: (price: number) => void
  showMoreFilters: boolean
  setShowMoreFilters: (show: boolean) => void
  stats: { happyHourNow: number }
  hasLocation?: boolean
  // P2a: new filter props
  vibeTagFilter: string
  setVibeTagFilter: (vibe: string) => void
  kidFriendlyOnly: boolean
  setKidFriendlyOnly: (val: boolean) => void
  hasTabOnly: boolean
  setHasTabOnly: (val: boolean) => void
}

export function FilterSection({
  viewMode,
  setViewMode,
  searchTerm,
  setSearchTerm,
  selectedSuburb,
  setSelectedSuburb,
  suburbs,
  showHappyHourOnly,
  setShowHappyHourOnly,
  showMiniMaps,
  setShowMiniMaps,
  sortBy,
  setSortBy,
  maxPrice,
  setMaxPrice,
  showMoreFilters,
  setShowMoreFilters,
  stats,
  hasLocation,
  vibeTagFilter,
  setVibeTagFilter,
  kidFriendlyOnly,
  setKidFriendlyOnly,
  hasTabOnly,
  setHasTabOnly,
}: FilterSectionProps) {
  const isNearestActive = sortBy === 'nearest' && hasLocation
  const dropdownRef = useRef<HTMLDivElement>(null)

  const activeFilterCount =
    (selectedSuburb && selectedSuburb !== 'all' ? 1 : 0) +
    (maxPrice < 20 ? 1 : 0) +
    (sortBy !== 'price' && sortBy !== 'nearest' ? 1 : 0) +
    (showHappyHourOnly ? 1 : 0) +
    (isNearestActive ? 1 : 0) +
    (vibeTagFilter ? 1 : 0) +
    (kidFriendlyOnly ? 1 : 0) +
    (hasTabOnly ? 1 : 0)

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowMoreFilters(false)
      }
    }
    if (showMoreFilters) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [showMoreFilters, setShowMoreFilters])

  // P2c: Close filter dropdown on Escape
  useEffect(() => {
    if (!showMoreFilters) return
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setShowMoreFilters(false)
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [showMoreFilters, setShowMoreFilters])

  const handleClearAll = () => {
    setSortBy('price')
    setMaxPrice(15)
    setSelectedSuburb('all')
    setSearchTerm('')
    setShowHappyHourOnly(false)
    setVibeTagFilter('')
    setKidFriendlyOnly(false)
    setHasTabOnly(false)
  }

  return (
    <div className="sticky top-[var(--nav-height,120px)] z-[999] border-t border-stone-200/60 bg-white/95 backdrop-blur-sm">
      {/* EatClub-style toolbar: SEARCH | NEARBY | FILTER */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-2">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search pubs or suburbs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            aria-label="Search pubs or suburbs"
            className="w-full pl-9 pr-8 py-2.5 text-sm bg-cream border border-stone-200/60 rounded-full text-charcoal placeholder-stone-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber/50 focus-visible:ring-offset-1 focus:border-amber transition-colors"
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 focus-visible:ring-2 focus-visible:ring-amber/50 focus-visible:ring-offset-1 rounded-full" aria-label="Clear search">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Nearby toggle pill */}
        {hasLocation && (
          <button
            onClick={() => setSortBy(sortBy === 'nearest' ? 'price' : 'nearest')}
            aria-pressed={isNearestActive}
            className={cn(
              "flex items-center gap-1.5 px-3 py-2.5 rounded-full text-sm font-medium transition-all whitespace-nowrap border focus-visible:ring-2 focus-visible:ring-amber/50 focus-visible:ring-offset-1",
              isNearestActive
                ? "bg-amber/10 text-amber border-amber/40 border-2"
                : "bg-cream text-stone-warm border-stone-200/60 hover:border-stone-300"
            )}
          >
            <MapPin className="h-3 w-3" />
            Nearby{isNearestActive ? ': on' : ''}
          </button>
        )}

        {/* Filter button */}
        <div className="relative flex-shrink-0" ref={dropdownRef}>
          <button
            onClick={() => setShowMoreFilters(!showMoreFilters)}
            aria-expanded={showMoreFilters}
            className={cn(
              "flex items-center gap-1.5 px-3 py-2.5 rounded-full text-sm font-medium transition-all border whitespace-nowrap focus-visible:ring-2 focus-visible:ring-amber/50 focus-visible:ring-offset-1",
              showMoreFilters || activeFilterCount > 0
                ? "bg-amber/10 text-amber border-amber/40 border-2"
                : "bg-cream text-stone-warm border-stone-200/60 hover:border-stone-300"
            )}
          >
            <SlidersHorizontal className="h-3 w-3" />
            Filter
            {activeFilterCount > 0 && (
              <span className="bg-amber/20 text-amber text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-bold">
                {activeFilterCount}
              </span>
            )}
          </button>

          {showMoreFilters && (
            <div
              role="dialog"
              aria-label="Filter options"
              className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-lg border border-stone-200/40 p-5 z-50"
            >
              {/* View Mode */}
              <div className="mb-5">
                <label className="block text-xs font-medium text-stone-500 mb-2">View</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setViewMode('cards')}
                    aria-pressed={viewMode === 'cards'}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all focus-visible:ring-2 focus-visible:ring-amber/50 focus-visible:ring-offset-1",
                      viewMode === 'cards' ? "bg-amber text-white" : "bg-cream text-stone-warm hover:bg-cream-dark"
                    )}
                  >
                    <LayoutGrid className="h-3.5 w-3.5" /> Cards
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    aria-pressed={viewMode === 'list'}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all focus-visible:ring-2 focus-visible:ring-amber/50 focus-visible:ring-offset-1",
                      viewMode === 'list' ? "bg-amber text-white" : "bg-cream text-stone-warm hover:bg-cream-dark"
                    )}
                  >
                    <List className="h-3.5 w-3.5" /> List
                  </button>
                </div>
              </div>

              {/* Suburb */}
              <div className="mb-5">
                <label className="block text-xs font-medium text-stone-500 mb-2">Suburb</label>
                <select
                  value={selectedSuburb || 'all'}
                  onChange={(e) => setSelectedSuburb(e.target.value)}
                  className="w-full text-sm bg-cream border border-stone-200/60 rounded-lg px-3 py-2.5 text-charcoal focus:outline-none focus-visible:ring-2 focus-visible:ring-amber/50 focus-visible:ring-offset-1 focus:border-amber transition-colors cursor-pointer"
                >
                  <option value="all">All Suburbs</option>
                  {suburbs.map(suburb => (
                    <option key={suburb} value={suburb}>{suburb}</option>
                  ))}
                </select>
              </div>

              {/* P2a: Vibe Tag */}
              <div className="mb-5">
                <label className="block text-xs font-medium text-stone-500 mb-2">Vibe</label>
                <select
                  value={vibeTagFilter}
                  onChange={(e) => setVibeTagFilter(e.target.value)}
                  className="w-full text-sm bg-cream border border-stone-200/60 rounded-lg px-3 py-2.5 text-charcoal focus:outline-none focus-visible:ring-2 focus-visible:ring-amber/50 focus-visible:ring-offset-1 focus:border-amber transition-colors cursor-pointer"
                >
                  <option value="">All Vibes</option>
                  {VIBE_TAGS.map(vibe => (
                    <option key={vibe} value={vibe}>{vibe}</option>
                  ))}
                </select>
              </div>

              {/* Toggles */}
              <div className="mb-5 space-y-2">
                <label className="block text-xs font-medium text-stone-500 mb-2">Toggles</label>
                <button
                  onClick={() => setShowHappyHourOnly(!showHappyHourOnly)}
                  aria-pressed={showHappyHourOnly}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-all border focus-visible:ring-2 focus-visible:ring-amber/50 focus-visible:ring-offset-1",
                    showHappyHourOnly
                      ? "bg-amber/10 text-amber border-amber/30 font-medium"
                      : "bg-cream text-stone-warm border-stone-200/60 hover:bg-cream-dark"
                  )}
                >
                  <span className="flex items-center gap-2"><Clock className="h-3.5 w-3.5" /> Happy Hour Only</span>
                  {stats.happyHourNow > 0 && <span className="text-xs bg-amber/20 text-amber px-1.5 py-0.5 rounded-full font-semibold">{stats.happyHourNow}</span>}
                </button>

                {/* P2a: Kid Friendly toggle */}
                <button
                  onClick={() => setKidFriendlyOnly(!kidFriendlyOnly)}
                  aria-pressed={kidFriendlyOnly}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-all border focus-visible:ring-2 focus-visible:ring-amber/50 focus-visible:ring-offset-1",
                    kidFriendlyOnly
                      ? "bg-amber/10 text-amber border-amber/30 font-medium"
                      : "bg-cream text-stone-warm border-stone-200/60 hover:bg-cream-dark"
                  )}
                >
                  <span className="flex items-center gap-2">👶 Kid Friendly</span>
                </button>

                {/* P2a: TAB Available toggle */}
                <button
                  onClick={() => setHasTabOnly(!hasTabOnly)}
                  aria-pressed={hasTabOnly}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-all border focus-visible:ring-2 focus-visible:ring-amber/50 focus-visible:ring-offset-1",
                    hasTabOnly
                      ? "bg-amber/10 text-amber border-amber/30 font-medium"
                      : "bg-cream text-stone-warm border-stone-200/60 hover:bg-cream-dark"
                  )}
                >
                  <span className="flex items-center gap-2">📺 TAB Available</span>
                </button>

                {viewMode === 'cards' && (
                  <button
                    onClick={() => setShowMiniMaps(!showMiniMaps)}
                    aria-pressed={showMiniMaps}
                    className={cn(
                      "w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-all border focus-visible:ring-2 focus-visible:ring-amber/50 focus-visible:ring-offset-1",
                      showMiniMaps
                        ? "bg-amber/10 text-amber border-amber/30 font-medium"
                        : "bg-cream text-stone-warm border-stone-200/60 hover:bg-cream-dark"
                    )}
                  >
                    <span className="flex items-center gap-2"><MapIcon className="h-3.5 w-3.5" /> Show Maps on Cards</span>
                  </button>
                )}
              </div>

              {/* Sort By */}
              <div className="mb-5">
                <label className="block text-xs font-medium text-stone-500 mb-2">Sort By</label>
                <div className="flex gap-2">
                  {(['price', 'name', 'suburb', 'freshness'] as const).map(option => (
                    <button
                      key={option}
                      onClick={() => setSortBy(option)}
                      aria-pressed={sortBy === option}
                      className={cn(
                        "flex-1 px-2 py-2 rounded-lg text-xs font-medium transition-all focus-visible:ring-2 focus-visible:ring-amber/50 focus-visible:ring-offset-1",
                        sortBy === option ? "bg-amber text-white" : "bg-cream text-stone-warm hover:bg-cream-dark"
                      )}
                    >
                      {option === 'price' ? 'Price' : option === 'name' ? 'Name' : option === 'suburb' ? 'Suburb' : 'Freshness'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Max Price slider */}
              <div className="mb-4">
                <label className="block text-xs font-medium text-stone-500 mb-2">
                  Max Price: <span className="text-amber font-bold">${maxPrice}</span>
                </label>
                <input
                  type="range"
                  min={6}
                  max={20}
                  step={0.5}
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(Number(e.target.value))}
                  className="w-full accent-amber"
                  aria-label={`Max price: $${maxPrice}`}
                />
                <div className="flex justify-between text-[11px] text-stone-500 mt-0.5">
                  <span>$6</span>
                  <span>$20</span>
                </div>
              </div>

              {/* Clear All */}
              {activeFilterCount > 0 && (
                <div className="pt-3 border-t border-stone-100">
                  <button
                    onClick={handleClearAll}
                    className="w-full text-center text-sm text-red-500 hover:text-red-600 font-medium py-1 focus-visible:ring-2 focus-visible:ring-amber/50 focus-visible:ring-offset-1 rounded-lg"
                  >
                    Clear All Filters
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
