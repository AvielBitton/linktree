import { useState, useEffect } from 'react'
import { loadWorkouts, formatWorkoutDate, formatDuration } from '../utils/workouts'

// Get workouts for next 7 days (running only)
function getUpcomingRunWorkouts(workouts) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const nextWeek = new Date(today)
  nextWeek.setDate(nextWeek.getDate() + 7)
  nextWeek.setHours(23, 59, 59, 999)
  
  return workouts
    .filter(w => {
      if (!w.date || w.date < today || w.date > nextWeek) return false
      
      const type = (w.WorkoutType || '').toLowerCase()
      if (!type.includes('run')) return false
      
      const excludeTypes = ['custom', 'strength', 'day off', 'rest', 'walk', 'recovery']
      for (const exclude of excludeTypes) {
        if (type.includes(exclude) && !type.includes('run')) return false
      }
      
      return true
    })
    .sort((a, b) => a.date - b.date)
}

function formatDistance(meters) {
  if (!meters) return null
  const km = meters / 1000
  return km >= 1 ? `${km.toFixed(1)} km` : `${Math.round(meters)} m`
}

function WorkoutCard({ workout }) {
  const [expanded, setExpanded] = useState(false)
  const title = workout.Title || 'Run'
  const duration = parseFloat(workout.PlannedDuration) || parseFloat(workout.TimeTotalInHours) || 0
  const distance = parseFloat(workout.PlannedDistanceInMeters) || 0
  const description = workout.WorkoutDescription || ''
  const coachComments = workout.CoachComments || ''
  
  const hasDetails = description || coachComments
  
  return (
    <div 
      className="bg-[rgba(25,25,25,0.85)] backdrop-blur-sm rounded-2xl p-4 transition-all duration-300 hover:bg-[rgba(35,35,35,0.9)]"
      onClick={() => hasDetails && setExpanded(!expanded)}
      style={{ cursor: hasDetails ? 'pointer' : 'default' }}
    >
      {/* Date and Type */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-white/60 text-xs">
          {formatWorkoutDate(workout.date)}
        </span>
        <span className="bg-white/10 text-white/70 text-[10px] font-medium px-2 py-0.5 rounded-full">
          Run
        </span>
      </div>
      
      {/* Title with expand arrow */}
      <div className="flex items-center gap-2">
        {hasDetails && (
          <span className={`text-white/40 text-[10px] transition-transform duration-200 ${expanded ? 'rotate-90' : ''}`}>
            ▶
          </span>
        )}
        <h3 className="text-white font-semibold text-[15px]">
          {title}
        </h3>
      </div>
      
      {/* Duration & Distance */}
      <div className="flex items-center gap-3 mt-2">
        {duration > 0 && (
          <div className="flex items-center gap-1">
            <span className="text-gray-400 text-xs">⏱</span>
            <span className="text-white/80 text-xs font-medium">{formatDuration(duration)}</span>
          </div>
        )}
        {distance > 0 && (
          <div className="flex items-center gap-1">
            <span className="text-gray-400 text-xs">📏</span>
            <span className="text-white/80 text-xs font-medium">{formatDistance(distance)}</span>
          </div>
        )}
      </div>
      
      {/* Expanded Details */}
      {expanded && hasDetails && (
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
      )}
    </div>
  )
}

function PlanSection() {
  const [upcomingWorkouts, setUpcomingWorkouts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const workouts = await loadWorkouts()
        const upcoming = getUpcomingRunWorkouts(workouts)
        setUpcomingWorkouts(upcoming)
      } catch (err) {
        console.error('Error loading plan:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="text-center text-gray-400 text-sm py-8">Loading plan...</div>
    )
  }

  if (upcomingWorkouts.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-400 text-sm mb-2">No runs planned for the next 7 days.</p>
        <p className="text-gray-500 text-xs">Check back later for upcoming workouts.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {upcomingWorkouts.map((workout, index) => (
        <WorkoutCard key={`${workout.WorkoutDay}-${index}`} workout={workout} />
      ))}
    </div>
  )
}

export default PlanSection
