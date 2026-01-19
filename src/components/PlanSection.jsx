import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { loadWorkouts, formatWorkoutDate, formatDuration } from '../utils/workouts'

// Get workouts for next 7 days filtered by type
function getUpcomingWorkouts(workouts, type = 'run') {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const nextWeek = new Date(today)
  nextWeek.setDate(nextWeek.getDate() + 7)
  nextWeek.setHours(23, 59, 59, 999)
  
  return workouts
    .filter(w => {
      if (!w.date || w.date < today || w.date > nextWeek) return false
      
      const workoutType = (w.WorkoutType || '').toLowerCase()
      
      if (type === 'run') {
        if (!workoutType.includes('run')) return false
        const excludeTypes = ['custom', 'strength', 'day off', 'rest', 'walk']
        for (const exclude of excludeTypes) {
          if (workoutType.includes(exclude) && !workoutType.includes('run')) return false
        }
        return true
      } else if (type === 'strength') {
        return workoutType.includes('strength')
      }
      
      return false
    })
    .sort((a, b) => a.date - b.date)
}

// Average pace constant: 6:10 min/km
const AVG_PACE_MIN_PER_KM = 6 + 10/60

function formatDistance(meters) {
  if (!meters) return null
  const km = meters / 1000
  return km >= 1 ? `${km.toFixed(1)} km` : `${Math.round(meters)} m`
}

// Round down to nearest 0.5
function roundDownToHalf(num) {
  return Math.floor(num * 2) / 2
}

// Estimate distance from duration using average pace
function estimateDistance(durationHours) {
  if (!durationHours || durationHours <= 0) return null
  const durationMinutes = durationHours * 60
  const kmRaw = durationMinutes / AVG_PACE_MIN_PER_KM
  return roundDownToHalf(kmRaw)
}

