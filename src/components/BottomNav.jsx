'use client'

import { TabsList, TabsTrigger } from '@/src/components/ui/tabs'

const tabs = [
  {
    value: 'home',
    label: 'Home',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <line x1="3" y1="10" x2="21" y2="10" />
        <line x1="9" y1="4" x2="9" y2="10" />
      </svg>
    ),
  },
  {
    value: 'next',
    label: 'Next',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
  },
  {
    value: 'log',
    label: 'Log',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10 9 9 9 8 9" />
      </svg>
    ),
  },
  {
    value: 'nutrition',
    label: 'Menu',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
        <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
        <line x1="6" y1="1" x2="6" y2="4" />
        <line x1="10" y1="1" x2="10" y2="4" />
        <line x1="14" y1="1" x2="14" y2="4" />
      </svg>
    ),
  },
  {
    value: 'gym',
    label: 'Gym',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6.5 6.5a2 2 0 0 1 2-2h0a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2h0a2 2 0 0 1-2-2z" />
        <path d="M13.5 6.5a2 2 0 0 1 2-2h0a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2h0a2 2 0 0 1-2-2z" />
        <path d="M4 12h2.5" />
        <path d="M17.5 12H20" />
        <path d="M2 10v4" />
        <path d="M22 10v4" />
      </svg>
    ),
  },
  {
    value: 'prs',
    label: 'PRs',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="8" r="6" />
        <path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11" />
      </svg>
    ),
  },
  {
    value: 'archive',
    label: 'TLV 2026',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 8v13H3V8" />
        <path d="M1 3h22v5H1z" />
        <path d="M10 12h4" />
      </svg>
    ),
  },
]

function BottomNav() {
  return (
    <TabsList
      className="fixed bottom-0 left-0 right-0 z-50 h-auto bg-[#0D1117]/90 backdrop-blur-xl border-t border-white/[0.06]"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="max-w-lg mx-auto w-full flex items-center justify-around h-14">
        {tabs.map(tab => (
          <TabsTrigger
            key={tab.value}
            value={tab.value}
            className="flex flex-col items-center justify-center gap-0.5 w-16 py-1.5 text-white/30 data-[state=active]:text-white transition-colors bg-transparent border-none"
          >
            {tab.icon}
            <span className="text-[10px] font-medium">{tab.label}</span>
          </TabsTrigger>
        ))}
      </div>
    </TabsList>
  )
}

export default BottomNav
