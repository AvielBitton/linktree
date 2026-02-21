import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import CountUp from 'react-countup'
import SocialIcons from './components/SocialIcons'
import RacesSection from './components/RacesSection'
import StatsSection from './components/StatsSection'
import PlanSection from './components/PlanSection'
import GearSection from './components/GearSection'
import Footer from './components/Footer'
import { loadWorkouts, isCompletedRun } from './utils/workouts'

function parseDate(dateStr) {
  const months = {
    'January': 0, 'February': 1, 'March': 2, 'April': 3,
    'May': 4, 'June': 5, 'July': 6, 'August': 7,
    'September': 8, 'October': 9, 'November': 10, 'December': 11
  }
  const parts = dateStr.split(' ')
  const day = parseInt(parts[0])
  const month = months[parts[1]]
  const year = parseInt(parts[2])
  return new Date(year, month, day)
}

const nextRace = {
  name: 'Tel Aviv Marathon',
  date: '28 February 2026',
  distance: 42.2,
  goal: '3:45:00'
}

function HeroCountdown({ targetDate }) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 })
  
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date()
      const target = parseDate(targetDate)
      const diff = target - now
      
      if (diff > 0) {
        setTimeLeft({
          days: Math.floor(diff / (1000 * 60 * 60 * 24)),
          hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((diff % (1000 * 60)) / 1000)
        })
      }
    }, 1000)
    
    return () => clearInterval(timer)
  }, [targetDate])
  
  const TimeBox = ({ value, label }) => (
    <div className="flex flex-col items-center">
      <div className="bg-white/[0.04] rounded-2xl px-4 py-3 sm:px-5 sm:py-4 border border-white/[0.06]">
        <span className="text-2xl sm:text-4xl md:text-5xl font-semibold text-white tabular-nums tracking-tight">
          {String(value).padStart(2, '0')}
        </span>
      </div>
      <span className="text-[10px] sm:text-xs text-white/30 mt-2 uppercase tracking-widest font-medium">{label}</span>
    </div>
  )
  
  return (
    <div className="flex justify-center gap-2.5 sm:gap-3">
      <TimeBox value={timeLeft.days} label="Days" />
      <TimeBox value={timeLeft.hours} label="Hours" />
      <TimeBox value={timeLeft.minutes} label="Min" />
      <TimeBox value={timeLeft.seconds} label="Sec" />
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

function TabButton({ id, label, icon, isActive, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`relative px-4 py-2 rounded-xl text-sm font-medium transition-all ${
        isActive ? 'text-white' : 'text-white/40 hover:text-white/60'
      }`}
    >
      {isActive && (
        <motion.div
          layoutId="activeTab"
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

function App() {
  const [activeTab, setActiveTab] = useState(() => {
    const hash = window.location.hash.slice(1)
    return ['stats', 'races', 'plan', 'gear'].includes(hash) ? hash : 'stats'
  })
  const [totalStats, setTotalStats] = useState({ distance: 0, hours: 0, runs: 0 })
  
  useEffect(() => {
    async function fetchStats() {
      const workouts = await loadWorkouts()
      const completedRuns = workouts.filter(isCompletedRun)
      
      let totalDistance = 0
      let totalHours = 0
      
      for (const run of completedRuns) {
        totalDistance += parseFloat(run.DistanceInMeters) || 0
        totalHours += parseFloat(run.TimeTotalInHours) || 0
      }
      
      setTotalStats({
        distance: Math.round(totalDistance / 1000),
        hours: Math.round(totalHours),
        runs: completedRuns.length
      })
    }
    fetchStats()
  }, [])
  
  useEffect(() => {
    if (activeTab === 'races') {
      history.replaceState(null, '', window.location.pathname)
    } else {
      window.location.hash = activeTab
    }
  }, [activeTab])
  
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1)
      if (['stats', 'races', 'plan', 'gear'].includes(hash)) {
        setActiveTab(hash)
      } else {
        setActiveTab('stats')
      }
    }
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  const tabs = [
    { id: 'stats', label: 'Stats', icon: '📊' },
    { id: 'races', label: 'Races', icon: '🏁' },
    { id: 'plan', label: 'Plan', icon: '📋' },
    { id: 'gear', label: 'Gear', icon: '👟' }
  ]
  
  const tabContent = {
    races: <RacesSection />,
    plan: <PlanSection />,
    stats: <StatsSection />,
    gear: <GearSection />
  }

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden bg-black">
      <div className="fixed inset-0 bg-black" />

      <div className="relative z-10 min-h-screen flex flex-col">
        <main className="flex-1 flex flex-col items-center px-5 sm:px-6 pt-12 sm:pt-16 pb-8">
          
          {/* Hero */}
          <motion.div 
            className="text-center mb-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white tracking-tight mb-2">
              Aviel Bitton
            </h1>
            <p className="text-white/40 text-sm sm:text-base font-medium">
              Live boldly as a <span className="text-accent font-semibold">FREE SPIRIT</span>
            </p>
          </motion.div>

          {/* Social Icons */}
          <motion.div 
            className="mb-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <SocialIcons />
          </motion.div>
          
          {/* Countdown */}
          <motion.div
            className="mb-10 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <p className="text-white/25 text-[11px] uppercase tracking-[0.2em] mb-4 font-medium">
              {nextRace.name}
            </p>
            <HeroCountdown targetDate={nextRace.date} />
            <div className="mt-4 flex items-center justify-center gap-4">
              <span className="text-white/20 text-xs font-medium">🎯 {nextRace.goal}</span>
              <span className="text-white/20 text-xs font-medium">📏 {nextRace.distance} km</span>
            </div>
          </motion.div>
          
          {/* Quick Stats */}
          <motion.div 
            className="grid grid-cols-3 gap-2.5 sm:gap-3 w-full max-w-md mb-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <StatCard icon="⚡" value="22:57" suffix="" label="Best 5K" delay={0.5} isTime={true} />
            <StatCard icon="⏱️" value={totalStats.hours} suffix="h" label="Run Time" delay={0.6} />
            <StatCard icon="✅" value={totalStats.runs} suffix="" label="Runs Done" delay={0.7} />
          </motion.div>

          {/* Spotify */}
          <motion.a
            href="https://open.spotify.com/playlist/7n2NWN00He9JPNcRlVBuNH"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full max-w-md mb-10 block"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.45 }}
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
          </motion.a>

          {/* Tabs */}
          <motion.div 
            className="bg-white/[0.03] rounded-2xl p-1 mb-8 border border-white/[0.06]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <div className="flex">
              {tabs.map(tab => (
                <TabButton
                  key={tab.id}
                  {...tab}
                  isActive={activeTab === tab.id}
                  onClick={() => setActiveTab(tab.id)}
                />
              ))}
            </div>
          </motion.div>

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
          <motion.div
            className="w-full max-w-md mt-16"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            <div className="text-center mb-4">
              <p className="text-white/20 text-[11px] uppercase tracking-[0.2em] font-medium">My Team</p>
            </div>
            <a href="/asaf" className="block">
              <div className="bg-white/[0.03] rounded-2xl p-4 border border-white/[0.06] hover:bg-white/[0.05] transition-colors group">
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 bg-accent-emerald/15 rounded-full flex items-center justify-center text-lg">
                    🦁
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-semibold text-[15px]">Asaf Berman</p>
                    <p className="text-white/35 text-xs">🩺 Doctor by day. 🦁 Lion by miles.</p>
                  </div>
                  <svg className="w-4 h-4 text-white/15 group-hover:text-white/30 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 18l6-6-6-6"/>
                  </svg>
                </div>
              </div>
            </a>
          </motion.div>
        </main>

        <Footer />
      </div>
    </div>
  )
}

export default App
