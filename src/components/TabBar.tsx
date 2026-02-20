'use client'

export type TabId = 'pubs' | 'market' | 'explore'

interface TabBarProps {
  activeTab: TabId
  onTabChange: (tab: TabId) => void
  pubCount: number
  crowdCount: number
}

const tabs: { id: TabId; label: string; icon: JSX.Element; description: string }[] = [
  {
    id: 'pubs',
    label: 'Pubs',
    description: 'Find cheap pints',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 3h14M5 3v16a2 2 0 002 2h10a2 2 0 002-2V3M5 3H3M19 3h2M9 3v4M15 3v4" />
      </svg>
    ),
  },
  {
    id: 'market',
    label: 'Market',
    description: 'Beer Exchange',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22,7 13.5,15.5 8.5,10.5 2,17" />
        <polyline points="16,7 22,7 22,13" />
      </svg>
    ),
  },
  {
    id: 'explore',
    label: 'Explore',
    description: 'Tonight\'s plans',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polygon points="16.24,7.76 14.12,14.12 7.76,16.24 9.88,9.88" />
      </svg>
    ),
  },
]

export default function TabBar({ activeTab, onTabChange, pubCount, crowdCount }: TabBarProps) {
  return (
    <div className="bg-white border-b border-stone-200">
      <div className="max-w-7xl mx-auto px-4">
        <nav className="flex" role="tablist">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                role="tab"
                aria-selected={isActive}
                onClick={() => onTabChange(tab.id)}
                className={`
                  relative flex-1 flex items-center justify-center gap-2 py-3 px-2
                  text-sm font-medium transition-colors
                  ${isActive 
                    ? 'text-amber-700' 
                    : 'text-stone-400 hover:text-stone-600'
                  }
                `}
              >
                <span className={isActive ? 'text-amber-600' : ''}>{tab.icon}</span>
                <span>{tab.label}</span>
                {/* Badge for live counts */}
                {tab.id === 'pubs' && pubCount > 0 && (
                  <span className="text-[10px] text-stone-400 font-normal hidden sm:inline">
                    {pubCount}
                  </span>
                )}
                {tab.id === 'market' && crowdCount > 0 && (
                  <span className="flex items-center gap-0.5 text-[10px] text-green-500 font-normal hidden sm:inline">
                    <span className="w-1 h-1 rounded-full bg-green-500 animate-pulse" />
                    {crowdCount} live
                  </span>
                )}
                {/* Active indicator bar */}
                {isActive && (
                  <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-amber-600 rounded-full" />
                )}
              </button>
            )
          })}
        </nav>
      </div>
    </div>
  )
}
