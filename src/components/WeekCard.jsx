import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { formatPace, formatDuration, formatWorkoutDate } from '../utils/workouts'

// Default colors (violet/fuchsia)
const defaultColors = {
  primary: 'violet',
  hex: '#8b5cf6'
}

function WeekCard({ week, index = 0, colors = defaultColors }) {
  const [isExpanded, setIsExpanded] = useState(false)
  
  const weekNumber = week.weekKey.split('-')[1]
  
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.1 + index * 0.05 }}
    >
      {/* Week Header - Clickable */}
      <motion.button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full bg-white/5 backdrop-blur-sm rounded-xl p-3 border border-white/5 hover:border-white/10 transition-all"
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Expand/Collapse Icon */}
            <motion.div
              animate={{ rotate: isExpanded ? 90 : 0 }}
              transition={{ duration: 0.2 }}
              className="text-white/30"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </motion.div>
            <div className="text-left">
              <p className="text-white font-medium text-sm">Week {weekNumber}</p>
              <p className="text-white/40 text-xs">{week.workoutCount} runs</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-white font-bold">{week.distanceKm} km</p>
            <p className="text-white/40 text-xs">{formatPace(week.avgPace)} /km</p>
          </div>
        </div>
      </motion.button>
      
      {/* Expanded Workouts List */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="pt-2 pl-7 space-y-2">
              {week.workouts.map((workout, wIndex) => (
                <WorkoutRow 
                  key={`${workout.WorkoutDay}-${wIndex}`} 
                  workout={workout} 
                  index={wIndex}
                  colors={colors}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

function WorkoutRow({ workout, index, colors }) {
  const workoutDate = new Date(workout.WorkoutDay)
  const formattedDate = formatWorkoutDate(workoutDate)
  
  // Get workout type emoji
  const getTypeEmoji = (type) => {
    const t = (type || '').toLowerCase()
    if (t.includes('long')) return '🏃‍♂️'
    if (t.includes('tempo')) return '⚡'
    if (t.includes('interval') || t.includes('speed')) return '🔥'
    if (t.includes('easy') || t.includes('recovery')) return '🌿'
    if (t.includes('race')) return '🏁'
    return '👟'
  }
  
  const emoji = getTypeEmoji(workout.WorkoutType)
  
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className="bg-white/[0.03] rounded-lg p-3 border border-white/5"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          {/* Date & Type */}
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm">{emoji}</span>
            <span className="text-white/60 text-xs">{formattedDate}</span>
          </div>
          
          {/* Workout Title */}
          <p className="text-white text-sm font-medium truncate">
            {workout.Title || workout.WorkoutType || 'Run'}
          </p>
          
          {/* User Comments - if any */}
          {workout.UserComments && (
            <p className="text-white/40 text-xs mt-1 line-clamp-2">
              💬 {workout.UserComments}
            </p>
          )}
        </div>
        
        {/* Stats */}
        <div className="text-right shrink-0">
          <p className="text-white font-bold text-sm">{workout.distanceKm} km</p>
          <p className="text-white/40 text-xs">{workout.paceFormatted} /km</p>
          {workout.hr && (
            <p className="text-red-400/60 text-xs">❤️ {Math.round(workout.hr)}</p>
          )}
        </div>
      </div>
    </motion.div>
  )
}

export default WeekCard

