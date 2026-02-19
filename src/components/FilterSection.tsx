"use client"

import { Search, LayoutGrid, List, Clock, Map, SlidersHorizontal, ChevronDown, X } from "lucide-react"
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
  sortBy: 'price' | 'name' | 'suburb'
  setSortBy: (sort: 'price' | 'name' | 'suburb') => void
  maxPrice: number
  setMaxPrice: (price: number) => void
  showMoreFilters: boolean
  setShowMoreFilters: (show: boolean) => void
  stats: { happyHourNow: number }
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
}: FilterSectionProps) {
  const activeFilterCount = (selectedSuburb && selectedSuburb !== 'all' ? 1 : 0) + (maxPrice < 15 ? 1 : 0) + (sortBy !== 'price' ? 1 : 0)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowMoreFilters(false)
      }
    }
    if (showMoreFilters) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [showMoreFilters, setShowMoreFilters])

  return (
    <div className="border-t border-stone-100 bg-white">
      {/* Main toolbar row */}
      <div className="max-w-7xl mx-auto px-4 py-2 flex flex-wrap items-center gap-2">

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-stone-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search pubs or suburbs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8 pr-3 py-1.5 text-sm bg-stone-50 border border-stone-200 rounded-lg w-48 sm:w-56 text-stone-700 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-400 transition-colors"
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600">
              <X className="h-3 w-3" />
            </button>
          )}
        </div>

        {/* Suburb dropdown */}
        <select
          value={selectedSuburb || 'all'}
          onChange={(e) => setSelectedSuburb(e.target.value)}
          className="text-sm bg-stone-50 border border-stone-200 rounded-lg px-2.5 py-1.5 text-stone-600 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-400 transition-colors cursor-pointer max-w-[140px]"
        >
          <option value="all">All Suburbs</option>
          {suburbs.map(suburb => (
            <option key={suburb} value={suburb}>{suburb}</option>
          ))}
        </select>

        {/* Divider */}
        <div className="hidden sm:block h-5 w-px bg-stone-200 mx-0.5" />

        {/* Cards / List toggle */}
        <div className="flex items-center bg-stone-100 rounded-lg p-0.5 gap-0.5">
          <button
            onClick={() => setViewMode('cards')}
            className={cn(
              "flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-all",
              viewMode === 'cards'
                ? "bg-white text-stone-800 shadow-sm"
                : "text-stone-500 hover:text-stone-700"
            )}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            Cards
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={cn(
              "flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-all",
              viewMode === 'list'
                ? "bg-white text-stone-800 shadow-sm"
                : "text-stone-500 hover:text-stone-700"
            )}
          >
            <List className="h-3.5 w-3.5" />
            List
          </button>
        </div>

        {/* Happy Hour pill */}
        <button
          onClick={() => setShowHappyHourOnly(!showHappyHourOnly)}
          className={cn(
            "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all border",
            showHappyHourOnly
              ? "bg-green-600 text-white border-green-600"
              : "bg-transparent text-stone-500 border-stone-200 hover:border-stone-300 hover:text-stone-700"
          )}
        >
          <Clock className="h-3 w-3" />
          Happy Hour
          {stats.happyHourNow > 0 && (
            <span className={cn(
              "text-xs rounded-full px-1.5 py-0 font-semibold",
              showHappyHourOnly ? "bg-green-500 text-white" : "bg-stone-200 text-stone-600"
            )}>
              {stats.happyHourNow}
            </span>
          )}
        </button>

        {/* Mini Maps pill — only in Cards view */}
        {viewMode === 'cards' && (
          <button
            onClick={() => setShowMiniMaps(!showMiniMaps)}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all border",
              showMiniMaps
                ? "bg-amber-600 text-white border-amber-600"
                : "bg-transparent text-stone-500 border-stone-200 hover:border-stone-300 hover:text-stone-700"
            )}
          >
            <Map className="h-3 w-3" />
            Mini Maps
          </button>
        )}

        {/* More Filters dropdown — right-aligned */}
        <div className="ml-auto relative" ref={dropdownRef}>
          <button
            onClick={() => setShowMoreFilters(!showMoreFilters)}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all border",
              showMoreFilters || activeFilterCount > 0
                ? "bg-stone-700 text-white border-stone-700"
                : "bg-transparent text-stone-500 border-stone-200 hover:border-stone-300 hover:text-stone-700"
            )}
          >
            <SlidersHorizontal className="h-3 w-3" />
            Filters
            {activeFilterCount > 0 && (
              <span className="bg-amber-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold">
                {activeFilterCount}
              </span>
            )}
            <ChevronDown className={cn("h-3 w-3 transition-transform", showMoreFilters && "rotate-180")} />
          </button>

          {/* Dropdown panel */}
          {showMoreFilters && (
            <div className="absolute right-0 top-full mt-1 w-64 bg-white rounded-xl shadow-lg border border-stone-200 p-4 z-50">
              {/* Sort By */}
              <div className="mb-4">
                <label className="block text-xs font-semibold text-stone-400 uppercase tracking-wide mb-2">Sort By</label>
                <div className="flex gap-1.5">
                  {(['price', 'name', 'suburb'] as const).map(option => (
                    <button
                      key={option}
                      onClick={() => setSortBy(option)}
                      className={cn(
                        "flex-1 px-2 py-1.5 rounded-lg text-xs font-medium transition-all",
                        sortBy === option
                          ? "bg-stone-800 text-white"
                          : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                      )}
                    >
                      {option === 'price' ? 'Price' : option === 'name' ? 'Name' : 'Suburb'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Max Price slider */}
              <div>
                <label className="block text-xs font-semibold text-stone-400 uppercase tracking-wide mb-2">
                  Max Price: <span className="text-amber-600">${maxPrice}</span>
                </label>
                <input
                  type="range"
                  min={6}
                  max={15}
                  step={0.5}
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(Number(e.target.value))}
                  className="w-full accent-amber-600"
                />
                <div className="flex justify-between text-xs text-stone-400 mt-0.5">
                  <span>$6</span>
                  <span>$15</span>
                </div>
              </div>

              {maxPrice < 15 && (
                <button
                  onClick={() => setMaxPrice(15)}
                  className="mt-3 text-xs text-stone-400 hover:text-stone-600 underline"
                >
                  Reset price
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
