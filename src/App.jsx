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

// Parse race date
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

// Next race data
const nextRace = {
  name: 'Tel Aviv Marathon',
  date: '28 February 2026',
  distance: 42.2,
  goal: '3:45:00'
}

// Hero Countdown Component
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
    <motion.div 
      className="flex flex-col items-center"
      whileHover={{ scale: 1.1 }}
      transition={{ type: "spring", stiffness: 400 }}
    >
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-xl blur-lg opacity-50" />
        <div className="relative bg-black/60 backdrop-blur-xl rounded-xl px-3 py-2 sm:px-4 sm:py-3 border border-white/10">
          <span className="text-2xl sm:text-4xl md:text-5xl font-black text-white tabular-nums">
            {String(value).padStart(2, '0')}
          </span>
        </div>
      </div>
      <span className="text-[10px] sm:text-xs text-white/50 mt-2 uppercase tracking-widest">{label}</span>
    </motion.div>
  )
  
  return (
    <div className="flex justify-center gap-2 sm:gap-4">
      <TimeBox value={timeLeft.days} label="Days" />
      <TimeBox value={timeLeft.hours} label="Hours" />
      <TimeBox value={timeLeft.minutes} label="Min" />
      <TimeBox value={timeLeft.seconds} label="Sec" />
    </div>
  )
}

// Stat Card Component
function StatCard({ icon, value, label, suffix = '', delay = 0, isTime = false }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      className="relative group"
    >
      <div className="absolute inset-0 bg-gradient-to-r from-violet-500/20 to-fuchsia-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <div className="relative bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10 hover:border-white/20 transition-all">
        <div className="text-2xl mb-2">{icon}</div>
        <div className="text-xl sm:text-2xl font-black text-white">
          {isTime ? (
            <span>{value}</span>
          ) : (
            <CountUp end={value} duration={2} delay={delay} separator="," />
          )}
          <span className="text-white/60 text-sm ml-1">{suffix}</span>
        </div>
        <div className="text-white/40 text-xs mt-1">{label}</div>
      </div>
    </motion.div>
  )
}

// Tab Button Component
function TabButton({ id, label, icon, isActive, onClick }) {
  return (
    <motion.button
      onClick={onClick}
      className={`relative px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
        isActive ? 'text-white' : 'text-white/50 hover:text-white/80'
      }`}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      {isActive && (
        <motion.div
          layoutId="activeTab"
          className="absolute inset-0 bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-xl"
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
        />
      )}
      <span className="relative flex items-center gap-2">
        <span>{icon}</span>
        <span>{label}</span>
      </span>
    </motion.button>
  )
}

function App() {
  const [activeTab, setActiveTab] = useState(() => {
    const hash = window.location.hash.slice(1)
    return ['stats', 'races', 'plan', 'gear'].includes(hash) ? hash : 'stats'
  })
  const [totalStats, setTotalStats] = useState({ distance: 0, hours: 0, runs: 0 })
  
  // Load total stats
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
  
  // Handle URL hash
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
      {/* Background - Pure Black */}
      <div className="fixed inset-0 bg-black" />
      
      {/* Gradient Overlay */}
      <div className="fixed inset-0 bg-gradient-to-b from-black/40 via-black/60 to-black" />
      
      {/* Animated Gradient Orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute -top-40 -right-40 w-80 h-80 bg-violet-500/20 rounded-full blur-3xl"
          animate={{ 
            x: [0, 50, 0],
            y: [0, 30, 0],
            scale: [1, 1.2, 1]
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute -bottom-40 -left-40 w-80 h-80 bg-fuchsia-500/20 rounded-full blur-3xl"
          animate={{ 
            x: [0, -30, 0],
            y: [0, -50, 0],
            scale: [1, 1.3, 1]
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col">
        <main className="flex-1 flex flex-col items-center px-4 sm:px-6 pt-8 sm:pt-12 pb-8">
          
          {/* Hero Section */}
          <motion.div 
            className="text-center mb-6"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Animated Gradient Name */}
            <motion.h1 
              className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight mb-3"
              style={{
                background: 'linear-gradient(135deg, #fff 0%, #8b5cf6 50%, #ec4899 100%)',
                backgroundSize: '200% 200%',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
              animate={{
                backgroundPosition: ['0% 50%', '100% 50%', '0% 50%']
              }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            >
              Aviel Bitton
            </motion.h1>
            <p className="text-white/60 text-sm sm:text-base font-medium">
              Live boldly as a <span className="text-violet-400 font-bold">FREE SPIRIT</span>
            </p>
          </motion.div>

          {/* Social Icons */}
          <motion.div 
            className="mb-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <SocialIcons />
          </motion.div>
          
          {/* Next Race Countdown */}
          <motion.div
            className="mb-8 text-center"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            <p className="text-white/40 text-xs uppercase tracking-[0.2em] mb-3">
              Countdown to {nextRace.name}
            </p>
            <HeroCountdown targetDate={nextRace.date} />
            <div className="mt-3 flex items-center justify-center gap-4">
              <span className="text-white/30 text-xs">🎯 Goal: {nextRace.goal}</span>
              <span className="text-white/30 text-xs">📏 {nextRace.distance} km</span>
            </div>
          </motion.div>
          
          {/* Quick Stats Row */}
          <motion.div 
            className="grid grid-cols-3 gap-3 sm:gap-4 w-full max-w-md mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <StatCard icon="⚡" value="22:57" suffix="" label="Best 5K" delay={0.6} isTime={true} />
            <StatCard icon="⏱️" value={totalStats.hours} suffix="h" label="Run Time" delay={0.7} />
            <StatCard icon="✅" value={totalStats.runs} suffix="" label="Runs Done" delay={0.8} />
          </motion.div>

          {/* Running Playlist Button */}
          <motion.a
            href="https://open.spotify.com/playlist/7n2NWN00He9JPNcRlVBuNH"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full max-w-md mb-8 block"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="bg-gradient-to-r from-green-500/20 to-green-600/10 backdrop-blur-sm rounded-xl p-3 border border-green-500/20 flex items-center gap-3 hover:border-green-500/40 transition-all">
              <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-white font-medium text-sm">locked in | run mode</p>
                <p className="text-white/50 text-xs">My running playlist 🎧</p>
              </div>
              <svg className="w-4 h-4 text-white/40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </div>
          </motion.a>

          {/* Tab Navigation */}
          <motion.div 
            className="bg-white/5 backdrop-blur-xl rounded-2xl p-1.5 mb-6 border border-white/10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
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
          <motion.div 
            className="w-full max-w-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {tabContent[activeTab]}
              </motion.div>
            </AnimatePresence>
          </motion.div>

          {/* My Team Section */}
          <motion.div
            className="w-full max-w-md mt-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
          >
            <div className="text-center mb-4">
              <p className="text-white/30 text-xs uppercase tracking-[0.2em]">My Team</p>
            </div>
            <a
              href="/asaf"
              className="block"
            >
              <motion.div 
                className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 backdrop-blur-sm rounded-2xl p-4 border border-white/10 hover:border-emerald-500/30 transition-all group"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full flex items-center justify-center text-xl">
                    🦁
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-bold">Asaf Berman</p>
                    <p className="text-white/50 text-xs">🩺 <strong>Doctor</strong> by day. 🦁 <strong>Lion</strong> by miles.</p>
                  </div>
                  <svg className="w-5 h-5 text-white/30 group-hover:text-emerald-400 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                </div>
              </motion.div>
            </a>
          </motion.div>
        </main>

        <Footer />
      </div>
    </div>
  )
}

export default App
