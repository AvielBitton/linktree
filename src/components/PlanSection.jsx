'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { formatWorkoutDate, formatDuration } from '../utils/workouts'

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

const AVG_PACE_MIN_PER_KM = 6 + 10/60

function roundDownToHalf(num) {
  return Math.floor(num * 2) / 2
}

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
  const isToday = new Date().toDateString() === workout.date.toDateString()
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.3 }}
      className={hasDetails ? 'cursor-pointer' : ''}
      onClick={() => hasDetails && setExpanded(!expanded)}
    >
      <div className={`rounded-2xl border transition-all ${
        isToday 
          ? 'bg-white/[0.06] border-white/[0.12]'
          : 'bg-white/[0.03] border-white/[0.06]'
      }`}>
        <div className="p-4">
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0">
              {distance > 0 ? (
                <span className="text-white font-semibold text-2xl tracking-tight">{(distance / 1000).toFixed(1)}<span className="text-white/25 text-sm ml-0.5 font-normal">km</span></span>
              ) : duration > 0 ? (
                <span className="text-white/60 font-semibold text-2xl tracking-tight">~{estimateDistance(duration)}<span className="text-white/25 text-sm ml-0.5 font-normal">km</span></span>
              ) : (
                <span className="text-white/20 font-semibold text-xl">--</span>
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-white/25 text-[10px] font-medium">
                  {formatWorkoutDate(workout.date)}
                </span>
                {isToday && (
                  <span className="text-accent text-[10px] font-semibold">TODAY</span>
                )}
              </div>
              
              <div className="flex items-center gap-1">
                {hasDetails && (
                  <motion.span 
                    className="text-white/20 text-[9px]"
                    animate={{ rotate: expanded ? 90 : 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    ▶
                  </motion.span>
                )}
                <h3 className="text-white/80 font-medium text-sm truncate">{title}</h3>
              </div>
              
              {duration > 0 && (
                <span className="text-white/25 text-xs font-medium">⏱ {formatDuration(duration)}</span>
              )}
            </div>
          </div>
          
          <AnimatePresence>
            {expanded && hasDetails && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden"
              >
                <div className="mt-3 pt-3 border-t border-white/[0.06] space-y-3" dir="rtl">
                  {description && (
                    <div>
                      <p className="text-white/20 text-[10px] tracking-wide mb-1 text-right font-medium">פרטי אימון</p>
                      <p className="text-white/40 text-xs leading-relaxed whitespace-pre-line text-right">{description}</p>
                    </div>
                  )}
                  {coachComments && (
                    <div>
                      <p className="text-white/20 text-[10px] tracking-wide mb-1 text-right font-medium">הערות מאמן</p>
                      <p className="text-white/40 text-xs leading-relaxed whitespace-pre-line text-right">{coachComments}</p>
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
  const isToday = new Date().toDateString() === workout.date.toDateString()
  
  const titleLower = title.toLowerCase()
  let icon = '⚡'
  if (titleLower.includes('upper')) icon = '💪'
  else if (titleLower.includes('lower')) icon = '🦿'
  else if (titleLower.includes('full')) icon = '🎯'
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.3 }}
      className={hasDetails ? 'cursor-pointer' : ''}
      onClick={() => hasDetails && setExpanded(!expanded)}
    >
      <div className={`rounded-2xl border transition-all ${
        isToday 
          ? 'bg-white/[0.06] border-white/[0.12]'
          : 'bg-white/[0.03] border-white/[0.06]'
      }`}>
        <div className="p-4">
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center bg-white/[0.04]">
              <span className="text-xl">{icon}</span>
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-white/25 text-[10px] font-medium">
                  {formatWorkoutDate(workout.date)}
                </span>
                {isToday && (
                  <span className="text-accent text-[10px] font-semibold">TODAY</span>
                )}
              </div>
              
              <div className="flex items-center gap-1">
                {hasDetails && (
                  <motion.span 
                    className="text-white/20 text-[9px]"
                    animate={{ rotate: expanded ? 90 : 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    ▶
                  </motion.span>
                )}
                <h3 className="text-white/80 font-medium text-sm truncate">{title}</h3>
              </div>
              
              <span className="text-white/20 text-xs font-medium">Strength</span>
            </div>
          </div>
          
          <AnimatePresence>
            {expanded && hasDetails && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden"
              >
                <div className="mt-3 pt-3 border-t border-white/[0.06] space-y-3" dir="rtl">
                  {description && (
                    <div>
                      <p className="text-white/20 text-[10px] tracking-wide mb-1 text-right font-medium">פרטי אימון</p>
                      <p className="text-white/40 text-xs leading-relaxed whitespace-pre-line text-right">{description}</p>
                    </div>
                  )}
                  {coachComments && (
                    <div>
                      <p className="text-white/20 text-[10px] tracking-wide mb-1 text-right font-medium">הערות מאמן</p>
                      <p className="text-white/40 text-xs leading-relaxed whitespace-pre-line text-right">{coachComments}</p>
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

function PlanSection({ traineeId = null, themeColor = 'violet', workouts = [] }) {
  const [activeTab, setActiveTab] = useState('run')

  const upcomingWorkouts = getUpcomingWorkouts(workouts, activeTab)

  const runCount = getUpcomingWorkouts(workouts, 'run').length
  const strengthCount = getUpcomingWorkouts(workouts, 'strength').length

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex items-center justify-center gap-1">
        <button
          onClick={() => setActiveTab('run')}
          className={`relative px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${
            activeTab === 'run' ? 'text-white' : 'text-white/30 hover:text-white/50'
          }`}
        >
          {activeTab === 'run' && (
            <motion.div
              layoutId="planActiveTab"
              className="absolute inset-0 rounded-lg bg-white/[0.08]"
              transition={{ type: 'spring', stiffness: 500, damping: 35 }}
            />
          )}
          <span className="relative flex items-center gap-1.5">
            Running
            <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${
              activeTab === 'run' ? 'bg-white/[0.1]' : 'bg-white/[0.04]'
            }`}>{runCount}</span>
          </span>
        </button>
        
        <button
          onClick={() => setActiveTab('strength')}
          className={`relative px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${
            activeTab === 'strength' ? 'text-white' : 'text-white/30 hover:text-white/50'
          }`}
        >
          {activeTab === 'strength' && (
            <motion.div
              layoutId="planActiveTab"
              className="absolute inset-0 rounded-lg bg-white/[0.08]"
              transition={{ type: 'spring', stiffness: 500, damping: 35 }}
            />
          )}
          <span className="relative flex items-center gap-1.5">
            Strength
            <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${
              activeTab === 'strength' ? 'bg-white/[0.1]' : 'bg-white/[0.04]'
            }`}>{strengthCount}</span>
          </span>
        </button>
      </div>

      <div className="px-1">
        <h2 className="text-white/25 text-[11px] uppercase tracking-wider font-medium">Next 7 Days</h2>
      </div>
      
      {upcomingWorkouts.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-3xl mb-3">{activeTab === 'run' ? '🏖️' : '😴'}</div>
          <p className="text-white/25 text-sm">
            {activeTab === 'run' 
              ? 'No runs planned for the next 7 days.'
              : 'No strength workouts planned for the next 7 days.'
            }
          </p>
          <p className="text-white/15 text-xs mt-1">Enjoy your rest!</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="space-y-2.5"
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
