import { useState } from 'react'

function Tabs({ tabs, defaultTab }) {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id)

  return (
    <div className="w-full max-w-[340px]">
      {/* Tab Switcher - Fixed, never moves */}
      <div className="flex items-center justify-center mb-4">
        <div className="inline-flex items-center bg-white/5 backdrop-blur-sm rounded-full p-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                relative px-5 py-2 text-sm font-medium rounded-full
                transition-all duration-200 ease-out
                ${activeTab === tab.id 
                  ? 'text-white bg-white/15' 
                  : 'text-white/60 bg-transparent hover:text-white/80'
                }
              `}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content Container - Fixed structure, only content animates */}
      <div id="tabs-container" className="relative">
        <div id="tab-content">
          {tabs.map((tab) => (
            <div
              key={tab.id}
              className={`
                transition-all duration-200 ease-out
                ${activeTab === tab.id 
                  ? 'opacity-100 translate-y-0' 
                  : 'hidden'
                }
              `}
            >
              {tab.content}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Tabs
