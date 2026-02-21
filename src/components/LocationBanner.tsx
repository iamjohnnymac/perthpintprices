'use client'

import { useState } from 'react'

interface LocationBannerProps {
  onLocationGranted: (lat: number, lng: number) => void
  locationState: 'idle' | 'granted' | 'denied' | 'dismissed'
  setLocationState: (state: 'idle' | 'granted' | 'denied' | 'dismissed') => void
}

export default function LocationBanner({ onLocationGranted, locationState, setLocationState }: LocationBannerProps) {
  const [isLocating, setIsLocating] = useState(false)
  const [isExiting, setIsExiting] = useState(false)

  if (locationState !== 'idle') {
    if (locationState === 'granted') {
      return (
        <div className="flex items-center gap-1.5 text-xs text-stone-500 mb-3 px-1">
          <span>📍</span>
          <span>Sorting by nearest</span>
        </div>
      )
    }
    return null
  }

  function handleDismiss() {
    setIsExiting(true)
    if (typeof window !== 'undefined') {
      localStorage.setItem('ppp-location-dismissed', 'true')
    }
    setTimeout(() => {
      setLocationState('dismissed')
    }, 300)
  }

  function handleShareLocation() {
    if (!navigator.geolocation) {
      setLocationState('denied')
      return
    }
    setIsLocating(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsLocating(false)
        onLocationGranted(position.coords.latitude, position.coords.longitude)
      },
      () => {
        setIsLocating(false)
        setLocationState('denied')
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  return (
    <div
      className={`mb-4 rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.06)] border border-stone-200/60 overflow-hidden transition-all duration-300 ${
        isExiting ? 'opacity-0 -translate-y-2 max-h-0 mb-0' : 'opacity-100 translate-y-0 max-h-32'
      }`}
    >
      <div className="bg-gradient-to-r from-amber-50 to-stone-50 border border-amber-200/60 rounded-2xl px-4 py-3 flex items-center gap-3">
        {/* Location pin icon */}
        <div className="flex-shrink-0 w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center">
          <svg className="w-4 h-4 text-amber-600" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
          </svg>
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-stone-800">Find pubs near you</p>
          <p className="text-xs text-stone-500">Sort venues by distance from your location</p>
        </div>

        {/* Share Location button */}
        <button
          onClick={handleShareLocation}
          disabled={isLocating}
          className="flex-shrink-0 px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 disabled:bg-amber-400 text-white text-xs font-semibold rounded-xl transition-colors shadow-sm"
        >
          {isLocating ? (
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              Locating...
            </span>
          ) : (
            'Share Location'
          )}
        </button>

        {/* Dismiss button */}
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 w-6 h-6 flex items-center justify-center text-stone-400 hover:text-stone-600 transition-colors rounded-full hover:bg-stone-200/50"
          aria-label="Dismiss"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        </button>
      </div>
    </div>
  )
}
