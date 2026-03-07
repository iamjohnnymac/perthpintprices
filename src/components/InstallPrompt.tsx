'use client'

import { useState, useEffect } from 'react'
import { Beer } from 'lucide-react'

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
    const dismissedAt = localStorage.getItem('install-prompt-dismissed')
    const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000
    
    // Already installed — bail
    if (isStandalone) return
    // Dismissed recently (within 7 days) — bail
    if (dismissedAt && Date.now() - parseInt(dismissedAt) < SEVEN_DAYS) return

    // Only show on mobile devices (skip desktop)
    const isMobile = window.innerWidth < 768 || 'ontouchstart' in window
    if (!isMobile) return

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
    <div className="fixed bottom-0 inset-x-0 z-40 animate-slide-up px-3 pb-[52px] pointer-events-none">
      <div className="pointer-events-auto rounded-card bg-white border-3 border-ink shadow-hard-sm overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3">
          {/* Icon */}
          <div className="w-9 h-9 rounded-[6px] bg-amber border-2 border-ink flex items-center justify-center flex-shrink-0">
            <Beer className="w-4 h-4 text-white" />
          </div>

          {/* Text */}
          <div className="flex-1 min-w-0">
            <p className="font-mono text-sm font-bold text-ink leading-tight truncate">
              {platform === 'ios' ? 'Add Arvo to Home Screen' : 'Install Arvo'}
            </p>
            <p className="text-xs text-gray-mid leading-tight mt-0.5">
              {platform === 'ios' ? 'Tap Share → Add to Home Screen' : 'Quick access to Perth pint prices'}
            </p>
          </div>

          {/* Action */}
          {platform === 'android' ? (
            <button
              onClick={installAndroid}
              className="px-4 py-1.5 bg-ink text-white font-mono text-xs font-bold uppercase tracking-[0.05em] rounded-pill border-2 border-ink
                         hover:bg-ink/90 active:scale-[0.97] transition-all flex-shrink-0"
            >
              Install
            </button>
          ) : (
            <button
              onClick={dismiss}
              className="px-3 py-1.5 bg-off-white text-ink font-mono text-xs font-bold uppercase tracking-[0.05em] rounded-pill border-2 border-ink
                         hover:bg-gray-light active:scale-[0.97] transition-all flex-shrink-0"
            >
              Got it
            </button>
          )}

          {/* Dismiss */}
          <button
            onClick={dismiss}
            className="text-gray-mid hover:text-ink p-1 flex-shrink-0 transition-colors"
            aria-label="Dismiss"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
