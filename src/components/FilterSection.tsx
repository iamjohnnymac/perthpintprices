"use client"

import { Search, LayoutGrid, List, Clock, Map, SlidersHorizontal, ChevronDown, X, MapPin } from "lucide-react"
import { useRef, useEffect } from "react"
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
  const activeFilterCount = (selectedSuburb && selectedSuburb !== 'all' ? 1 : 0) + (maxPrice < 15 ? 1 : 0) + (sortBy !== 'price' && sortBy !== 'nearest' ? 1 : 0)
  const isNearestActive = sortBy === 'nearest' && hasLocation
  const dropdownRef = useRef<HTMLDivElement>(null)

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

  const totalActive = activeFilterCount + (isNearestActive ? 1 : 0)

  return (
    <div className="border-t border-gray-100 bg-white">
      {/* Row 1: Search + Suburb */}
      <div className="max-w-7xl mx-auto px-4 pt-2.5 pb-1.5 flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search pubs or suburbs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-8 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-colors"
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <select
          value={selectedSuburb || 'all'}
          onChange={(e) => setSelectedSuburb(e.target.value)}
          className="text-sm bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-colors cursor-pointer flex-shrink-0 max-w-[130px] sm:max-w-[160px]"
        >
          <option value="all">All Suburbs</option>
          {suburbs.map(suburb => (
            <option key={suburb} value={suburb}>{suburb}</option>
          ))}
        </select>
      </div>

      {/* Row 2: Pill controls + Filters button */}
      <div className="max-w-7xl mx-auto px-4 pb-2.5">
        <div className="flex items-center gap-2">
          {/* Scrollable pills area */}
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide flex-1 min-w-0">
            {/* Cards / List toggle */}
            <div className="flex items-center bg-gray-100 rounded-lg p-0.5 gap-0.5 flex-shrink-0">
              <button
                onClick={() => setViewMode('cards')}
                className={cn(
                  "flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-all whitespace-nowrap",
                  viewMode === 'cards' ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                )}
              >
                <LayoutGrid className="h-3.5 w-3.5" />
                Cards
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={cn(
                  "flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-all whitespace-nowrap",
                  viewMode === 'list' ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                )}
              >
                <List className="h-3.5 w-3.5" />
                List
              </button>
            </div>

            <div className="h-4 w-px bg-gray-200 flex-shrink-0" />

            {/* Happy Hour pill */}
            <button
              onClick={() => setShowHappyHourOnly(!showHappyHourOnly)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all border flex-shrink-0 whitespace-nowrap",
                showHappyHourOnly
                  ? "bg-brand-500 text-white border-brand-500"
                  : "bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:text-gray-800"
              )}
            >
              <Clock className="h-3 w-3" />
              Happy Hour
              {stats.happyHourNow > 0 && (
                <span className={cn(
                  "text-[10px] rounded-full px-1.5 font-semibold",
                  showHappyHourOnly ? "bg-white/20 text-white" : "bg-gray-100 text-gray-600"
                )}>
                  {stats.happyHourNow}
                </span>
              )}
            </button>

            {/* Nearest pill */}
            {hasLocation && (
              <button
                onClick={() => setSortBy(sortBy === 'nearest' ? 'price' : 'nearest')}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all border flex-shrink-0 whitespace-nowrap",
                  isNearestActive
                    ? "bg-blue-500 text-white border-blue-500"
                    : "bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:text-gray-800"
                )}
              >
                <MapPin className="h-3 w-3" />
                Nearest
              </button>
            )}

            {/* Mini Maps pill — only in Cards view */}
            {viewMode === 'cards' && (
              <button
                onClick={() => setShowMiniMaps(!showMiniMaps)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all border flex-shrink-0 whitespace-nowrap",
                  showMiniMaps
                    ? "bg-brand-500 text-white border-brand-500"
                    : "bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:text-gray-800"
                )}
              >
                <Map className="h-3 w-3" />
                Mini Maps
              </button>
            )}
          </div>

          {/* Filters button */}
          <div className="relative flex-shrink-0" ref={dropdownRef}>
            <button
              onClick={() => setShowMoreFilters(!showMoreFilters)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all border whitespace-nowrap",
                showMoreFilters || activeFilterCount > 0
                  ? "bg-gray-900 text-white border-gray-900"
                  : "bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:text-gray-800"
              )}
            >
              <SlidersHorizontal className="h-3 w-3" />
              Filters
              {activeFilterCount > 0 && (
                <span className="bg-brand-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-bold">
                  {activeFilterCount}
                </span>
              )}
              <ChevronDown className={cn("h-3 w-3 transition-transform", showMoreFilters && "rotate-180")} />
            </button>

            {showMoreFilters && (
              <div className="absolute right-0 top-full mt-1.5 w-72 bg-white rounded-xl shadow-lg border border-gray-200 p-4 z-50">
                {/* Sort By */}
                <div className="mb-4">
                  <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Sort By</label>
                  <div className="flex gap-1.5">
                    {([...(['price', 'name', 'suburb'] as const), ...(hasLocation ? (['nearest'] as const) : [])] as const).map(option => (
                      <button
                        key={option}
                        onClick={() => setSortBy(option)}
                        className={cn(
                          "flex-1 px-2 py-1.5 rounded-lg text-xs font-medium transition-all",
                          sortBy === option ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        )}
                      >
                        {option === 'price' ? 'Price' : option === 'name' ? 'Name' : option === 'suburb' ? 'Suburb' : 'Nearest'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Max Price slider */}
                <div className="mb-4">
                  <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
                    Max Price: <span className="text-brand-600">${maxPrice}</span>
                  </label>
                  <input
                    type="range"
                    min={6}
                    max={15}
                    step={0.5}
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(Number(e.target.value))}
                    className="w-full accent-brand-500"
                  />
                  <div className="flex justify-between text-[11px] text-gray-400 mt-0.5">
                    <span>$6</span>
                    <span>$15</span>
                  </div>
                </div>

                {/* Active filters summary */}
                {totalActive > 0 && (
                  <div className="pt-3 border-t border-gray-100">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-400">{totalActive} active filter{totalActive > 1 ? 's' : ''}</span>
                      <button
                        onClick={handleClearAll}
                        className="text-xs text-red-500 hover:text-red-600 font-medium"
                      >
                        Clear All
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
