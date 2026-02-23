'use client'

import { useState, useEffect, useCallback } from 'react'

const STORAGE_KEY = 'pintdex_watchlist'
const MAX_WATCHLIST = 5

export interface WatchlistItem {
  slug: string
  name: string
  suburb: string
  addedAt: string
}

export function useWatchlist() {
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        setWatchlist(JSON.parse(stored))
      }
    } catch {}
    setIsLoaded(true)
  }, [])

  // Persist to localStorage on change
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(watchlist))
    }
  }, [watchlist, isLoaded])

  const isWatched = useCallback(
    (slug: string) => watchlist.some(item => item.slug === slug),
    [watchlist]
  )

  const toggleWatch = useCallback(
    (slug: string, name: string, suburb: string) => {
      setWatchlist(prev => {
        const exists = prev.find(item => item.slug === slug)
        if (exists) {
          return prev.filter(item => item.slug !== slug)
        }
        if (prev.length >= MAX_WATCHLIST) {
          // Remove oldest, add new
          return [...prev.slice(1), { slug, name, suburb, addedAt: new Date().toISOString() }]
        }
        return [...prev, { slug, name, suburb, addedAt: new Date().toISOString() }]
      })
    },
    []
  )

  const removeFromWatchlist = useCallback(
    (slug: string) => {
      setWatchlist(prev => prev.filter(item => item.slug !== slug))
    },
    []
  )

  const clearWatchlist = useCallback(() => {
    setWatchlist([])
  }, [])

  return {
    watchlist,
    isLoaded,
    isWatched,
    toggleWatch,
    removeFromWatchlist,
    clearWatchlist,
    isFull: watchlist.length >= MAX_WATCHLIST,
    count: watchlist.length,
  }
}
