"use client"

import { Search, SlidersHorizontal, ChevronDown, X, MapPin, LayoutGrid, List, Clock, Map as MapIcon } from "lucide-react"
import { useState, useRef, useEffect } from "react"
import { cn } from "@/lib/utils"

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
  sortBy: 'price' | 'name' | 'suburb' | 'nearest'
  setSortBy: (sort: 'price' | 'name' | 'suburb' | 'nearest') => void
  maxPrice: number
  setMaxPrice: (price: number) => void
  showMoreFilters: boolean
  setShowMoreFilters: (show: boolean) => void
  stats: { happyHourNow: number }
  hasLocation?: boolean
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
}: FilterSectionProps) {
  const isNearestActive = sortBy === 'nearest' && hasLocation
  const dropdownRef = useRef<HTMLDivElement>(null)

  const activeFilterCount =
    (selectedSuburb && selectedSuburb !== 'all' ? 1 : 0) +
    (maxPrice < 20 ? 1 : 0) +
    (sortBy !== 'price' && sortBy !== 'nearest' ? 1 : 0) +
    (showHappyHourOnly ? 1 : 0) +
    (isNearestActive ? 1 : 0)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowMoreFilters(false)
      }
    }
    if (showMoreFilters) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [showMoreFilters, setShowMoreFilters])

  const handleClearAll = () => {
    setSortBy('price')
    setMaxPrice(15)
    setSelectedSuburb('all')
    setSearchTerm('')
    setShowHappyHourOnly(false)
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
            className="w-full pl-9 pr-8 py-2.5 text-sm bg-cream border border-stone-200/60 rounded-full text-charcoal placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber/20 focus:border-amber transition-colors"
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Nearby toggle pill */}
        {hasLocation && (
          <button
            onClick={() => setSortBy(sortBy === 'nearest' ? 'price' : 'nearest')}
            className={cn(
              "flex items-center gap-1.5 px-3 py-2.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-all whitespace-nowrap border",
              isNearestActive
                ? "bg-amber text-white border-amber"
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
            className={cn(
              "flex items-center gap-1.5 px-3 py-2.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-all border whitespace-nowrap",
              showMoreFilters || activeFilterCount > 0
                ? "bg-amber text-white border-amber"
                : "bg-cream text-stone-warm border-stone-200/60 hover:border-stone-300"
            )}
          >
            <SlidersHorizontal className="h-3 w-3" />
            Filter
            {activeFilterCount > 0 && (
              <span className="bg-white/25 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-bold">
                {activeFilterCount}
              </span>
            )}
          </button>

          {showMoreFilters && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-lg border border-stone-200/40 p-5 z-50">
              {/* View Mode */}
              <div className="mb-5">
                <label className="block text-[11px] font-semibold text-stone-warm uppercase tracking-wider mb-2">View</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setViewMode('cards')}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all",
                      viewMode === 'cards' ? "bg-amber text-white" : "bg-cream text-stone-warm hover:bg-cream-dark"
                    )}
                  >
                    <LayoutGrid className="h-3.5 w-3.5" /> Cards
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all",
                      viewMode === 'list' ? "bg-amber text-white" : "bg-cream text-stone-warm hover:bg-cream-dark"
                    )}
                  >
                    <List className="h-3.5 w-3.5" /> List
                  </button>
                </div>
              </div>

              {/* Suburb */}
              <div className="mb-5">
                <label className="block text-[11px] font-semibold text-stone-warm uppercase tracking-wider mb-2">Suburb</label>
                <select
                  value={selectedSuburb || 'all'}
                  onChange={(e) => setSelectedSuburb(e.target.value)}
                  className="w-full text-sm bg-cream border border-stone-200/60 rounded-lg px-3 py-2.5 text-charcoal focus:outline-none focus:ring-2 focus:ring-amber/20 focus:border-amber transition-colors cursor-pointer"
                >
                  <option value="all">All Suburbs</option>
                  {suburbs.map(suburb => (
                    <option key={suburb} value={suburb}>{suburb}</option>
                  ))}
                </select>
              </div>

              {/* Toggles */}
              <div className="mb-5 space-y-2">
                <label className="block text-[11px] font-semibold text-stone-warm uppercase tracking-wider mb-2">Toggles</label>
                <button
                  onClick={() => setShowHappyHourOnly(!showHappyHourOnly)}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-all border",
                    showHappyHourOnly
                      ? "bg-amber/10 text-amber border-amber/30 font-medium"
                      : "bg-cream text-stone-warm border-stone-200/60 hover:bg-cream-dark"
                  )}
                >
                  <span className="flex items-center gap-2"><Clock className="h-3.5 w-3.5" /> Happy Hour Only</span>
                  {stats.happyHourNow > 0 && <span className="text-xs bg-amber/20 text-amber px-1.5 py-0.5 rounded-full font-semibold">{stats.happyHourNow}</span>}
                </button>
                {viewMode === 'cards' && (
                  <button
                    onClick={() => setShowMiniMaps(!showMiniMaps)}
                    className={cn(
                      "w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-all border",
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
                <label className="block text-[11px] font-semibold text-stone-warm uppercase tracking-wider mb-2">Sort By</label>
                <div className="flex gap-2">
                  {(['price', 'name', 'suburb'] as const).map(option => (
                    <button
                      key={option}
                      onClick={() => setSortBy(option)}
                      className={cn(
                        "flex-1 px-2 py-2 rounded-lg text-xs font-medium transition-all",
                        sortBy === option ? "bg-amber text-white" : "bg-cream text-stone-warm hover:bg-cream-dark"
                      )}
                    >
                      {option === 'price' ? 'Price' : option === 'name' ? 'Name' : 'Suburb'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Max Price slider */}
              <div className="mb-4">
                <label className="block text-[11px] font-semibold text-stone-warm uppercase tracking-wider mb-2">
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
                />
                <div className="flex justify-between text-[11px] text-stone-400 mt-0.5">
                  <span>$6</span>
                  <span>$20</span>
                </div>
              </div>

              {/* Clear All */}
              {activeFilterCount > 0 && (
                <div className="pt-3 border-t border-stone-100">
                  <button
                    onClick={handleClearAll}
                    className="w-full text-center text-sm text-red-500 hover:text-red-600 font-medium py-1"
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
