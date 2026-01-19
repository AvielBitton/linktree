import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { formatPace, formatWorkoutDate } from '../utils/workouts'

// Workout type categories
const workoutTypes = [
  { id: 'all', label: 'All', filter: () => true },
  { id: 'long', label: 'Long Run', filter: (w) => w.WorkoutType?.toLowerCase().includes('long') || w.Title?.toLowerCase().includes('long') },
  { id: 'tempo', label: 'Tempo', filter: (w) => w.Title?.toLowerCase().includes('tempo') || w.Title?.toLowerCase().includes('threshold') },
  { id: 'easy', label: 'Easy', filter: (w) => w.Title?.toLowerCase().includes('easy') || w.Title?.toLowerCase().includes('recovery') || w.Title?.toLowerCase().includes('aerobic') },
  { id: 'speed', label: 'Speed', filter: (w) => w.Title?.toLowerCase().includes('interval') || w.Title?.toLowerCase().includes('vo2') || w.Title?.toLowerCase().includes('speed') },
]

// Single workout row (simplified)
function WorkoutListItem({ workout, index, colors }) {
  const [isExpanded, setIsExpanded] = useState(false)
  
  const workoutDate = new Date(workout.WorkoutDay)
  const formattedDate = formatWorkoutDate(workoutDate)
  
  // Format duration
  const duration = workout.durationHours
  const durationStr = duration < 1 
    ? `${Math.round(duration * 60)}m` 
    : `${Math.floor(duration)}h ${Math.round((duration % 1) * 60)}m`
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.02 }}
      className="bg-white/[0.03] rounded-lg border border-white/5 overflow-hidden"
    >
      {/* Main Row */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-3 text-left hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-white/50 text-xs mb-0.5">{formattedDate}</p>
            <p className="text-white font-medium text-sm truncate">
              {workout.Title || workout.WorkoutType || 'Run'}
            </p>
          </div>
          
          <div className="flex items-center gap-4 shrink-0">
            {/* Distance */}
            <div className="text-right">
              <p className="text-white font-bold text-sm">{workout.distanceKm} km</p>
              <p className="text-white/40 text-xs">{workout.paceFormatted}/km</p>
            </div>
            
            {/* Expand icon */}
            <motion.div
              animate={{ rotate: isExpanded ? 180 : 0 }}
              transition={{ duration: 0.2 }}
              className="text-white/30"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 9l-7 7-7-7" />
              </svg>
            </motion.div>
          </div>
        </div>
      </button>
      
      {/* Expanded Details */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 pt-0 border-t border-white/5">
              <div className="grid grid-cols-4 gap-2 pt-3">
                {/* Duration */}
                <div className="text-center">
                  <p className="text-white font-bold text-sm">{durationStr}</p>
                  <p className="text-white/40 text-[10px] uppercase">Duration</p>
                </div>
                
                {/* Pace */}
                <div className="text-center">
                  <p className="text-white font-bold text-sm">{workout.paceFormatted}</p>
                  <p className="text-white/40 text-[10px] uppercase">Pace</p>
                </div>
                
                {/* HR */}
                {workout.hr && (
                  <div className="text-center">
                    <p className="text-white font-bold text-sm">{Math.round(workout.hr)}</p>
                    <p className="text-white/40 text-[10px] uppercase">Avg HR</p>
                  </div>
                )}
                
                {/* Cadence */}
                {workout.cadence && (
                  <div className="text-center">
                    <p className="text-white font-bold text-sm">{Math.round(workout.cadence)}</p>
                    <p className="text-white/40 text-[10px] uppercase">Cadence</p>
                  </div>
                )}
                
                {/* RPE */}
                {workout.rpe && (
                  <div className="text-center">
                    <p className="text-white font-bold text-sm">{workout.rpe}/10</p>
                    <p className="text-white/40 text-[10px] uppercase">RPE</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

function AllWorkoutsView({ allWorkouts, colors }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedType, setSelectedType] = useState('all')
  const [visibleCount, setVisibleCount] = useState(20)
  
  // Filter and search workouts
  const filteredWorkouts = useMemo(() => {
    return allWorkouts.filter(workout => {
      // Type filter
      const typeFilter = workoutTypes.find(t => t.id === selectedType)
      if (!typeFilter?.filter(workout)) return false
      
      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase()
        const title = (workout.Title || '').toLowerCase()
        const type = (workout.WorkoutType || '').toLowerCase()
        const date = formatWorkoutDate(new Date(workout.WorkoutDay)).toLowerCase()
        
        if (!title.includes(query) && !type.includes(query) && !date.includes(query)) {
          return false
        }
      }
      
      return true
    })
  }, [allWorkouts, selectedType, searchQuery])
  
  const visibleWorkouts = filteredWorkouts.slice(0, visibleCount)
  const hasMore = visibleCount < filteredWorkouts.length
  
  const loadMore = () => {
    setVisibleCount(prev => Math.min(prev + 20, filteredWorkouts.length))
  }
  
  return (
    <div className="space-y-3">
      {/* Search Bar */}
      <div className="relative">
        <input
          type="text"
          placeholder="Search workouts..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 pl-10 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-white/20 transition-colors"
        />
        <svg 
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="M21 21l-4.35-4.35" />
        </svg>
        
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
      
      {/* Filter Buttons */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {workoutTypes.map(type => (
          <button
            key={type.id}
            onClick={() => setSelectedType(type.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
              selectedType === type.id
                ? 'bg-white/20 text-white'
                : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/70'
            }`}
          >
            {type.label}
          </button>
        ))}
      </div>
      
      {/* Results Count */}
      <p className="text-white/30 text-xs">
        {filteredWorkouts.length} workout{filteredWorkouts.length !== 1 ? 's' : ''} found
      </p>
      
      {/* Workouts List */}
      <div className="space-y-2">
        {visibleWorkouts.map((workout, index) => (
          <WorkoutListItem
            key={`${workout.WorkoutDay}-${index}`}
            workout={workout}
            index={index}
            colors={colors}
          />
        ))}
      </div>
      
      {/* Load More Button */}
      {hasMore && (
        <motion.button
          onClick={loadMore}
          className="w-full py-3 bg-white/5 hover:bg-white/10 rounded-xl text-white/60 text-sm font-medium transition-colors"
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
        >
          Load more ({filteredWorkouts.length - visibleCount} remaining)
        </motion.button>
      )}
      
      {/* Empty State */}
      {filteredWorkouts.length === 0 && (
        <div className="text-center py-8">
          <p className="text-white/30 text-sm">No workouts found</p>
          <p className="text-white/20 text-xs mt-1">Try a different search or filter</p>
        </div>
      )}
    </div>
  )
}

export default AllWorkoutsView

