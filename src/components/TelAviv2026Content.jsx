'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import CountUp from 'react-countup'
import RacesSection from './RacesSection'
import StatsSection from './StatsSection'
import PlanSection from './PlanSection'
import GearSection from './GearSection'
import { hydrateWorkouts, isCompletedRun } from '../utils/workouts'

const marathonResult = {
  name: 'Tel Aviv Marathon 2026',
  date: '28 February 2026',
  distance: '42.4 km',
  finishTime: '3:59:50',
}

function MarathonResult() {
  return (
    <div className="flex flex-col items-center">
      <p className="text-white/25 text-[11px] uppercase tracking-[0.2em] mb-4 font-medium">
        {marathonResult.name}
      </p>
      <div className="bg-white/[0.04] rounded-2xl px-8 py-5 border border-white/[0.06] mb-3">
        <span className="text-4xl sm:text-5xl font-semibold text-white tabular-nums tracking-tight">
          {marathonResult.finishTime}
        </span>
      </div>
      <div className="flex items-center justify-center gap-4 mt-1">
        <span className="text-white/20 text-xs font-medium">{marathonResult.distance}</span>
        <span className="text-white/20 text-xs font-medium">{marathonResult.date}</span>
      </div>
    </div>
  )
}

function StatCard({ icon, value, label, suffix = '', delay = 0, isTime = false }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
    >
      <div className="bg-white/[0.03] rounded-2xl p-4 border border-white/[0.06]">
        <div className="text-lg mb-1.5">{icon}</div>
        <div className="text-xl sm:text-2xl font-semibold text-white tracking-tight">
          {isTime ? (
            <span>{value}</span>
          ) : (
            <CountUp end={value} duration={2} delay={delay} separator="," />
          )}
          <span className="text-white/30 text-sm ml-1 font-normal">{suffix}</span>
        </div>
        <div className="text-white/30 text-xs mt-1 font-medium">{label}</div>
      </div>
    </motion.div>
  )
}

function InnerTabButton({ id, label, icon, isActive, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`relative px-4 py-2 rounded-xl text-sm font-medium transition-all ${
        isActive ? 'text-white' : 'text-white/40 hover:text-white/60'
      }`}
    >
      {isActive && (
        <motion.div
          layoutId="activeTabTLV"
          className="absolute inset-0 bg-white/[0.08] rounded-xl"
          transition={{ type: "spring", stiffness: 500, damping: 35 }}
        />
      )}
      <span className="relative flex items-center gap-1.5">
        <span className="text-sm">{icon}</span>
        <span>{label}</span>
      </span>
    </button>
  )
}

function TelAviv2026Content({ initialWorkouts = [], dataPath = 'telaviv2026/aviel' }) {
  const workouts = useMemo(() => hydrateWorkouts(initialWorkouts), [initialWorkouts])

  const [activeTab, setActiveTab] = useState('stats')

  const totalStats = useMemo(() => {
    const completedRuns = workouts.filter(isCompletedRun)
    let totalDistance = 0
    let totalHours = 0
    for (const run of completedRuns) {
      totalDistance += parseFloat(run.DistanceInMeters) || 0
      totalHours += parseFloat(run.TimeTotalInHours) || 0
    }
    return {
      distance: Math.round(totalDistance / 1000),
      hours: Math.round(totalHours),
      runs: completedRuns.length,
    }
  }, [workouts])

  const tabs = [
    { id: 'stats', label: 'Stats', icon: '📊' },
    { id: 'races', label: 'Races', icon: '🏁' },
    { id: 'plan', label: 'Plan', icon: '📋' },
    { id: 'gear', label: 'Gear', icon: '👟' }
  ]

  const tabContent = {
    stats: <StatsSection traineeId={dataPath} workouts={workouts} />,
    races: <RacesSection />,
    plan: <PlanSection traineeId={dataPath} workouts={workouts} />,
    gear: <GearSection />
  }

  return (
    <div className="flex flex-col items-center w-full">
      {/* Archive banner */}
      <div className="w-full bg-amber-400/[0.07] border border-amber-400/15 rounded-2xl px-4 py-3 mb-6">
        <p className="text-amber-300/60 text-xs font-medium text-center">
          Training log & race recap for the Tel Aviv Marathon, February 2026
        </p>
      </div>

      {/* Marathon Result */}
      <div className="mb-8 text-center">
        <MarathonResult />
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-2.5 w-full max-w-md mb-8">
        <StatCard icon="⚡" value="22:57" suffix="" label="Best 5K" delay={0.1} isTime={true} />
        <StatCard icon="⏱️" value={totalStats.hours} suffix="h" label="Run Time" delay={0.15} />
        <StatCard icon="✅" value={totalStats.runs} suffix="" label="Runs Done" delay={0.2} />
      </div>

      {/* Spotify */}
      <a
        href="https://open.spotify.com/playlist/7n2NWN00He9JPNcRlVBuNH"
        target="_blank"
        rel="noopener noreferrer"
        className="w-full max-w-md mb-8 block"
      >
        <div className="bg-white/[0.03] rounded-2xl p-3.5 border border-white/[0.06] flex items-center gap-3 hover:bg-white/[0.05] transition-colors">
          <div className="w-9 h-9 bg-[#1DB954] rounded-lg flex items-center justify-center flex-shrink-0">
            <svg className="w-4.5 h-4.5 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white/90 font-medium text-sm">locked in | run mode</p>
            <p className="text-white/30 text-xs">Running playlist</p>
          </div>
          <svg className="w-4 h-4 text-white/20 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        </div>
      </a>

      {/* Inner Tabs */}
      <div className="bg-white/[0.03] rounded-2xl p-1 mb-6 border border-white/[0.06]">
        <div className="flex">
          {tabs.map(tab => (
            <InnerTabButton
              key={tab.id}
              {...tab}
              isActive={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
            />
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="w-full max-w-md">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            {tabContent[activeTab]}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* My Team */}
      <div className="w-full max-w-md mt-12">
        <div className="text-center mb-4">
          <p className="text-white/20 text-[11px] uppercase tracking-[0.2em] font-medium">My Team</p>
        </div>
        <a href="/telaviv2026/asaf" className="block">
          <div className="bg-white/[0.03] rounded-2xl p-4 border border-white/[0.06] hover:bg-white/[0.05] transition-colors group">
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 bg-accent-emerald/15 rounded-full flex items-center justify-center text-lg">
                🦁
              </div>
              <div className="flex-1">
                <p className="text-white font-semibold text-[15px]">Asaf Berman</p>
                <p className="text-white/35 text-xs">Doctor by day. Lion by miles.</p>
              </div>
              <svg className="w-4 h-4 text-white/15 group-hover:text-white/30 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 18l6-6-6-6"/>
              </svg>
            </div>
          </div>
        </a>
      </div>
    </div>
  )
}

export default TelAviv2026Content
