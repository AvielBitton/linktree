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

function WorkoutCard({ workout }) {
  const title = workout.Title || 'Run'
  const duration = parseFloat(workout.PlannedDuration) || parseFloat(workout.TimeTotalInHours) || 0
  
  return (
    <div className="bg-[rgba(25,25,25,0.85)] backdrop-blur-sm rounded-2xl p-4 transition-all duration-300 hover:bg-[rgba(35,35,35,0.9)]">
      {/* Date and Type */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-white/60 text-xs">
          {formatWorkoutDate(workout.date)}
        </span>
        <span className="bg-white/10 text-white/70 text-[10px] font-medium px-2 py-0.5 rounded-full">
          Run
        </span>
      </div>
      
      {/* Title */}
      <h3 className="text-white font-semibold text-[15px]">
        {title}
      </h3>
      
      {/* Duration */}
      {duration > 0 && (
        <div className="flex items-center gap-1 mt-2">
          <span className="text-gray-400 text-xs">Duration:</span>
          <span className="text-white/80 text-xs font-medium">{formatDuration(duration)}</span>
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
