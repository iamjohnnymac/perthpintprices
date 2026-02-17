"use client"

import { Search, SlidersHorizontal, ChevronDown, LayoutGrid, List, Clock, Map } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Toggle } from "@/components/ui/toggle"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
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
  const activeFilterCount = (selectedSuburb ? 1 : 0) + (maxPrice < 15 ? 1 : 0) + (sortBy !== 'price' ? 1 : 0)

  return (
    <div className="bg-white rounded-xl shadow-md p-4 mb-6 border border-stone-200">
      {/* Row 1: View Toggle + Search + Suburb */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* View Toggle - Using shadcn ToggleGroup */}
        <ToggleGroup
          type="single"
          value={viewMode}
          onValueChange={(value) => value && setViewMode(value as 'cards' | 'list')}
          className="bg-stone-100 p-1 rounded-lg"
        >
          <ToggleGroupItem
            value="cards"
            aria-label="Cards view"
            className={cn(
              "px-4 py-2 rounded-md text-sm font-semibold data-[state=on]:bg-amber-700 data-[state=on]:text-white",
              "data-[state=off]:text-stone-600 data-[state=off]:hover:text-stone-800"
            )}
          >
            <LayoutGrid className="h-4 w-4 mr-1.5" />
            Cards
          </ToggleGroupItem>
          <ToggleGroupItem
            value="list"
            aria-label="List view"
            className={cn(
              "px-4 py-2 rounded-md text-sm font-semibold data-[state=on]:bg-amber-700 data-[state=on]:text-white",
              "data-[state=off]:text-stone-600 data-[state=off]:hover:text-stone-800"
            )}
          >
            <List className="h-4 w-4 mr-1.5" />
            List
          </ToggleGroupItem>
        </ToggleGroup>

        {/* Search - Using shadcn Input */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
          <Input
            type="text"
            placeholder="Search pubs or suburbs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-stone-50 border-stone-200 focus-visible:ring-amber-600"
          />
        </div>

        {/* Suburb Dropdown - Using shadcn Select */}
        <Select value={selectedSuburb} onValueChange={setSelectedSuburb}>
          <SelectTrigger className="min-w-[160px] bg-stone-50 border-stone-200 focus:ring-amber-600">
            <SelectValue placeholder="All Suburbs" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Suburbs</SelectItem>
            {suburbs.map(suburb => (
              <SelectItem key={suburb} value={suburb}>{suburb}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Row 2: Toggle Pills + More Filters */}
      <div className="flex flex-wrap items-center gap-2 mt-3">
        {/* Happy Hour Toggle - Using shadcn Toggle */}
        <Toggle
          pressed={showHappyHourOnly}
          onPressedChange={setShowHappyHourOnly}
          className={cn(
            "px-3 py-1.5 h-auto rounded-full text-sm font-medium",
            "data-[state=on]:bg-green-600 data-[state=on]:text-white",
            "data-[state=off]:bg-stone-100 data-[state=off]:text-stone-600 data-[state=off]:hover:bg-stone-200"
          )}
        >
          <Clock className="h-3.5 w-3.5 mr-1.5" />
          Happy Hour Now
          {stats.happyHourNow > 0 && (
            <Badge variant="secondary" className="ml-1.5 h-5 px-1.5 bg-green-700 text-white text-xs">
              {stats.happyHourNow}
            </Badge>
          )}
        </Toggle>

        {/* Mini Maps Toggle - Only in Cards view */}
        {viewMode === 'cards' && (
          <Toggle
            pressed={showMiniMaps}
            onPressedChange={setShowMiniMaps}
            className={cn(
              "px-3 py-1.5 h-auto rounded-full text-sm font-medium",
              "data-[state=on]:bg-amber-600 data-[state=on]:text-white",
              "data-[state=off]:bg-stone-100 data-[state=off]:text-stone-600 data-[state=off]:hover:bg-stone-200"
            )}
          >
            <Map className="h-3.5 w-3.5 mr-1.5" />
            Mini Maps
          </Toggle>
        )}

        {/* More Filters Button - Using shadcn Collapsible */}
        <Collapsible open={showMoreFilters} onOpenChange={setShowMoreFilters} className="ml-auto">
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              className={cn(
                "px-3 py-1.5 h-auto rounded-full text-sm font-medium",
                showMoreFilters || activeFilterCount > 0
                  ? "bg-stone-700 text-white hover:bg-stone-800"
                  : "bg-stone-100 text-stone-600 hover:bg-stone-200"
              )}
            >
              <SlidersHorizontal className="h-3.5 w-3.5 mr-1.5" />
              More Filters
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="ml-1.5 h-5 px-1.5 bg-amber-600 text-white text-xs">
                  {activeFilterCount}
                </Badge>
              )}
              <ChevronDown className={cn(
                "h-3.5 w-3.5 ml-1 transition-transform",
                showMoreFilters && "rotate-180"
              )} />
            </Button>
          </CollapsibleTrigger>
        </Collapsible>
      </div>

      {/* Collapsible More Filters Content */}
      <Collapsible open={showMoreFilters} onOpenChange={setShowMoreFilters}>
        <CollapsibleContent className="mt-4 pt-4 border-t border-stone-100">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Sort By */}
            <div>
              <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1.5">
                Sort By
              </label>
              <Select value={sortBy} onValueChange={(value) => setSortBy(value as 'price' | 'name' | 'suburb')}>
                <SelectTrigger className="w-full bg-white border-stone-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="price">Price (Low to High)</SelectItem>
                  <SelectItem value="name">Name (A-Z)</SelectItem>
                  <SelectItem value="suburb">Suburb</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Max Price - Using shadcn Slider */}
            <div>
              <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1.5">
                Max Price: <span className="text-amber-700">${maxPrice}</span>
              </label>
              <Slider
                value={[maxPrice]}
                onValueChange={(value) => setMaxPrice(value[0])}
                min={6}
                max={15}
                step={0.5}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-stone-400 mt-1">
                <span>$6</span>
                <span>$15</span>
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  )
}
