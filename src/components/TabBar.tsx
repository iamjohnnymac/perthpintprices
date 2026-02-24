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
    <div className="mt-3 mb-1">
      <div className="flex rounded-xl bg-stone-100 p-1 gap-1">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              onClick={() => onTabChange(tab.id)}
              className={`
                flex-1 flex items-center justify-center
                py-2.5 sm:py-3 rounded-lg
                text-sm sm:text-base font-semibold
                transition-all duration-200
                outline-none focus:outline-none focus-visible:ring-2 focus-visible:ring-amber/50
                ${isActive
                  ? 'bg-white text-charcoal shadow-sm'
                  : 'text-stone-400 hover:text-stone-600 active:scale-[0.98]'
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
