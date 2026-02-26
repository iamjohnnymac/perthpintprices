'use client'

export type TabId = 'pubs' | 'market' | 'explore'

interface TabBarProps {
  activeTab: TabId
  onTabChange: (tab: TabId) => void
  pubCount: number
  crowdCount: number
}

const tabs: { id: TabId; label: string }[] = [
  { id: 'pubs', label: 'Pubs' },
  { id: 'market', label: 'Insights' },
  { id: 'explore', label: 'Guides' },
]

export default function TabBar({ activeTab, onTabChange }: TabBarProps) {
  return (
    <div className="mt-2 mb-1">
      <div className="flex gap-1">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              onClick={() => onTabChange(tab.id)}
              className={`
                flex-1 py-2.5 sm:py-3 
                text-sm sm:text-base font-semibold
                transition-all duration-200
                outline-none focus:outline-none
                border-b-2
                ${isActive
                  ? 'text-charcoal border-amber'
                  : 'text-stone-400 border-transparent hover:text-stone-600'
                }
              `}
            >
              {tab.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
