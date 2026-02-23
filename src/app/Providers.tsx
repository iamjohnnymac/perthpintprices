'use client'

import { WatchlistProvider } from '@/hooks/useWatchlist'

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WatchlistProvider>
      {children}
    </WatchlistProvider>
  )
}
