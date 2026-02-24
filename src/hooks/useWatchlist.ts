'use client'

import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react'
import React from 'react'

const STORAGE_KEY = 'arvo_watchlist'
const MAX_WATCHLIST = 5

export interface WatchlistItem {
  slug: string
  name: string
  suburb: string
  addedAt: string
}

interface WatchlistContextType {
  watchlist: WatchlistItem[]
  isLoaded: boolean
  isWatched: (slug: string) => boolean
  toggleWatch: (slug: string, name: string, suburb: string) => void
  removeFromWatchlist: (slug: string) => void
  clearWatchlist: () => void
  isFull: boolean
  count: number
}

const WatchlistContext = createContext<WatchlistContextType>({
  watchlist: [],
  isLoaded: false,
  isWatched: () => false,
  toggleWatch: () => {},
  removeFromWatchlist: () => {},
  clearWatchlist: () => {},
  isFull: false,
  count: 0,
})

export function WatchlistProvider({ children }: { children: ReactNode }) {
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([])
  const [isLoaded, setIsLoaded] = useState(false)
  const syncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        setWatchlist(JSON.parse(stored))
      }
    } catch {}
    setIsLoaded(true)
  }, [])

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(watchlist))

      // Debounced push subscription sync (300ms)
      if (syncTimerRef.current) clearTimeout(syncTimerRef.current)
      syncTimerRef.current = setTimeout(() => {
        syncWatchlistToPush(watchlist.map((w) => w.slug))
      }, 300)
    }
  }, [watchlist, isLoaded])

  const isWatched = useCallback(
    (slug: string) => watchlist.some((item) => item.slug === slug),
    [watchlist]
  )

  const toggleWatch = useCallback(
    (slug: string, name: string, suburb: string) => {
      setWatchlist((prev) => {
        const exists = prev.find((item) => item.slug === slug)
        if (exists) {
          return prev.filter((item) => item.slug !== slug)
        }
        if (prev.length >= MAX_WATCHLIST) {
          return [...prev.slice(1), { slug, name, suburb, addedAt: new Date().toISOString() }]
        }
        return [...prev, { slug, name, suburb, addedAt: new Date().toISOString() }]
      })
    },
    []
  )

  const removeFromWatchlist = useCallback((slug: string) => {
    setWatchlist((prev) => prev.filter((item) => item.slug !== slug))
  }, [])

  const clearWatchlist = useCallback(() => {
    setWatchlist([])
  }, [])

  const value: WatchlistContextType = {
    watchlist,
    isLoaded,
    isWatched,
    toggleWatch,
    removeFromWatchlist,
    clearWatchlist,
    isFull: watchlist.length >= MAX_WATCHLIST,
    count: watchlist.length,
  }

  return React.createElement(WatchlistContext.Provider, { value }, children)
}

export function useWatchlist(): WatchlistContextType {
  return useContext(WatchlistContext)
}

/**
 * Sync watchlist slugs to the push subscription on the server.
 * Only runs if the user has an active push subscription.
 * Silent fail — this is non-critical.
 */
async function syncWatchlistToPush(slugs: string[]): Promise<void> {
  try {
    if (typeof window === 'undefined') return
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return

    const registration = await navigator.serviceWorker.ready
    const subscription = await registration.pushManager.getSubscription()
    if (!subscription) return

    await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subscription: subscription.toJSON(),
        watchedSlugs: slugs,
        userAgent: navigator.userAgent,
      }),
    })
  } catch {
    // Silent fail — push sync is non-critical
  }
}
