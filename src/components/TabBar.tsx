'use client'

export type TabId = 'pubs' | 'market' | 'explore'

interface TabBarProps {
  activeTab: TabId
  onTabChange: (tab: TabId) => void
  pubCount: number
  crowdCount: number
}

const tabs: { id: TabId; label: string; activeIcon: JSX.Element; inactiveIcon: JSX.Element }[] = [
  {
    id: 'pubs',
    label: 'The Floor',
    // Filled pint glass
    activeIcon: (
      <svg viewBox="0 0 24 24" className="w-[22px] h-[22px]" fill="currentColor" stroke="none">
        <path d="M5 3a1 1 0 011-1h12a1 1 0 011 1v1H5V3zm0 2h14v14a3 3 0 01-3 3H8a3 3 0 01-3-3V5zm4-2v3h2V3H9zm4 0v3h2V3h-2z" />
      </svg>
    ),
    // Outline pint glass
    inactiveIcon: (
      <svg viewBox="0 0 24 24" className="w-[22px] h-[22px]" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 3h14M5 3v16a2 2 0 002 2h10a2 2 0 002-2V3M5 3H3M19 3h2M9 3v4M15 3v4" />
      </svg>
    ),
  },
  {
    id: 'market',
    label: 'Market Data',
    // Filled chart
    activeIcon: (
      <svg viewBox="0 0 24 24" className="w-[22px] h-[22px]" fill="currentColor" stroke="none">
        <path d="M3 13h2v8H3v-8zm6-5h2v13H9V8zm6-4h2v17h-2V4zm6 7h-2v10h2V11z" />
        <path d="M2 17l5.5-5.5 3.5 3.5L22 4" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    // Outline chart
    inactiveIcon: (
      <svg viewBox="0 0 24 24" className="w-[22px] h-[22px]" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22,7 13.5,15.5 8.5,10.5 2,17" />
        <polyline points="16,7 22,7 22,13" />
      </svg>
    ),
  },
  {
    id: 'explore',
    label: 'Discover',
    // Filled compass
    activeIcon: (
      <svg viewBox="0 0 24 24" className="w-[22px] h-[22px]" fill="currentColor" stroke="none">
        <path fillRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.243 5.757l-2.12 6.364-6.364 2.122 2.12-6.364 6.364-2.122zM12 13a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
      </svg>
    ),
    // Outline compass
    inactiveIcon: (
      <svg viewBox="0 0 24 24" className="w-[22px] h-[22px]" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polygon points="16.24,7.76 14.12,14.12 7.76,16.24 9.88,9.88" />
      </svg>
    ),
  },
]

export default function TabBar({ activeTab, onTabChange, pubCount, crowdCount }: TabBarProps) {
  return (
    <div className="bg-navy">
      <div className="max-w-7xl mx-auto">
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
                  relative flex-1 flex flex-col items-center justify-center gap-1 py-3
                  transition-all duration-200 ease-out
                  ${isActive 
                    ? 'text-gold' 
                    : 'text-cream/70 hover:text-cream/90'
                  }
                `}
              >
                {/* Icon */}
                <span className={`transition-transform duration-200 ${isActive ? 'scale-110' : ''}`}>
                  {isActive ? tab.activeIcon : tab.inactiveIcon}
                </span>

                {/* Label */}
                <span className={`text-[11px] leading-none ${isActive ? 'font-semibold' : 'font-medium'}`}>
                  {tab.label}
                </span>

                {/* Live badge for market */}
                {tab.id === 'market' && crowdCount > 0 && (
                  <span className="absolute top-2 right-1/4 flex items-center justify-center w-2 h-2 rounded-full bg-teal animate-pulse ring-2 ring-navy" />
                )}

                {/* Count badge for pubs */}
                {tab.id === 'pubs' && pubCount > 0 && !isActive && (
                  <span className="absolute top-2 right-1/4 flex items-center justify-center min-w-[16px] h-4 px-1 text-[9px] font-bold rounded-full bg-gold/20 text-gold">
                    {pubCount}
                  </span>
                )}

                {/* Active indicator — thick bottom bar */}
                <span className={`
                  absolute bottom-0 left-3 right-3 h-[3px] rounded-full
                  transition-all duration-200
                  ${isActive ? 'bg-gold opacity-100' : 'bg-transparent opacity-0'}
                `} />
              </button>
            )
          })}
        </nav>
      </div>
    </div>
  )
}
