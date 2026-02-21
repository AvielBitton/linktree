import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import CountUp from 'react-countup'
import StatsSection from './components/StatsSection'
import PlanSection from './components/PlanSection'
import RacesSection from './components/RacesSection'
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
      className={`relative px-6 py-2 rounded-xl text-sm font-medium transition-all ${
        isActive ? 'text-white' : 'text-white/40 hover:text-white/60'
      }`}
    >
      {isActive && (
        <motion.div
          layoutId="activeTabTrainee"
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

const traineeProfiles = {
  asaf: {
    name: 'Asaf Berman',
    tagline: <span>🩺 Doctor by day. 🦁 Lion by miles.</span>,
    best5K: '23:57',
    nextRace: {
      name: 'Tel Aviv Marathon',
      date: '28 February 2026',
      distance: 42.2,
      goal: '3:45:00'
    },
    colors: {
      primary: 'emerald',
      secondary: 'teal',
      gradient: 'from-emerald-500 to-teal-500',
      gradientLight: 'from-emerald-500/20 to-teal-500/20',
      gradientLighter: 'from-emerald-500/10 to-teal-500/10',
      orbColor1: 'bg-emerald-500/20',
      orbColor2: 'bg-teal-500/20',
      accent: 'emerald-400',
      accentHover: 'emerald-500/30',
      hex: '#10b981'
    }
  }
}

const defaultColors = {
  primary: 'violet',
  secondary: 'fuchsia',
  gradient: 'from-violet-500 to-fuchsia-500',
  gradientLight: 'from-violet-500/20 to-fuchsia-500/20',
  gradientLighter: 'from-violet-500/10 to-fuchsia-500/10',
  orbColor1: 'bg-violet-500/20',
  orbColor2: 'bg-fuchsia-500/20',
  accent: 'violet-400',
  accentHover: 'violet-500/30'
}

function TraineeApp({ traineeId }) {
  const [activeTab, setActiveTab] = useState('stats')
  const [totalStats, setTotalStats] = useState({ hours: 0, runs: 0 })
  
  const profile = traineeProfiles[traineeId] || { name: traineeId, tagline: 'Training to be unstoppable' }
  const colors = profile.colors || defaultColors
  const displayName = profile.name

  useEffect(() => {
    async function fetchStats() {
      const workouts = await loadWorkouts(traineeId)
      const completedRuns = workouts.filter(isCompletedRun)
      
      let totalHours = 0
      
      for (const run of completedRuns) {
        totalHours += parseFloat(run.TimeTotalInHours) || 0
      }
      
      setTotalStats({
        hours: Math.round(totalHours),
        runs: completedRuns.length
      })
    }
    fetchStats()
  }, [traineeId])

  const tabs = [
    { id: 'stats', label: 'Stats', icon: '📊' },
    { id: 'races', label: 'Races', icon: '🏁' },
    { id: 'plan', label: 'Plan', icon: '📋' }
  ]
  
  const tabContent = {
    plan: <PlanSection traineeId={traineeId} themeColor={colors.primary} />,
    stats: <StatsSection traineeId={traineeId} />,
    races: <RacesSection excludeRaces={['hever-race']} themeColor={colors.primary} />
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
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white tracking-tight mb-2">
              {displayName}
            </h1>
            <p className="text-white/40 text-sm sm:text-base font-medium">
              {profile.tagline}
            </p>
          </motion.div>

          {/* Countdown */}
          {profile.nextRace && (
            <motion.div
              className="mb-10 text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.15, duration: 0.5 }}
            >
              <p className="text-white/25 text-[11px] uppercase tracking-[0.2em] mb-4 font-medium">
                {profile.nextRace.name}
              </p>
              <HeroCountdown targetDate={profile.nextRace.date} />
              <div className="mt-4 flex items-center justify-center gap-4">
                <span className="text-white/20 text-xs font-medium">🎯 {profile.nextRace.goal}</span>
                <span className="text-white/20 text-xs font-medium">📏 {profile.nextRace.distance} km</span>
              </div>
            </motion.div>
          )}

          {/* Quick Stats */}
          <motion.div 
            className="grid grid-cols-3 gap-2.5 sm:gap-3 w-full max-w-md mb-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <StatCard icon="⚡" value={profile.best5K || '--'} suffix="" label="Best 5K" delay={0.3} isTime={true} />
            <StatCard icon="⏱️" value={totalStats.hours} suffix="h" label="Run Time" delay={0.4} />
            <StatCard icon="✅" value={totalStats.runs} suffix="" label="Runs Done" delay={0.5} />
          </motion.div>

          {/* Tabs */}
          <motion.div 
            className="bg-white/[0.03] rounded-2xl p-1 mb-8 border border-white/[0.06]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
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
            <a href="/" className="block">
              <div className="bg-white/[0.03] rounded-2xl p-4 border border-white/[0.06] hover:bg-white/[0.05] transition-colors group">
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 bg-accent/15 rounded-full flex items-center justify-center text-lg">
                    ⚔️
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-semibold text-[15px]">Aviel Bitton</p>
                    <p className="text-white/35 text-xs">Live boldly as a FREE SPIRIT</p>
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

export default TraineeApp
