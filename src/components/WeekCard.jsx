import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { formatPace, formatDuration, formatWorkoutDate } from '../utils/workouts'

// Default colors (violet/fuchsia)
const defaultColors = {
  primary: 'violet',
  hex: '#8b5cf6'
}

// HR Zone colors and names
const hrZoneConfig = [
  { name: 'Z1', color: '#94a3b8', label: 'Recovery' },      // gray
  { name: 'Z2', color: '#22c55e', label: 'Easy' },          // green
  { name: 'Z3', color: '#eab308', label: 'Tempo' },         // yellow
  { name: 'Z4', color: '#f97316', label: 'Threshold' },     // orange
  { name: 'Z5', color: '#ef4444', label: 'VO2max' },        // red
]

// HR Zones Bar Component (for weekly summary)
function HRZonesBar({ zones, totalMinutes, label = 'HR Zones' }) {
  if (!zones || totalMinutes === 0) return null
  
  return (
    <div>
      <p className="text-white/40 text-[10px] uppercase tracking-wider mb-1.5">{label}</p>
      
      {/* Stacked Bar */}
      <div className="flex h-2 rounded-full overflow-hidden bg-white/5">
        {zones.map((minutes, i) => {
          const percentage = (minutes / totalMinutes) * 100
          if (percentage < 1) return null
          return (
            <motion.div
              key={i}
              initial={{ width: 0 }}
              animate={{ width: `${percentage}%` }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="h-full"
              style={{ backgroundColor: hrZoneConfig[i].color }}
              title={`${hrZoneConfig[i].name}: ${Math.round(minutes)}min (${Math.round(percentage)}%)`}
            />
          )
        })}
      </div>
      
      {/* Legend */}
      <div className="flex flex-wrap gap-3 mt-2">
        {zones.map((minutes, i) => {
          const percentage = (minutes / totalMinutes) * 100
          if (percentage < 1) return null
          return (
            <div key={i} className="flex items-center gap-1.5">
              <div 
                className="w-2 h-2 rounded-full" 
                style={{ backgroundColor: hrZoneConfig[i].color }}
              />
              <span className="text-white/50 text-[10px]">
                Zone {i + 1} {Math.round(percentage)}%
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// HR Zones Pie Chart Component (for individual workouts)
function HRZonesPie({ zones, totalMinutes, cadence }) {
  if (!zones || totalMinutes === 0) return null
  
  // Calculate segments
  const segments = []
  let currentAngle = -90 // Start from top
  
  zones.forEach((minutes, i) => {
    const percentage = (minutes / totalMinutes) * 100
    if (percentage >= 1) {
      const angle = (percentage / 100) * 360
      segments.push({
        startAngle: currentAngle,
        endAngle: currentAngle + angle,
        percentage,
        color: hrZoneConfig[i].color,
        name: hrZoneConfig[i].name,
        index: i
      })
      currentAngle += angle
    }
  })
  
  // SVG donut arc path helper (ring, not filled pie)
  const describeDonutArc = (cx, cy, outerRadius, innerRadius, startAngle, endAngle) => {
    const outerStart = polarToCartesian(cx, cy, outerRadius, endAngle)
    const outerEnd = polarToCartesian(cx, cy, outerRadius, startAngle)
    const innerStart = polarToCartesian(cx, cy, innerRadius, endAngle)
    const innerEnd = polarToCartesian(cx, cy, innerRadius, startAngle)
    const largeArcFlag = endAngle - startAngle <= 180 ? 0 : 1
    
    return `M ${outerStart.x} ${outerStart.y} 
            A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 0 ${outerEnd.x} ${outerEnd.y}
            L ${innerEnd.x} ${innerEnd.y}
            A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 1 ${innerStart.x} ${innerStart.y}
            Z`
  }
  
  const polarToCartesian = (cx, cy, radius, angle) => {
    const radians = (angle * Math.PI) / 180
    return {
      x: cx + radius * Math.cos(radians),
      y: cy + radius * Math.sin(radians)
    }
  }
  
  return (
    <motion.div 
      className="bg-white/[0.02] rounded-xl p-4 border border-white/5"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <p className="text-white/40 text-[10px] uppercase tracking-wider mb-3">Workout HR Zones</p>
      
      <div className="flex items-center gap-5">
        {/* Donut Chart */}
        <div className="flex-shrink-0">
          <motion.svg 
            width="72" 
            height="72" 
            viewBox="0 0 72 72"
            initial={{ opacity: 0, rotate: -90 }}
            animate={{ opacity: 1, rotate: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          >
            {/* Background ring */}
            <circle 
              cx="36" 
              cy="36" 
              r="28" 
              fill="none" 
              stroke="rgba(255,255,255,0.05)" 
              strokeWidth="10"
            />
            
            {/* Segments */}
            {segments.map((seg, i) => (
              <motion.path
                key={i}
                d={describeDonutArc(36, 36, 33, 23, seg.startAngle, seg.endAngle)}
                fill={seg.color}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1, duration: 0.4 }}
              />
            ))}
          </motion.svg>
        </div>
        
        {/* Legend */}
        <div className="flex flex-col gap-2">
          {segments.map((seg) => (
            <motion.div 
              key={seg.index} 
              className="flex items-center gap-2"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: seg.index * 0.05 }}
            >
              <div 
                className="w-2.5 h-2.5 rounded-sm" 
                style={{ backgroundColor: seg.color }}
              />
              <span className="text-white/60 text-xs">
                Zone {seg.index + 1}
              </span>
              <span className="text-white/80 text-xs font-medium">
                {Math.round(seg.percentage)}%
              </span>
            </motion.div>
          ))}
        </div>
        
        {/* Cadence */}
        {cadence && (
          <motion.div 
            className="flex flex-col items-center justify-center ml-auto pl-4 border-l border-white/10"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
          >
            <span className="text-2xl font-bold text-white">{Math.round(cadence)}</span>
            <span className="text-white/40 text-[10px] uppercase tracking-wider">spm</span>
            <span className="text-white/30 text-[9px] uppercase tracking-wider mt-0.5">cadence</span>
          </motion.div>
        )}
      </div>
    </motion.div>
  )
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
              {/* Week HR Zones Summary */}
              {week.hrZonesTotal > 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-white/[0.02] rounded-lg p-3 border border-white/5 mb-2"
                >
                  <HRZonesBar zones={week.hrZones} totalMinutes={week.hrZonesTotal} label="Weekly HR Zones" />
                </motion.div>
              )}
              
              {/* Workouts List */}
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

// Parse comments into separate entries
function parseComments(rawComments) {
  if (!rawComments || !rawComments.trim()) return []
  
  // Pattern: *DD/MM/YYYY Name: comment text*
  const regex = /\*?(\d{2}\/\d{2}\/\d{4})\s+([^:]+):\s*([^*]+)\*?/g
  const comments = []
  let match
  
  while ((match = regex.exec(rawComments)) !== null) {
    comments.push({
      date: match[1],
      author: match[2].trim(),
      text: match[3].trim()
    })
  }
  
  // If no structured comments found, return raw text as single comment
  if (comments.length === 0 && rawComments.trim()) {
    return [{
      date: null,
      author: null,
      text: rawComments.replace(/\*/g, '').trim()
    }]
  }
  
  return comments
}

// Comment card component
function CommentCard({ comment, index }) {
  const isCoach = comment.author && comment.author.toLowerCase().includes('daniel')
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`rounded-lg p-3 ${isCoach ? 'bg-white/[0.04] border border-white/10' : 'bg-white/[0.02] border border-white/5'}`}
      dir="rtl"
    >
      {/* Author & Date Header */}
      {comment.author && (
        <div className="flex items-center gap-2 mb-2">
          <span className="text-sm">{isCoach ? '🎯' : '🏃'}</span>
          <span className={`text-xs font-medium ${isCoach ? 'text-white/80' : 'text-white/70'}`}>
            {comment.author}
          </span>
          {comment.date && (
            <span className="text-white/30 text-[10px]">
              {comment.date}
            </span>
          )}
        </div>
      )}
      
      {/* Comment Text */}
      <p className="text-white/60 text-xs leading-relaxed whitespace-pre-wrap text-right">
        {comment.text}
      </p>
    </motion.div>
  )
}

function WorkoutRow({ workout, index, colors }) {
  const [showComments, setShowComments] = useState(false)
  const workoutDate = new Date(workout.WorkoutDay)
  const formattedDate = formatWorkoutDate(workoutDate)
  
  // Parse athlete comments into structured format
  const rawComments = workout.AthleteComments || ''
  const parsedComments = parseComments(rawComments)
  const hasComments = parsedComments.length > 0
  const commentCount = parsedComments.length
  
  // Check if we have HR zones data
  const hasHRZones = workout.hrZonesTotal > 0
  const hasDetails = hasComments || hasHRZones
  
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
          
          {/* Details Toggle Button (HR Zones + Comments) */}
          {hasDetails && (
            <button
              onClick={() => setShowComments(!showComments)}
              className="flex items-center gap-1 mt-2 text-white/40 hover:text-white/60 transition-colors text-xs"
            >
              <span>{hasHRZones ? '❤️' : '💬'}</span>
              <span>
                {showComments ? 'Hide' : 'Show'} details
                {hasComments && ` (${commentCount})`}
              </span>
              <motion.span
                animate={{ rotate: showComments ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                ▼
              </motion.span>
            </button>
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
      
      {/* Expanded Details (HR Zones + Comments) */}
      <AnimatePresence>
        {showComments && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mt-3 pt-3 border-t border-white/5 space-y-3">
              {/* Workout HR Zones - Pie Chart */}
              {workout.hrZonesTotal > 0 && (
                <HRZonesPie zones={workout.hrZones} totalMinutes={workout.hrZonesTotal} cadence={workout.cadence} />
              )}
              
              {/* Comments */}
              {hasComments && (
                <div className="space-y-2">
                  {parsedComments.map((comment, cIndex) => (
                    <CommentCard key={cIndex} comment={comment} index={cIndex} />
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default WeekCard

