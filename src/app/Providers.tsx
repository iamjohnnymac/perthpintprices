'use client'

import { useEffect } from 'react'
import { WatchlistProvider } from '@/hooks/useWatchlist'

export default function Providers({ children }: { children: React.ReactNode }) {
  // Register the service worker for push notifications
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch((err) => {
        console.error('Service worker registration failed:', err)
      })
    }
  }, [])

  return <WatchlistProvider>{children}</WatchlistProvider>
}
