'use client'

import { useWatchlist } from '@/hooks/useWatchlist'
import { Star } from 'lucide-react'

interface WatchlistButtonProps {
  slug: string
  name: string
  suburb: string
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  className?: string
}

export default function WatchlistButton({ slug, name, suburb, size = 'md', showLabel = false, className = '' }: WatchlistButtonProps) {
  const { isWatched, toggleWatch, isFull, isLoaded } = useWatchlist()

  if (!isLoaded) return null

  const watched = isWatched(slug)
  const disabled = !watched && isFull

  const sizeClasses = {
    sm: 'w-7 h-7 text-sm',
    md: 'w-9 h-9 text-lg',
    lg: 'w-11 h-11 text-xl',
  }

  return (
    <button
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        if (!disabled) toggleWatch(slug, name, suburb)
      }}
      disabled={disabled}
      title={watched ? 'Remove from My Locals' : disabled ? 'Watchlist full (5 max)' : 'Add to My Locals'}
      className={`
        ${sizeClasses[size]}
        inline-flex items-center justify-center gap-2 rounded-full
        transition-all duration-200 active:scale-90
        ${watched
          ? 'bg-amber/15 text-amber hover:bg-amber/25'
          : disabled
            ? 'bg-gray-light text-gray cursor-not-allowed'
            : 'bg-gray-light text-gray-mid hover:bg-amber/10 hover:text-amber'
        }
        ${className}
      `}
    >
      <Star className={`${size === 'sm' ? 'w-3.5 h-3.5' : size === 'md' ? 'w-4 h-4' : 'w-5 h-5'} ${watched ? 'fill-current' : ''}`} />
      {showLabel && (
        <span className="text-xs font-medium">
          {watched ? 'Watching' : 'Watch'}
        </span>
      )}
    </button>
  )
}