function RunWorkoutCard({ workout, index, themeColor = 'violet' }) {
  const [expanded, setExpanded] = useState(false)
  const title = workout.Title || 'Run'
  const duration = parseFloat(workout.PlannedDuration) || parseFloat(workout.TimeTotalInHours) || 0
  const distance = parseFloat(workout.PlannedDistanceInMeters) || 0
  const description = workout.WorkoutDescription || ''
  const coachComments = workout.CoachComments || ''
  
  const hasDetails = description || coachComments
  
  // Check if workout is today
  const isToday = new Date().toDateString() === workout.date.toDateString()
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.4 }}
      className={`relative group ${hasDetails ? 'cursor-pointer' : ''}`}
      onClick={() => hasDetails && setExpanded(!expanded)}
    >
      {/* Glow Effect for Today */}
      {isToday && (
        <motion.div 
          className={`absolute inset-0 rounded-2xl blur-xl ${
            themeColor === 'emerald' 
              ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/20' 
              : 'bg-gradient-to-r from-violet-500/20 to-fuchsia-500/20'
          }`}
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}
      
      <div className={`relative overflow-hidden rounded-2xl border transition-all duration-300 ${
        isToday 
          ? themeColor === 'emerald'
            ? 'bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border-emerald-500/30'
            : 'bg-gradient-to-br from-violet-500/10 to-fuchsia-500/10 border-violet-500/30' 
          : 'bg-white/5 border-white/10 hover:border-white/20'
      }`}>
        <div className="p-4">
          {/* Main Row: Distance + Info */}
          <div className="flex items-center gap-4">
            {/* Big Distance - Left Side */}
            <div className="flex-shrink-0">
              {distance > 0 ? (
                <span className="text-white font-black text-2xl">{(distance / 1000).toFixed(1)}<span className="text-white/50 text-sm ml-1">km</span></span>
              ) : duration > 0 ? (
                <span className="text-white/80 font-black text-2xl">~{estimateDistance(duration)}<span className="text-white/50 text-sm ml-1">km</span></span>
              ) : (
                <span className="text-white/40 font-bold text-xl">--</span>
              )}
            </div>
            
            {/* Title, Time & Details */}
            <div className="flex-1 min-w-0">
              {/* Date row */}
              <div className="flex items-center gap-2 mb-1">
                <span className="text-white/40 text-[10px]">
                  {formatWorkoutDate(workout.date)}
                </span>
                {isToday && (
                  <span className={`text-white text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse ${
                    themeColor === 'emerald' ? 'bg-emerald-500' : 'bg-violet-500'
                  }`}>
                    TODAY
                  </span>
                )}
              </div>
              
              {/* Title with expand arrow */}
              <div className="flex items-center gap-1">
                {hasDetails && (
                  <motion.span 
                    className="text-white/40 text-[10px]"
                    animate={{ rotate: expanded ? 90 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    ▶
                  </motion.span>
                )}
                <h3 className="text-white font-medium text-sm truncate">
                  {title}
                </h3>
              </div>
              
              {/* Duration */}
              {duration > 0 && (
                <span className="text-white/50 text-xs">⏱ {formatDuration(duration)}</span>
              )}
            </div>
          </div>
          
          {/* Expanded Details - Full Width Below */}
          <AnimatePresence>
            {expanded && hasDetails && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="mt-3 pt-3 border-t border-white/10 space-y-3" dir="rtl">
                  {description && (
                    <div>
                      <p className="text-gray-400 text-[10px] tracking-wide mb-1 text-right">פרטי אימון</p>
                      <p className="text-white/70 text-xs leading-relaxed whitespace-pre-line text-right">{description}</p>
                    </div>
                  )}
                  {coachComments && (
                    <div>
                      <p className="text-gray-400 text-[10px] tracking-wide mb-1 text-right">הערות מאמן</p>
                      <p className="text-white/70 text-xs leading-relaxed whitespace-pre-line text-right">{coachComments}</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  )
}

function StrengthWorkoutCard({ workout, index, themeColor = 'violet' }) {
  const [expanded, setExpanded] = useState(false)
  const title = workout.Title || 'Strength'
  const description = workout.WorkoutDescription || ''
  const coachComments = workout.CoachComments || ''
  
  const hasDetails = description || coachComments
  
  // Check if workout is today
  const isToday = new Date().toDateString() === workout.date.toDateString()
  
  // Determine strength type for icon
  const titleLower = title.toLowerCase()
  let icon = '⚡'
  if (titleLower.includes('upper')) icon = '💪'
  else if (titleLower.includes('lower')) icon = '🦿'
  else if (titleLower.includes('full')) icon = '🎯'
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.4 }}
      className={`relative group ${hasDetails ? 'cursor-pointer' : ''}`}
      onClick={() => hasDetails && setExpanded(!expanded)}
    >
      {/* Glow Effect for Today */}
      {isToday && (
        <motion.div 
          className={`absolute inset-0 rounded-2xl blur-xl ${
            themeColor === 'emerald' 
              ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/20' 
              : 'bg-gradient-to-r from-violet-500/20 to-fuchsia-500/20'
          }`}
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}
      
      <div className={`relative overflow-hidden rounded-2xl border transition-all duration-300 ${
        isToday 
          ? themeColor === 'emerald'
            ? 'bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border-emerald-500/30'
            : 'bg-gradient-to-br from-violet-500/10 to-fuchsia-500/10 border-violet-500/30' 
          : 'bg-white/5 border-white/10 hover:border-white/20'
      }`}>
        <div className="p-4">
          {/* Main Row: Icon + Info */}
          <div className="flex items-center gap-4">
            {/* Icon - Left Side */}
            <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center ${
              themeColor === 'emerald'
                ? 'bg-gradient-to-br from-emerald-500/20 to-teal-500/20'
                : 'bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20'
            }`}>
              <span className="text-2xl">{icon}</span>
            </div>
            
            {/* Title & Details */}
            <div className="flex-1 min-w-0">
              {/* Date row */}
              <div className="flex items-center gap-2 mb-1">
                <span className="text-white/40 text-[10px]">
                  {formatWorkoutDate(workout.date)}
                </span>
                {isToday && (
                  <span className={`text-white text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse ${
                    themeColor === 'emerald' ? 'bg-emerald-500' : 'bg-violet-500'
                  }`}>
                    TODAY
                  </span>
                )}
              </div>
              
              {/* Title with expand arrow */}
              <div className="flex items-center gap-1">
                {hasDetails && (
                  <motion.span 
                    className="text-white/40 text-[10px]"
                    animate={{ rotate: expanded ? 90 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    ▶
                  </motion.span>
                )}
                <h3 className="text-white font-medium text-sm truncate">
                  {title}
                </h3>
              </div>
              
              {/* Strength badge */}
              <span className={`text-xs ${themeColor === 'emerald' ? 'text-emerald-400/70' : 'text-violet-400/70'}`}>Strength</span>
            </div>
          </div>
          
          {/* Expanded Details - Full Width Below */}
          <AnimatePresence>
            {expanded && hasDetails && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="mt-3 pt-3 border-t border-white/10 space-y-3" dir="rtl">
                  {description && (
                    <div>
                      <p className="text-gray-400 text-[10px] tracking-wide mb-1 text-right">פרטי אימון</p>
                      <p className="text-white/70 text-xs leading-relaxed whitespace-pre-line text-right">{description}</p>
                    </div>
                  )}
                  {coachComments && (
                    <div>
                      <p className="text-gray-400 text-[10px] tracking-wide mb-1 text-right">הערות מאמן</p>
                      <p className="text-white/70 text-xs leading-relaxed whitespace-pre-line text-right">{coachComments}</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  )
}

function PlanSection({ traineeId = null, themeColor = 'violet' }) {
  const [allWorkouts, setAllWorkouts] = useState([])
  const [activeTab, setActiveTab] = useState('run')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const workouts = await loadWorkouts(traineeId)
        setAllWorkouts(workouts)
      } catch (err) {
        console.error('Error loading plan:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [traineeId])

  const upcomingWorkouts = getUpcomingWorkouts(allWorkouts, activeTab)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <motion.div 
          className={`w-8 h-8 border-2 border-t-transparent rounded-full ${
            themeColor === 'emerald' ? 'border-emerald-500' : 'border-violet-500'
          }`}
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
      </div>
    )
  }

  const runCount = getUpcomingWorkouts(allWorkouts, 'run').length
  const strengthCount = getUpcomingWorkouts(allWorkouts, 'strength').length

  return (
    <div className="space-y-4">
      {/* Tabs - Minimal Pills */}
      <div className="flex items-center justify-center gap-2">
        <button
          onClick={() => setActiveTab('run')}
          className={`relative px-4 py-1.5 rounded-full text-xs font-medium transition-all duration-300 ${
            activeTab === 'run'
              ? themeColor === 'emerald' ? 'text-emerald-400' : 'text-violet-400'
              : 'text-white/40 hover:text-white/60'
          }`}
        >
          {activeTab === 'run' && (
            <motion.div
              layoutId="activeTab"
              className={`absolute inset-0 rounded-full ${
                themeColor === 'emerald'
                  ? 'bg-emerald-500/15 ring-1 ring-emerald-500/30'
                  : 'bg-violet-500/15 ring-1 ring-violet-500/30'
              }`}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            />
          )}
          <span className="relative flex items-center gap-1.5">
            Running
            <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${
              activeTab === 'run' 
                ? themeColor === 'emerald' ? 'bg-emerald-500/20' : 'bg-violet-500/20'
                : 'bg-white/10'
            }`}>{runCount}</span>
          </span>
        </button>
        
        <button
          onClick={() => setActiveTab('strength')}
          className={`relative px-4 py-1.5 rounded-full text-xs font-medium transition-all duration-300 ${
            activeTab === 'strength'
              ? themeColor === 'emerald' ? 'text-emerald-400' : 'text-violet-400'
              : 'text-white/40 hover:text-white/60'
          }`}
        >
          {activeTab === 'strength' && (
            <motion.div
              layoutId="activeTab"
              className={`absolute inset-0 rounded-full ${
                themeColor === 'emerald'
                  ? 'bg-emerald-500/15 ring-1 ring-emerald-500/30'
                  : 'bg-violet-500/15 ring-1 ring-violet-500/30'
              }`}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            />
          )}
          <span className="relative flex items-center gap-1.5">
            Strength
            <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${
              activeTab === 'strength' 
                ? themeColor === 'emerald' ? 'bg-emerald-500/20' : 'bg-violet-500/20'
                : 'bg-white/10'
            }`}>{strengthCount}</span>
          </span>
        </button>
      </div>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center justify-between px-1"
      >
        <h2 className="text-white/60 text-xs uppercase tracking-wider">Next 7 Days</h2>
      </motion.div>
      
      {/* Empty State */}
      {upcomingWorkouts.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-8"
        >
          <div className="text-4xl mb-3">{activeTab === 'run' ? '🏖️' : '😴'}</div>
          <p className="text-gray-400 text-sm mb-2">
            {activeTab === 'run' 
              ? 'No runs planned for the next 7 days.'
              : 'No strength workouts planned for the next 7 days.'
            }
          </p>
          <p className="text-gray-500 text-xs">Enjoy your rest!</p>
        </motion.div>
      ) : (
        /* Workout Cards */
        <div className="space-y-3">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: activeTab === 'run' ? -20 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: activeTab === 'run' ? 20 : -20 }}
              transition={{ duration: 0.2 }}
              className="space-y-3"
            >
              {upcomingWorkouts.map((workout, index) => (
                activeTab === 'run' ? (
                  <RunWorkoutCard key={`${workout.WorkoutDay}-${index}`} workout={workout} index={index} themeColor={themeColor} />
                ) : (
                  <StrengthWorkoutCard key={`${workout.WorkoutDay}-${index}`} workout={workout} index={index} themeColor={themeColor} />
                )
              ))}
            </motion.div>
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}

export default PlanSection
