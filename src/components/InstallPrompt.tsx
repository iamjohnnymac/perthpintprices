'use client'

import { useState, useEffect } from 'react'

// Android/Chrome install prompt event
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export default function InstallPrompt() {
  const [show, setShow] = useState(false)
  const [platform, setPlatform] = useState<'ios' | 'android' | null>(null)
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)

  useEffect(() => {
    const isStandalone = ('standalone' in window.navigator && (window.navigator as any).standalone) ||
      window.matchMedia('(display-mode: standalone)').matches
    const dismissed = localStorage.getItem('install-prompt-dismissed')
    
    // Already installed or dismissed — bail
    if (isStandalone || dismissed) return

    const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent) && !(window as any).MSStream
    
    if (isIOS) {
      // iOS Safari — show manual instructions after delay
      const timer = setTimeout(() => {
        setPlatform('ios')
        setShow(true)
      }, 5000)
      return () => clearTimeout(timer)
    }

    // Android/Chrome — listen for native install prompt
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setPlatform('android')
      setShow(true)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const dismiss = () => {
    setShow(false)
    localStorage.setItem('install-prompt-dismissed', Date.now().toString())
  }

  const installAndroid = async () => {
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      dismiss()
    }
    setDeferredPrompt(null)
  }

  if (!show || !platform) return null

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 animate-slide-up">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/20 backdrop-blur-sm" onClick={dismiss} />
      
      {/* Banner */}
      <div className="relative mx-3 mb-3 rounded-2xl bg-white shadow-2xl border border-amber/20 overflow-hidden">
        {/* Amber accent bar */}
        <div className="h-1 bg-gradient-to-r from-amber via-amber/80 to-amber/60" />
        
        <div className="p-5">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-amber/10 flex items-center justify-center text-2xl">
                🍺
              </div>
              <div>
                <h3 className="font-semibold text-charcoal text-base">
                  {platform === 'ios' ? 'Add PintDex to Home Screen' : 'Install PintDex'}
                </h3>
                <p className="text-sm text-charcoal/60">Get price alerts & the full app experience</p>
              </div>
            </div>
            <button
              onClick={dismiss}
              className="text-charcoal/40 hover:text-charcoal p-1 -mr-1 -mt-1"
              aria-label="Dismiss"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M6 6l8 8M14 6l-8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
          
          {/* Platform-specific content */}
          {platform === 'ios' ? (
            <div className="space-y-3 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#007AFF" strokeWidth="2">
                    <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8" strokeLinecap="round" strokeLinejoin="round"/>
                    <polyline points="16,6 12,2 8,6" strokeLinecap="round" strokeLinejoin="round"/>
                    <line x1="12" y1="2" x2="12" y2="15" strokeLinecap="round"/>
                  </svg>
                </div>
                <p className="text-sm text-charcoal/80">
                  Tap the <span className="font-medium text-blue-600">Share</span> button in Safari
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#007AFF" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <line x1="12" y1="8" x2="12" y2="16" strokeLinecap="round"/>
                    <line x1="8" y1="12" x2="16" y2="12" strokeLinecap="round"/>
                  </svg>
                </div>
                <p className="text-sm text-charcoal/80">
                  Scroll down and tap <span className="font-medium text-charcoal">&quot;Add to Home Screen&quot;</span>
                </p>
              </div>
            </div>
          ) : (
            <div className="mb-4">
              <button
                onClick={installAndroid}
                className="w-full py-3 px-4 bg-charcoal text-white font-semibold rounded-xl 
                           hover:bg-charcoal/90 active:scale-[0.98] transition-all text-sm"
              >
                Install PintDex
              </button>
            </div>
          )}
          
          {/* Benefits */}
          <div className="flex gap-2 flex-wrap">
            <span className="text-xs bg-amber/10 text-amber px-2.5 py-1 rounded-full font-medium">🔔 Price alerts</span>
            <span className="text-xs bg-amber/10 text-amber px-2.5 py-1 rounded-full font-medium">⚡ Instant access</span>
            <span className="text-xs bg-amber/10 text-amber px-2.5 py-1 rounded-full font-medium">📱 Full screen</span>
          </div>
        </div>
      </div>
    </div>
  )
}
