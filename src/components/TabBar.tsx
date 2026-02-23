'use client'

export type TabId = 'pubs' | 'market' | 'explore'

interface TabBarProps {
  activeTab: TabId
  onTabChange: (tab: TabId) => void
  pubCount: number
  crowdCount: number
}

const tabs: { id: TabId; label: string; subtitle: string; emoji: string }[] = [
  {
    id: 'pubs',
    label: 'Pubs',
    subtitle: 'Map & prices',
    emoji: '🍺',
  },
  {
    id: 'market',
    label: 'Insights',
    subtitle: 'Trends & analytics',
    emoji: '📊',
  },
  {
    id: 'explore',
    label: 'Guides',
    subtitle: 'Curated picks',
    emoji: '🧭',
  },
]

export default function TabBar({ activeTab, onTabChange, crowdCount }: TabBarProps) {
  return (
    <div className="px-3 sm:px-4 py-2 sm:py-3">
      <div className="max-w-7xl mx-auto">
        {/* Graceful horizontal scroll on very narrow screens, snap for native feel */}
        <div
          className="flex gap-1.5 sm:gap-3 overflow-x-auto snap-x snap-mandatory scrollbar-hide"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}
        >
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                role="tab"
                aria-selected={isActive}
                onClick={() => onTabChange(tab.id)}
                className={`
                  relative flex-1 min-w-0 snap-start flex items-center gap-1.5 sm:gap-3 px-2.5 sm:px-4 py-3 sm:py-3.5
                  rounded-xl transition-all duration-200 ease-out
                  min-h-[48px] sm:min-h-[56px]
                  ${isActive
                    ? 'bg-charcoal text-white shadow-md shadow-charcoal/20'
                    : 'bg-white text-stone-600 border border-stone-200 hover:border-stone-300 hover:shadow-sm active:scale-[0.98]'
                  }
                `}
              >
                <span className={`text-base sm:text-xl flex-shrink-0 ${isActive ? 'scale-110' : ''} transition-transform duration-200`}>
                  {tab.emoji}
                </span>

                <div className="flex flex-col items-start min-w-0">
                  <span className={`text-[11px] sm:text-sm leading-tight truncate max-w-full ${isActive ? 'font-bold' : 'font-semibold'}`}>
                    {tab.label}
                  </span>
                  <span className={`text-[9px] sm:text-xs leading-tight truncate max-w-full ${isActive ? 'text-white/60' : 'text-stone-400'}`}>
                    {tab.subtitle}
                  </span>
                </div>

                {tab.id === 'market' && crowdCount > 0 && !isActive && (
                  <span className="absolute -top-1 -right-1 flex items-center justify-center w-2.5 h-2.5 rounded-full bg-amber animate-pulse ring-2 ring-white" />
                )}

                {isActive && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-amber" />
                )}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
