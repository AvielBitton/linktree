import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { formatPace, formatDuration, formatWorkoutDate } from '../utils/workouts'

const defaultColors = {
  primary: 'violet',
  hex: '#8b5cf6'
}

const hrZoneConfig = [
  { name: 'Z1', color: '#636366', label: 'Recovery' },
  { name: 'Z2', color: '#30D158', label: 'Easy' },
  { name: 'Z3', color: '#FFD60A', label: 'Tempo' },
  { name: 'Z4', color: '#FF9F0A', label: 'Threshold' },
  { name: 'Z5', color: '#FF453A', label: 'VO2max' },
]

function HRZonesBar({ zones, totalMinutes, label = 'HR Zones' }) {
  if (!zones || totalMinutes === 0) return null
  
  return (
    <div>
      <p className="text-white/25 text-[10px] uppercase tracking-wider mb-1.5 font-medium">{label}</p>
      
      <div className="flex h-1.5 rounded-full overflow-hidden bg-white/[0.04]">
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
              style={{ backgroundColor: hrZoneConfig[i].color, opacity: 0.8 }}
            />
          )
        })}
      </div>
      
      <div className="flex flex-wrap gap-3 mt-2">
        {zones.map((minutes, i) => {
          const percentage = (minutes / totalMinutes) * 100
          if (percentage < 1) return null
          return (
            <div key={i} className="flex items-center gap-1.5">
              <div 
                className="w-1.5 h-1.5 rounded-full" 
                style={{ backgroundColor: hrZoneConfig[i].color }}
              />
              <span className="text-white/30 text-[10px] font-medium">
                Z{i + 1} {Math.round(percentage)}%
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function HRZonesPie({ zones, totalMinutes, cadence, rpe }) {
  if (!zones || totalMinutes === 0) return null
  
  const segments = []
  let currentAngle = -90
  
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
    <div className="bg-white/[0.02] rounded-xl p-4 border border-white/[0.04]">
      <p className="text-white/25 text-[10px] uppercase tracking-wider mb-3 font-medium">Workout HR Zones</p>
      
      <div className="flex items-center justify-center gap-5">
        <div className="flex-shrink-0">
          <svg width="72" height="72" viewBox="0 0 72 72">
            <circle cx="36" cy="36" r="28" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="10" />
            {segments.map((seg, i) => (
              <motion.path
                key={i}
                d={describeDonutArc(36, 36, 33, 23, seg.startAngle, seg.endAngle)}
                fill={seg.color}
                fillOpacity={0.8}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.1, duration: 0.3 }}
              />
            ))}
          </svg>
        </div>
        
        <div className="flex flex-col gap-1.5">
          {segments.map((seg) => (
            <div key={seg.index} className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: seg.color, opacity: 0.8 }} />
              <span className="text-white/35 text-[11px]">Z{seg.index + 1}</span>
              <span className="text-white/60 text-[11px] font-medium">{Math.round(seg.percentage)}%</span>
            </div>
          ))}
        </div>
      </div>
      
      {(cadence || rpe) && (
        <div className="grid grid-cols-2 gap-4 mt-4 pt-3 border-t border-white/[0.04]">
          {cadence && (
            <div className="flex flex-col items-center justify-center">
              <span className="text-xl font-semibold text-white">{Math.round(cadence)}</span>
              <span className="text-white/25 text-[9px] uppercase tracking-wider font-medium">spm · cadence</span>
            </div>
          )}
          {rpe && (
            <div className="flex flex-col items-center justify-center border-l border-white/[0.06]">
              <span className="text-xl font-semibold text-white">{Math.round(rpe)}<span className="text-white/25 text-base">/10</span></span>
              <span className="text-white/25 text-[9px] uppercase tracking-wider font-medium">rpe</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function WeekCard({ week, index = 0, colors = defaultColors }) {
  const [isExpanded, setIsExpanded] = useState(false)
  const weekNumber = week.weekKey.split('-')[1]
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.05 + index * 0.03 }}
    >
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full bg-white/[0.03] rounded-xl p-3.5 border border-white/[0.06] hover:bg-white/[0.04] transition-colors text-left"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.div
              animate={{ rotate: isExpanded ? 90 : 0 }}
              transition={{ duration: 0.15 }}
              className="text-white/20"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </motion.div>
            <div>
              <p className="text-white font-medium text-sm">Week {weekNumber}</p>
              <p className="text-white/25 text-xs">{week.workoutCount} runs</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-white font-semibold text-sm">{week.distanceKm} km</p>
            <p className="text-white/25 text-xs">{formatPace(week.avgPace)} /km</p>
          </div>
        </div>
      </button>
      
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="pt-2 pl-6 space-y-2">
              {week.hrZonesTotal > 0 && (
                <div className="bg-white/[0.02] rounded-lg p-3 border border-white/[0.04] mb-2">
                  <HRZonesBar zones={week.hrZones} totalMinutes={week.hrZonesTotal} label="Weekly HR Zones" />
                </div>
              )}
              
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

function parseComments(rawComments) {
  if (!rawComments || !rawComments.trim()) return []
  
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
  
  if (comments.length === 0 && rawComments.trim()) {
    return [{
      date: null,
      author: null,
      text: rawComments.replace(/\*/g, '').trim()
    }]
  }
  
  return comments
}

function CommentCard({ comment, index }) {
  const isCoach = comment.author && comment.author.toLowerCase().includes('daniel')
  
  return (
    <div
      className={`rounded-xl p-3 ${isCoach ? 'bg-white/[0.03] border border-white/[0.06]' : 'bg-white/[0.02] border border-white/[0.04]'}`}
      dir="rtl"
    >
      {comment.author && (
        <div className="flex items-center gap-2 mb-2">
          <span className="text-sm">{isCoach ? '🎯' : '🏃'}</span>
          <span className={`text-[11px] font-medium ${isCoach ? 'text-white/60' : 'text-white/50'}`}>
            {comment.author}
          </span>
          {comment.date && (
            <span className="text-white/20 text-[10px]">{comment.date}</span>
          )}
        </div>
      )}
      <p className="text-white/40 text-xs leading-relaxed whitespace-pre-wrap text-right">
        {comment.text}
      </p>
    </div>
  )
}

function WorkoutRow({ workout, index, colors }) {
  const [showComments, setShowComments] = useState(false)
  const workoutDate = new Date(workout.WorkoutDay)
  const formattedDate = formatWorkoutDate(workoutDate)
  
  const rawComments = workout.AthleteComments || ''
  const parsedComments = parseComments(rawComments)
  const hasComments = parsedComments.length > 0
  const commentCount = parsedComments.length
  
  const hasHRZones = workout.hrZonesTotal > 0
  const hasDetails = hasComments || hasHRZones
  
  return (
    <div className="bg-white/[0.02] rounded-xl p-3 border border-white/[0.04]">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <span className="text-white/25 text-[11px] font-medium">{formattedDate}</span>
          <p className="text-white/80 text-sm font-medium truncate mt-0.5">
            {workout.Title || workout.WorkoutType || 'Run'}
          </p>
          
          {hasDetails && (
            <button
              onClick={() => setShowComments(!showComments)}
              className="flex items-center gap-1 mt-2 text-white/25 hover:text-white/40 transition-colors text-[11px] font-medium"
            >
              <span>
                {showComments ? 'Hide' : 'Show'} details
                {hasComments && ` (${commentCount})`}
              </span>
              <motion.span
                animate={{ rotate: showComments ? 180 : 0 }}
                transition={{ duration: 0.15 }}
                className="text-[9px]"
              >
                ▼
              </motion.span>
            </button>
          )}
        </div>
        
        <div className="text-right shrink-0">
          <p className="text-white font-semibold text-sm">{workout.distanceKm} km</p>
          <p className="text-white/25 text-[11px]">{workout.paceFormatted} /km</p>
          {workout.hr && (
            <p className="text-[#FF453A]/50 text-[11px]">❤️ {Math.round(workout.hr)}</p>
          )}
        </div>
      </div>
      
      <AnimatePresence>
        {showComments && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mt-3 pt-3 border-t border-white/[0.04] space-y-2.5">
              {workout.hrZonesTotal > 0 && (
                <HRZonesPie zones={workout.hrZones} totalMinutes={workout.hrZonesTotal} cadence={workout.cadence} rpe={workout.rpe} />
              )}
              
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
    </div>
  )
}

export default WeekCard
