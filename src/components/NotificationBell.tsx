'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  isPushSupported,
  getPermissionState,
  getExistingSubscription,
  subscribeToPush,
  unsubscribeFromPush,
} from '@/lib/pushNotifications'
import { useWatchlist } from '@/hooks/useWatchlist'

export default function NotificationBell() {
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>('default')
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [showTooltip, setShowTooltip] = useState(false)
  const { watchlist } = useWatchlist()

  // Check initial state
  useEffect(() => {
    setPermission(getPermissionState())
    getExistingSubscription().then((sub) => setIsSubscribed(!!sub))
  }, [])

  const handleToggle = useCallback(async () => {
    if (isLoading) return
    setIsLoading(true)

    try {
      if (isSubscribed) {
        const success = await unsubscribeFromPush()
        if (success) setIsSubscribed(false)
      } else {
        const slugs = watchlist.map((w) => w.slug)
        const success = await subscribeToPush(slugs)
        if (success) {
          setIsSubscribed(true)
          setPermission('granted')
        } else {
          // Permission may have been denied
          setPermission(getPermissionState())
        }
      }
    } finally {
      setIsLoading(false)
    }
  }, [isSubscribed, isLoading, watchlist])

  // Graceful fallback: don't render if push is not supported
  if (typeof window !== 'undefined' && !isPushSupported()) return null

  // SSR: render a placeholder to avoid hydration mismatch
  if (typeof window === 'undefined') {
    return <div className="w-9 h-9" />
  }

  // Permission permanently denied
  if (permission === 'denied') {
    return (
      <div className="relative">
        <button
          className="relative p-2 rounded-full text-gray-400 cursor-not-allowed"
          title="Notifications blocked — enable in browser settings"
          disabled
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
        >
          <BellOffIcon />
        </button>
        {showTooltip && (
          <div className="absolute right-0 top-full mt-1 px-3 py-1.5 bg-charcoal text-white text-[11px] rounded-lg whitespace-nowrap z-50 shadow-lg">
            Notifications blocked — enable in browser settings
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="relative">
      <button
        onClick={handleToggle}
        disabled={isLoading}
        className={`relative p-2 rounded-full transition-all duration-200 ${
          isSubscribed
            ? 'text-amber bg-amber/10 hover:bg-amber/20'
            : 'text-gray-500 hover:text-amber hover:bg-amber/5'
        } ${isLoading ? 'animate-pulse' : ''}`}
        title={isSubscribed ? 'Alerts on — tap to disable' : 'Enable price alerts'}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        {isSubscribed ? <BellActiveIcon /> : <BellIcon />}
        {isSubscribed && (
          <span className="absolute top-1 right-1 w-2 h-2 bg-green-500 rounded-full ring-2 ring-cream" />
        )}
      </button>
      {showTooltip && !isLoading && (
        <div className="absolute right-0 top-full mt-1 px-3 py-1.5 bg-charcoal text-white text-[11px] rounded-lg whitespace-nowrap z-50 shadow-lg">
          {isSubscribed ? '🔔 Alerts on for your watchlist' : '🔕 Enable price alerts'}
        </div>
      )}
    </div>
  )
}

function BellIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </svg>
  )
}

function BellActiveIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </svg>
  )
}

function BellOffIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8.7 3A6 6 0 0 1 18 8a21.3 21.3 0 0 0 .6 5" />
      <path d="M17 17H3s3-2 3-9a4.67 4.67 0 0 1 .3-1.7" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  )
}
