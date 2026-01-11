import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import CountUp from 'react-countup'
import StatsSection from './components/StatsSection'
import PlanSection from './components/PlanSection'
import Footer from './components/Footer'
import { loadWorkouts, isCompletedRun } from './utils/workouts'

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
      className={`relative px-6 py-2.5 rounded-xl text-sm font-medium transition-all ${
        isActive ? 'text-white' : 'text-white/50 hover:text-white/80'
      }`}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      {isActive && (
        <motion.div
          layoutId="activeTabTrainee"
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

// Trainee profiles
const traineeProfiles = {
  asaf: {
    name: 'Asaf Berman',
    tagline: '🩺 Doctor by day. 🦁 Lion by miles.',
    best5K: '23:57'
  }
}

function TraineeApp({ traineeId }) {
  const [activeTab, setActiveTab] = useState('stats')
  const [totalStats, setTotalStats] = useState({ hours: 0, runs: 0 })
  
  const profile = traineeProfiles[traineeId] || { name: traineeId, tagline: 'Training to be unstoppable' }
  const displayName = profile.name

  // Load total stats
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
    { id: 'plan', label: 'Plan', icon: '📋' }
  ]
  
  const tabContent = {
    plan: <PlanSection traineeId={traineeId} />,
    stats: <StatsSection traineeId={traineeId} />
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
          
          {/* Header */}
          <motion.div 
            className="text-center mb-6"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <motion.h1 
              className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight mb-3"
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
              {displayName}
            </motion.h1>
            <p className="text-white/60 text-sm sm:text-base font-medium">
              {profile.tagline}
            </p>
          </motion.div>

          {/* Quick Stats Row */}
          <motion.div 
            className="grid grid-cols-3 gap-3 sm:gap-4 w-full max-w-md mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <StatCard icon="⚡" value={profile.best5K || '--'} suffix="" label="Best 5K" delay={0.3} isTime={true} />
            <StatCard icon="⏱️" value={totalStats.hours} suffix="h" label="Run Time" delay={0.4} />
            <StatCard icon="✅" value={totalStats.runs} suffix="" label="Runs Done" delay={0.5} />
          </motion.div>

          {/* Tab Navigation */}
          <motion.div 
            className="bg-white/5 backdrop-blur-xl rounded-2xl p-1.5 mb-6 border border-white/10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
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
          <motion.div 
            className="w-full max-w-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
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
            transition={{ delay: 0.6 }}
          >
            <div className="text-center mb-4">
              <p className="text-white/30 text-xs uppercase tracking-[0.2em]">My Team</p>
            </div>
            <a
              href="/"
              className="block"
            >
              <motion.div 
                className="bg-gradient-to-r from-violet-500/10 to-fuchsia-500/10 backdrop-blur-sm rounded-2xl p-4 border border-white/10 hover:border-violet-500/30 transition-all group"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-full flex items-center justify-center text-xl">
                    ⚔️
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-bold">Aviel Bitton</p>
                    <p className="text-white/50 text-xs">Live boldly as a FREE SPIRIT</p>
                  </div>
                  <svg className="w-5 h-5 text-white/30 group-hover:text-violet-400 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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

export default TraineeApp

