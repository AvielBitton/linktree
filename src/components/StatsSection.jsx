import { useState, useEffect } from 'react'
import { loadWorkouts, getAllWeeksStats, formatPace } from '../utils/workouts'

function WeekCard({ weekKey, distanceKm, avgPace, avgHR, durationHours, workoutCount }) {
  // Parse week key (e.g., "2025-49" -> year 2025, week 49)
  const [year, week] = weekKey.split('-')
  
  return (
    <div className="block w-full bg-[rgba(25,25,25,0.85)] backdrop-blur-sm rounded-2xl px-5 py-3">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-white font-semibold text-[15px]">
          Week {parseInt(week)}
        </h3>
        <span className="text-gray-400 text-xs">
          {year}
        </span>
      </div>
      
      <div className="grid grid-cols-2 gap-x-4 gap-y-1">
        <div className="flex justify-between">
          <span className="text-gray-400 text-xs">Distance</span>
          <span className="text-white/80 text-xs font-medium">{distanceKm} km</span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-gray-400 text-xs">Duration</span>
          <span className="text-white/80 text-xs font-medium">{durationHours}h</span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-gray-400 text-xs">Avg Pace</span>
          <span className="text-white/80 text-xs font-medium">{formatPace(avgPace)} /km</span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-gray-400 text-xs">Avg HR</span>
          <span className="text-white/80 text-xs font-medium">{avgHR || '--'} bpm</span>
        </div>
      </div>
      
      <div className="mt-2 pt-2 border-t border-white/10">
        <span className="text-gray-500 text-xs">{workoutCount} run{workoutCount !== 1 ? 's' : ''} this week</span>
      </div>
    </div>
  )
}

function StatsSection() {
  const [weeks, setWeeks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function fetchData() {
      try {
        const workouts = await loadWorkouts()
        const stats = getAllWeeksStats(workouts)
        setWeeks(stats)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="text-center text-gray-400 text-sm py-8">Loading stats...</div>
    )
  }

  if (error || weeks.length === 0) {
    return (
      <div className="text-center text-gray-500 text-sm py-8">
        No weekly stats available yet.
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {weeks.map((week) => (
        <WeekCard
          key={week.weekKey}
          weekKey={week.weekKey}
          distanceKm={week.distanceKm}
          avgPace={week.avgPace}
          avgHR={week.avgHR}
          durationHours={week.durationHours}
          workoutCount={week.workoutCount}
        />
      ))}
    </div>
  )
}

export default StatsSection
