import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { formatPace, formatWorkoutDate } from '../utils/workouts'

const workoutTypes = [
  { id: 'all', label: 'All', filter: () => true },
  { id: 'long', label: 'Long Run', filter: (w) => w.WorkoutType?.toLowerCase().includes('long') || w.Title?.toLowerCase().includes('long') },
  { id: 'tempo', label: 'Tempo', filter: (w) => w.Title?.toLowerCase().includes('tempo') || w.Title?.toLowerCase().includes('threshold') },
  { id: 'easy', label: 'Easy', filter: (w) => w.Title?.toLowerCase().includes('easy') || w.Title?.toLowerCase().includes('recovery') || w.Title?.toLowerCase().includes('aerobic') },
  { id: 'speed', label: 'Speed', filter: (w) => w.Title?.toLowerCase().includes('interval') || w.Title?.toLowerCase().includes('vo2') || w.Title?.toLowerCase().includes('speed') },
]

function WorkoutListItem({ workout, index, colors }) {
  const [isExpanded, setIsExpanded] = useState(false)
  
  const workoutDate = new Date(workout.WorkoutDay)
  const formattedDate = formatWorkoutDate(workoutDate)
  
  const duration = workout.durationHours
  const durationStr = duration < 1 
    ? `${Math.round(duration * 60)}m` 
    : `${Math.floor(duration)}h ${Math.round((duration % 1) * 60)}m`
  
  return (
    <div className="bg-white/[0.03] rounded-xl border border-white/[0.06] overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-3 text-left hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-white/25 text-[11px] font-medium mb-0.5">{formattedDate}</p>
            <p className="text-white/80 font-medium text-sm truncate">
              {workout.Title || workout.WorkoutType || 'Run'}
            </p>
          </div>
          
          <div className="flex items-center gap-4 shrink-0">
            <div className="text-right">
              <p className="text-white font-semibold text-sm">{workout.distanceKm} km</p>
              <p className="text-white/25 text-[11px]">{workout.paceFormatted}/km</p>
            </div>
            
            <motion.div
              animate={{ rotate: isExpanded ? 180 : 0 }}
              transition={{ duration: 0.15 }}
              className="text-white/15"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M19 9l-7 7-7-7" />
              </svg>
            </motion.div>
          </div>
        </div>
      </button>
      
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 pt-0 border-t border-white/[0.04]">
              <div className="flex items-center justify-center gap-3 pt-2.5 text-[11px] font-medium flex-wrap">
                <span className="text-white/30">{durationStr}</span>
                <span className="text-white/10">·</span>
                <span className="text-white/30">{workout.paceFormatted}/km</span>
                {workout.hr && (
                  <>
                    <span className="text-white/10">·</span>
                    <span className="text-white/30">{Math.round(workout.hr)} bpm</span>
                  </>
                )}
                {workout.cadence && (
                  <>
                    <span className="text-white/10">·</span>
                    <span className="text-white/30">{Math.round(workout.cadence)} spm</span>
                  </>
                )}
                {workout.rpe && (
                  <>
                    <span className="text-white/10">·</span>
                    <span className="text-white/30">RPE {workout.rpe}</span>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function AllWorkoutsView({ allWorkouts, colors }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedType, setSelectedType] = useState('all')
  const [visibleCount, setVisibleCount] = useState(5)
  const [sortBy, setSortBy] = useState('date')
  
  const filteredWorkouts = useMemo(() => {
    let results = allWorkouts.filter(workout => {
      const typeFilter = workoutTypes.find(t => t.id === selectedType)
      if (!typeFilter?.filter(workout)) return false
      
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim()
        const title = (workout.Title || '').toLowerCase()
        const type = (workout.WorkoutType || '').toLowerCase()
        const date = formatWorkoutDate(new Date(workout.WorkoutDay)).toLowerCase()
        const distanceStr = String(workout.distanceKm)
        
        const numQuery = parseFloat(query)
        const isNumericSearch = !isNaN(numQuery)
        
        if (isNumericSearch) {
          if (!distanceStr.startsWith(query)) return false
        } else {
          if (!title.includes(query) && !type.includes(query) && !date.includes(query)) return false
        }
      }
      
      return true
    })
    
    if (sortBy === 'distance') {
      results = [...results].sort((a, b) => b.distanceKm - a.distanceKm)
    }
    
    return results
  }, [allWorkouts, selectedType, searchQuery, sortBy])
  
  const visibleWorkouts = filteredWorkouts.slice(0, visibleCount)
  const hasMore = visibleCount < filteredWorkouts.length
  
  return (
    <div className="space-y-3">
      {/* Search */}
      <div className="relative">
        <input
          type="text"
          placeholder="Search workouts..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-white/[0.04] border border-white/[0.06] rounded-xl px-4 py-2.5 pl-10 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-white/[0.12] transition-colors"
        />
        <svg 
          className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/20" 
          viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="M21 21l-4.35-4.35" />
        </svg>
        
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/40"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
      
      {/* Filters */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
        {workoutTypes.map(type => (
          <button
            key={type.id}
            onClick={() => setSelectedType(type.id)}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-medium whitespace-nowrap transition-all ${
              selectedType === type.id
                ? 'bg-white/[0.1] text-white'
                : 'bg-white/[0.03] text-white/30 hover:bg-white/[0.06] hover:text-white/50'
            }`}
          >
            {type.label}
          </button>
        ))}
      </div>
      
      {/* Count & Sort */}
      <div className="flex items-center justify-between">
        <p className="text-white/20 text-[11px] font-medium">
          {filteredWorkouts.length} workout{filteredWorkouts.length !== 1 ? 's' : ''}
        </p>
        
        <div className="flex items-center gap-0.5 text-[11px]">
          <button
            onClick={() => setSortBy('date')}
            className={`px-2 py-1 rounded-md font-medium transition-colors ${
              sortBy === 'date' ? 'bg-white/[0.08] text-white/60' : 'text-white/25 hover:text-white/40'
            }`}
          >
            Date
          </button>
          <button
            onClick={() => setSortBy('distance')}
            className={`px-2 py-1 rounded-md font-medium transition-colors ${
              sortBy === 'distance' ? 'bg-white/[0.08] text-white/60' : 'text-white/25 hover:text-white/40'
            }`}
          >
            KM
          </button>
        </div>
      </div>
      
      {/* List */}
      <div className="space-y-1.5">
        {visibleWorkouts.map((workout, index) => (
          <WorkoutListItem
            key={`${workout.WorkoutDay}-${index}`}
            workout={workout}
            index={index}
            colors={colors}
          />
        ))}
      </div>
      
      {hasMore && (
        <button
          onClick={() => setVisibleCount(prev => Math.min(prev + 5, filteredWorkouts.length))}
          className="w-full py-2.5 bg-white/[0.03] hover:bg-white/[0.05] rounded-xl text-white/30 text-xs font-medium transition-colors border border-white/[0.06]"
        >
          Load more ({filteredWorkouts.length - visibleCount} remaining)
        </button>
      )}
      
      {filteredWorkouts.length === 0 && (
        <div className="text-center py-8">
          <p className="text-white/20 text-sm">No workouts found</p>
          <p className="text-white/10 text-xs mt-1">Try a different search or filter</p>
        </div>
      )}
    </div>
  )
}

export default AllWorkoutsView
