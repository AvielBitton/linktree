'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { formatPace, formatWorkoutDate } from '../utils/workouts'
import {
  isWorkoutCompleted,
  getTypeColor,
  calcStructureDistance,
  estimateDistance,
  formatPlannedDuration,
} from '../utils/dashboard'

function getNextWorkout(workouts) {
  const now = new Date()
  now.setHours(0, 0, 0, 0)

  const upcoming = workouts
    .filter(w => {
      if (!w.date) return false
      const wDate = new Date(w.date)
      wDate.setHours(0, 0, 0, 0)
      if (wDate < now) return false
      if (isWorkoutCompleted(w)) return false
      const title = (w.Title || '').toLowerCase()
      if (/\|\s*week/i.test(title)) return false
      if (/^(race week|off season)$/i.test(title)) return false
      if (/^transition\s/i.test(title)) return false
      if (/^build\s.*week\s/i.test(title)) return false
      const type = (w.WorkoutType || '').toLowerCase()
      if (type === 'day off' || type === 'rest') return false
      return true
    })
    .sort((a, b) => a.date - b.date)

  return upcoming[0] || null
}

function getUpcomingCount(workouts) {
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const weekEnd = new Date(now)
  weekEnd.setDate(weekEnd.getDate() + 7)
  
  return workouts.filter(w => {
    if (!w.date) return false
    const wDate = new Date(w.date)
    wDate.setHours(0, 0, 0, 0)
    if (wDate < now || wDate > weekEnd) return false
    if (isWorkoutCompleted(w)) return false
    const type = (w.WorkoutType || '').toLowerCase()
    if (type === 'day off' || type === 'rest') return false
    const title = (w.Title || '').toLowerCase()
    if (/\|\s*week/i.test(title)) return false
    return true
  }).length
}

function Countdown({ targetDate }) {
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  const diff = targetDate - now
  if (diff <= 0) return null

  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24)
  const minutes = Math.floor((diff / (1000 * 60)) % 60)
  const seconds = Math.floor((diff / 1000) % 60)

  return (
    <div className="flex items-center gap-2">
      {days > 0 && (
        <div className="text-center">
          <motion.span
            key={days}
            initial={{ y: -8, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="block text-white font-bold text-lg tabular-nums"
          >
            {days}
          </motion.span>
          <span className="text-white/20 text-[9px] uppercase tracking-wider">days</span>
        </div>
      )}
      {days > 0 && <span className="text-white/10 text-lg font-light">:</span>}
      <div className="text-center">
        <motion.span
          key={hours}
          initial={{ y: -8, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="block text-white font-bold text-lg tabular-nums"
        >
          {String(hours).padStart(2, '0')}
        </motion.span>
        <span className="text-white/20 text-[9px] uppercase tracking-wider">hrs</span>
      </div>
      <span className="text-white/10 text-lg font-light">:</span>
      <div className="text-center">
        <motion.span
          key={minutes}
          initial={{ y: -8, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="block text-white font-bold text-lg tabular-nums"
        >
          {String(minutes).padStart(2, '0')}
        </motion.span>
        <span className="text-white/20 text-[9px] uppercase tracking-wider">min</span>
      </div>
      <span className="text-white/10 text-lg font-light">:</span>
      <div className="text-center">
        <motion.span
          key={seconds}
          initial={{ y: -8, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="block text-white font-bold text-lg tabular-nums"
        >
          {String(seconds).padStart(2, '0')}
        </motion.span>
        <span className="text-white/20 text-[9px] uppercase tracking-wider">sec</span>
      </div>
    </div>
  )
}

function IntensityArc({ structure, color, thresholdSpeed }) {
  if (!structure || !structure.blocks || structure.blocks.length === 0) return null

  const allSteps = []
  structure.blocks.forEach(b => {
    if (b.type === 'repeat') {
      for (let r = 0; r < (b.reps || 1); r++) {
        b.steps.forEach(s => allSteps.push(s))
      }
    } else {
      allSteps.push(b)
    }
  })

  const totalDur = allSteps.reduce((sum, s) => sum + (s.value || 0), 0) || 1
  const size = 220
  const strokeWidth = 18
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius

  let accumulated = 0
  const arcs = allSteps.map((step, i) => {
    const fraction = (step.value || 0) / totalDur
    const startAngle = (accumulated / totalDur) * 360 - 90
    accumulated += (step.value || 0)

    const isWarmCool = step.intensityClass === 'warmUp' || step.intensityClass === 'coolDown'
    const isRest = step.intensityClass === 'rest'

    let segColor = color
    let opacity = 0.9
    if (isWarmCool) { segColor = '#60A5FA'; opacity = 0.5 }
    else if (isRest) { opacity = 0.3 }

    const dashLength = fraction * circumference
    const gapLength = circumference - dashLength
    const rotation = (accumulated - (step.value || 0)) / totalDur * 360 - 90

    return (
      <circle
        key={i}
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={segColor}
        strokeWidth={strokeWidth}
        strokeDasharray={`${dashLength} ${gapLength}`}
        strokeDashoffset={0}
        strokeLinecap="round"
        opacity={opacity}
        transform={`rotate(${rotation} ${size / 2} ${size / 2})`}
        className="transition-all duration-500"
      />
    )
  })

  const maxIntensity = Math.max(
    ...allSteps
      .filter(s => s.intensityClass === 'active')
      .map(s => s.targetMax || s.targetMin || 0),
    0
  )

  const avgIntensity = (() => {
    const activeSteps = allSteps.filter(s => s.intensityClass === 'active')
    if (activeSteps.length === 0) return 0
    const totalWeight = activeSteps.reduce((sum, s) => sum + (s.value || 0), 0)
    if (totalWeight === 0) return 0
    return activeSteps.reduce((sum, s) => {
      const avg = s.targetMax ? (s.targetMin + s.targetMax) / 2 : (s.targetMin || 0)
      return sum + avg * (s.value || 0)
    }, 0) / totalWeight
  })()

  return (
    <motion.div
      className="relative flex items-center justify-center"
      initial={{ opacity: 0, scale: 0.8, rotate: -30 }}
      animate={{ opacity: 1, scale: 1, rotate: 0 }}
      transition={{ duration: 0.8, ease: 'easeOut' }}
    >
      <svg width={size} height={size} className="drop-shadow-lg">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="white"
          strokeWidth={strokeWidth}
          opacity={0.03}
        />
        {arcs}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-center"
        >
          <span className="text-white/20 text-[9px] uppercase tracking-widest font-semibold">Intensity</span>
          <p className="text-white font-bold text-3xl tracking-tight" style={{ color }}>
            {Math.round(avgIntensity)}
            <span className="text-white/30 text-sm">%</span>
          </p>
          {maxIntensity > 0 && (
            <p className="text-white/20 text-[10px]">
              peak {Math.round(maxIntensity)}%
            </p>
          )}
        </motion.div>
      </div>
    </motion.div>
  )
}

function StructureBlocks({ structure, color, thresholdSpeed }) {
  if (!structure || !structure.blocks || structure.blocks.length === 0) return null

  function pctToPace(pct) {
    if (!thresholdSpeed || !pct) return null
    const speed = thresholdSpeed * (pct / 100)
    const paceMin = 1000 / speed / 60
    const m = Math.floor(paceMin)
    const s = Math.round((paceMin - m) * 60)
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  function formatDur(value, unit) {
    if (unit === 'second') {
      if (value >= 3600) { const h = Math.floor(value / 3600); const m = Math.round((value % 3600) / 60); return m > 0 ? `${h}h${m}m` : `${h}h` }
      if (value >= 60) { const m = Math.floor(value / 60); const s = value % 60; return s > 0 ? `${m}:${s.toString().padStart(2, '0')}` : `${m}min` }
      return `${value}s`
    }
    if (unit === 'meter') return value >= 1000 ? `${(value / 1000).toFixed(value % 1000 === 0 ? 0 : 1)}km` : `${value}m`
    return `${value}`
  }

  function targetLabel(targetMin, targetMax, metric) {
    if (targetMin == null) return ''
    if (metric === 'percentOfThresholdPace' && thresholdSpeed) {
      const pMax = pctToPace(targetMin)
      const pMin = targetMax ? pctToPace(targetMax) : null
      if (pMin && pMax) return pMin === pMax ? `${pMin} /km` : `${pMin}–${pMax} /km`
      if (pMax) return `${pMax} /km`
    }
    if (targetMax != null && targetMax !== targetMin) return `${targetMin}–${targetMax}%`
    return `${targetMin}%`
  }

  const intensityToHeight = (step) => {
    const avg = step.targetMax ? (step.targetMin + step.targetMax) / 2 : (step.targetMin || 70)
    return Math.max(20, Math.min(100, ((avg - 50) / 70) * 100))
  }

  const allSteps = []
  structure.blocks.forEach(b => {
    if (b.type === 'repeat') {
      for (let r = 0; r < (b.reps || 1); r++) {
        b.steps.forEach(s => allSteps.push({ ...s, isRepeat: true, reps: b.reps }))
      }
    } else {
      allSteps.push(b)
    }
  })

  const totalDur = allSteps.reduce((sum, s) => sum + (s.value || 0), 0) || 1

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.5 }}
    >
      <p className="text-white/25 text-[10px] uppercase tracking-wider mb-2 font-semibold">Workout Structure</p>

      {/* Visual bar chart */}
      <div className="flex items-end gap-px h-24 mb-3 px-1">
        {allSteps.map((step, i) => {
          const isWarmCool = step.intensityClass === 'warmUp' || step.intensityClass === 'coolDown'
          const isRest = step.intensityClass === 'rest'
          const height = intensityToHeight(step)
          const width = Math.max(3, ((step.value || 0) / totalDur) * 100)

          let barColor = color
          if (isWarmCool) barColor = '#60A5FA'
          let barOpacity = isRest ? 0.25 : isWarmCool ? 0.5 : 0.85

          return (
            <motion.div
              key={i}
              className="rounded-t-sm relative group"
              style={{
                width: `${width}%`,
                height: `${height}%`,
                backgroundColor: barColor,
                opacity: barOpacity,
              }}
              initial={{ height: 0 }}
              animate={{ height: `${height}%` }}
              transition={{ delay: 0.4 + i * 0.05, duration: 0.4, ease: 'easeOut' }}
            >
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                <div className="bg-black/90 backdrop-blur-sm rounded px-2 py-1 text-[9px] text-white whitespace-nowrap">
                  {step.name} · {formatDur(step.value, step.unit)}
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Detailed blocks */}
      <div className="bg-white/[0.03] rounded-xl overflow-hidden divide-y divide-white/[0.04]">
        {structure.blocks.map((block, i) => {
          if (block.type === 'repeat') {
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + i * 0.08 }}
              >
                <div className="px-3 py-2 flex items-center gap-2 bg-white/[0.02]">
                  <div className="w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold" style={{ backgroundColor: color + '20', color }}>
                    {block.reps}x
                  </div>
                  <span className="text-white/40 text-[11px] font-semibold uppercase tracking-wide">Repeat</span>
                </div>
                <div className="pl-4">
                  {block.steps.map((step, j) => (
                    <StepRow key={`${i}-${j}`} step={step} metric={structure.metric} color={color} formatDur={formatDur} targetLabel={targetLabel} />
                  ))}
                </div>
              </motion.div>
            )
          }
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 + i * 0.08 }}
            >
              <StepRow step={block} metric={structure.metric} color={color} formatDur={formatDur} targetLabel={targetLabel} />
            </motion.div>
          )
        })}
      </div>
    </motion.div>
  )
}

function StepRow({ step, metric, color, formatDur, targetLabel }) {
  const isWarmCool = step.intensityClass === 'warmUp' || step.intensityClass === 'coolDown'
  const isRest = step.intensityClass === 'rest'

  return (
    <div className={`flex items-center gap-2.5 px-3 py-2 ${isWarmCool || isRest ? 'opacity-60' : ''}`}>
      <div
        className="w-1.5 h-6 rounded-full flex-shrink-0"
        style={{
          backgroundColor: isWarmCool ? '#60A5FA' : color,
          opacity: isRest ? 0.3 : isWarmCool ? 0.5 : 0.9,
        }}
      />
      <span className="text-white/70 text-xs font-medium truncate flex-1">{step.name}</span>
      <span className="text-white/30 text-[11px] font-mono flex-shrink-0 tabular-nums">
        {formatDur(step.value, step.unit)}
      </span>
      {step.targetMin != null && (
        <span
          className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md flex-shrink-0"
          style={{ backgroundColor: color + '15', color }}
        >
          {targetLabel(step.targetMin, step.targetMax, metric)}
        </span>
      )}
    </div>
  )
}

function PaceZonesChart({ structure, thresholdSpeed, color }) {
  if (!structure || !thresholdSpeed || structure.metric === 'rpe') return null

  const allSteps = []
  structure.blocks.forEach(b => {
    if (b.type === 'repeat') {
      for (let r = 0; r < (b.reps || 1); r++) b.steps.forEach(s => allSteps.push(s))
    } else allSteps.push(b)
  })

  const activeSteps = allSteps.filter(s => s.intensityClass === 'active' && s.targetMin)
  if (activeSteps.length === 0) return null

  const zones = {}
  activeSteps.forEach(s => {
    const avg = s.targetMax ? Math.round((s.targetMin + s.targetMax) / 2) : s.targetMin
    const speed = thresholdSpeed * (avg / 100)
    const paceMin = 1000 / speed / 60
    const m = Math.floor(paceMin)
    const sec = Math.round((paceMin - m) * 60)
    const paceStr = `${m}:${sec.toString().padStart(2, '0')}`

    const key = `${s.targetMin}-${s.targetMax || s.targetMin}`
    if (!zones[key]) {
      zones[key] = { pace: paceStr, pct: `${s.targetMin}${s.targetMax ? `–${s.targetMax}` : ''}%`, duration: 0, targetMin: s.targetMin }
    }
    zones[key].duration += (s.value || 0)
  })

  const sorted = Object.values(zones).sort((a, b) => a.targetMin - b.targetMin)
  const maxDur = Math.max(...sorted.map(z => z.duration))

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6, duration: 0.5 }}
    >
      <p className="text-white/25 text-[10px] uppercase tracking-wider mb-2 font-semibold">Pace Targets</p>
      <div className="space-y-2">
        {sorted.map((zone, i) => (
          <motion.div
            key={i}
            className="flex items-center gap-3"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.7 + i * 0.1 }}
          >
            <div className="w-14 text-right">
              <span className="text-white font-bold text-sm tabular-nums">{zone.pace}</span>
            </div>
            <div className="flex-1 h-6 bg-white/[0.03] rounded-lg overflow-hidden relative">
              <motion.div
                className="h-full rounded-lg"
                style={{ backgroundColor: color }}
                initial={{ width: 0 }}
                animate={{ width: `${(zone.duration / maxDur) * 100}%` }}
                transition={{ delay: 0.8 + i * 0.1, duration: 0.6, ease: 'easeOut' }}
              />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-white/30 text-[10px] font-medium">
                {zone.pct}
              </span>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}

function StrengthView({ workout }) {
  const title = (workout.Title || '').toLowerCase()
  let bodyPart = 'full'
  let icon = '🎯'
  if (title.includes('upper') || title.includes('push')) { bodyPart = 'upper'; icon = '💪' }
  else if (title.includes('lower') || title.includes('leg')) { bodyPart = 'lower'; icon = '🦿' }
  else if (title.includes('full')) { bodyPart = 'full'; icon = '🎯' }

  const gradients = {
    upper: 'from-lime-500/20 via-emerald-500/10 to-transparent',
    lower: 'from-green-500/20 via-teal-500/10 to-transparent',
    full: 'from-lime-400/20 via-lime-600/10 to-transparent',
  }

  return (
    <motion.div
      className={`relative rounded-2xl border border-white/[0.08] overflow-hidden bg-gradient-to-br ${gradients[bodyPart]}`}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(132,204,22,0.08)_0%,transparent_60%)]" />
      <div className="relative p-6 text-center">
        <motion.div
          className="text-6xl mb-4"
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
        >
          {icon}
        </motion.div>
        <h3 className="text-strength font-bold text-lg mb-1 capitalize">{bodyPart} Body</h3>
        <p className="text-white/30 text-xs">Strength Training Session</p>
      </div>
    </motion.div>
  )
}

function TimeBreakdown({ structure, color }) {
  if (!structure || !structure.blocks || structure.blocks.length === 0) return null

  const categories = { warmUp: 0, active: 0, rest: 0, coolDown: 0 }

  const processStep = (step, reps = 1) => {
    const dur = (step.value || 0) * reps
    const cls = step.intensityClass || 'active'
    if (cls === 'warmUp') categories.warmUp += dur
    else if (cls === 'coolDown') categories.coolDown += dur
    else if (cls === 'rest') categories.rest += dur
    else categories.active += dur
  }

  structure.blocks.forEach(b => {
    if (b.type === 'repeat') {
      b.steps.forEach(s => processStep(s, b.reps || 1))
    } else {
      processStep(b)
    }
  })

  const total = categories.warmUp + categories.active + categories.rest + categories.coolDown
  if (total === 0) return null

  const fmtMin = (s) => {
    if (s >= 3600) { const h = Math.floor(s / 3600); const m = Math.round((s % 3600) / 60); return m > 0 ? `${h}h${m}m` : `${h}h` }
    return `${Math.round(s / 60)}m`
  }

  const segments = [
    { key: 'warmUp', label: 'Warm-up', seconds: categories.warmUp, barColor: '#60A5FA', opacity: 0.6 },
    { key: 'active', label: 'Active', seconds: categories.active, barColor: color, opacity: 0.9 },
    { key: 'rest', label: 'Rest', seconds: categories.rest, barColor: color, opacity: 0.25 },
    { key: 'coolDown', label: 'Cool-down', seconds: categories.coolDown, barColor: '#60A5FA', opacity: 0.4 },
  ].filter(s => s.seconds > 0)

  return (
    <motion.div
      className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
    >
      <p className="text-white/25 text-[10px] uppercase tracking-wider mb-3 font-semibold">Time Breakdown</p>
      <div className="flex h-3 rounded-full overflow-hidden gap-0.5 mb-3">
        {segments.map((seg, i) => (
          <motion.div
            key={seg.key}
            className="rounded-full"
            style={{ backgroundColor: seg.barColor, opacity: seg.opacity }}
            initial={{ width: 0 }}
            animate={{ width: `${(seg.seconds / total) * 100}%` }}
            transition={{ delay: 0.5 + i * 0.1, duration: 0.5, ease: 'easeOut' }}
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        {segments.map(seg => (
          <div key={seg.key} className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: seg.barColor, opacity: seg.opacity }} />
            <span className="text-white/30 text-[10px]">{seg.label}</span>
            <span className="text-white/60 text-[10px] font-semibold">{fmtMin(seg.seconds)}</span>
          </div>
        ))}
      </div>
      <div className="mt-2 text-right">
        <span className="text-white/15 text-[9px]">Total: {fmtMin(total)}</span>
      </div>
    </motion.div>
  )
}

function findSimilarWorkout(targetWorkout, allWorkouts) {
  const targetTitle = (targetWorkout.Title || '').toLowerCase()
  const targetDate = targetWorkout.date

  const keywords = ['long run', 'vo2max', 'vo2', 'threshold', 'recovery', 'tempo', 'interval', 'cruise', 'aerobic', 'z2', 'mp', 'jog', 'activation', 'strides', 'half marathon', 'marathon', 'cp test', 'test', 'hill', 'pyramid', 'lsd', 'long slow']
  const matchedKeyword = keywords.find(kw => targetTitle.includes(kw))

  return allWorkouts
    .filter(w => {
      if (!w.date || w.date >= targetDate) return false
      const dist = parseFloat(w.DistanceInMeters) || 0
      const dur = parseFloat(w.TimeTotalInHours) || 0
      if (dist === 0 && dur === 0) return false
      const type = (w.WorkoutType || '').toLowerCase()
      if (type !== (targetWorkout.WorkoutType || '').toLowerCase()) return false
      if (matchedKeyword) {
        return (w.Title || '').toLowerCase().includes(matchedKeyword)
      }
      return false
    })
    .sort((a, b) => b.date - a.date)[0] || null
}

function LastSimilarWorkout({ workout, allWorkouts, color }) {
  const similar = useMemo(() => findSimilarWorkout(workout, allWorkouts), [workout, allWorkouts])
  if (!similar) return null

  const dist = parseFloat(similar.DistanceInMeters) || 0
  const distKm = dist > 0 ? `${Math.round(dist / 100) / 10} km` : null
  const velocity = parseFloat(similar.VelocityAverage) || 0
  const pace = velocity > 0 ? (1000 / velocity) / 60 : null
  const paceStr = pace ? formatPace(pace) : null
  const hr = parseFloat(similar.HeartRateAverage) || null
  const dur = parseFloat(similar.TimeTotalInHours) || 0

  const fmtDur = (h) => {
    if (h <= 0) return null
    const hrs = Math.floor(h)
    const m = Math.round((h - hrs) * 60)
    if (hrs > 0 && m > 0) return `${hrs}h ${m}m`
    if (hrs > 0) return `${hrs}h`
    return `${m}m`
  }

  return (
    <motion.div
      className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
    >
      <div className="flex items-center gap-2 mb-3">
        <span className="text-sm">🔁</span>
        <p className="text-white/25 text-[10px] uppercase tracking-wider font-semibold">Last Similar Session</p>
      </div>

      <div className="flex items-center gap-2 mb-2.5">
        <span className="text-white/50 text-xs font-medium">{similar.Title}</span>
        <span className="text-white/20 text-[10px]">{formatWorkoutDate(similar.date)}</span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {distKm && (
          <div className="bg-white/[0.04] rounded-lg p-2 text-center">
            <p className="text-white font-bold text-sm">{distKm}</p>
            <p className="text-white/25 text-[9px]">Distance</p>
          </div>
        )}
        {paceStr && (
          <div className="bg-white/[0.04] rounded-lg p-2 text-center">
            <p className="text-white font-bold text-sm">{paceStr}<span className="text-white/20 text-[9px] ml-0.5">/km</span></p>
            <p className="text-white/25 text-[9px]">Avg Pace</p>
          </div>
        )}
        {hr && (
          <div className="bg-white/[0.04] rounded-lg p-2 text-center">
            <p className="text-white font-bold text-sm">{Math.round(hr)}<span className="text-white/20 text-[9px] ml-0.5">bpm</span></p>
            <p className="text-white/25 text-[9px]">Avg HR</p>
          </div>
        )}
        {dur > 0 && (
          <div className="bg-white/[0.04] rounded-lg p-2 text-center">
            <p className="text-white font-bold text-sm">{fmtDur(dur)}</p>
            <p className="text-white/25 text-[9px]">Duration</p>
          </div>
        )}
      </div>
    </motion.div>
  )
}

function WeekContext({ workout, allWorkouts, color }) {
  const weekData = useMemo(() => {
    if (!workout || !workout.date) return null
    const d = new Date(workout.date)
    d.setHours(0, 0, 0, 0)
    const sunday = new Date(d)
    sunday.setDate(d.getDate() - d.getDay())
    const saturday = new Date(sunday)
    saturday.setDate(sunday.getDate() + 6)
    saturday.setHours(23, 59, 59, 999)

    const weekWorkouts = allWorkouts.filter(w => {
      if (!w.date) return false
      const title = (w.Title || '').toLowerCase()
      if (/\|\s*week/i.test(title)) return false
      if (/^(race week|off season)$/i.test(title)) return false
      const type = (w.WorkoutType || '').toLowerCase()
      if (type === 'day off' || type === 'rest') return false
      return w.date >= sunday && w.date <= saturday
    })

    const completed = weekWorkouts.filter(w => {
      const dist = parseFloat(w.DistanceInMeters) || 0
      const dur = parseFloat(w.TimeTotalInHours) || 0
      return dist > 0 || dur > 0
    })

    const runWorkouts = weekWorkouts.filter(w => (w.WorkoutType || '').toLowerCase() === 'run')
    const completedRuns = runWorkouts.filter(w => (parseFloat(w.DistanceInMeters) || 0) > 0)
    const actualKm = completedRuns.reduce((s, w) => s + ((parseFloat(w.DistanceInMeters) || 0) / 1000), 0)

    let plannedKm = 0
    for (const w of runWorkouts) {
      const pd = parseFloat(w.PlannedDistanceInMeters) || 0
      if (pd > 0) { plannedKm += pd / 1000; continue }
      const dur = parseFloat(w.PlannedDuration) || 0
      const est = estimateDistance(dur)
      if (est) plannedKm += est
    }

    return {
      total: weekWorkouts.length,
      done: completed.length,
      actualKm: Math.round(actualKm * 10) / 10,
      plannedKm: Math.round(plannedKm * 10) / 10,
    }
  }, [workout, allWorkouts])

  if (!weekData || weekData.total === 0) return null

  const workoutPct = weekData.total > 0 ? Math.min(100, (weekData.done / weekData.total) * 100) : 0
  const kmPct = weekData.plannedKm > 0 ? Math.min(100, (weekData.actualKm / weekData.plannedKm) * 100) : 0

  return (
    <motion.div
      className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6 }}
    >
      <p className="text-white/25 text-[10px] uppercase tracking-wider mb-3 font-semibold">This Week</p>

      <div className="space-y-3">
        {/* Workouts progress */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-white/40 text-[10px]">Workouts</span>
            <span className="text-white/60 text-[11px] font-semibold tabular-nums">{weekData.done}<span className="text-white/20">/{weekData.total}</span></span>
          </div>
          <div className="h-1.5 bg-white/[0.04] rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: color }}
              initial={{ width: 0 }}
              animate={{ width: `${workoutPct}%` }}
              transition={{ delay: 0.7, duration: 0.6, ease: 'easeOut' }}
            />
          </div>
        </div>

        {/* Km progress */}
        {weekData.plannedKm > 0 && (
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-white/40 text-[10px]">Running km</span>
              <span className="text-white/60 text-[11px] font-semibold tabular-nums">{weekData.actualKm}<span className="text-white/20">/{weekData.plannedKm} km</span></span>
            </div>
            <div className="h-1.5 bg-white/[0.04] rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: color }}
                initial={{ width: 0 }}
                animate={{ width: `${kmPct}%` }}
                transition={{ delay: 0.8, duration: 0.6, ease: 'easeOut' }}
              />
            </div>
          </div>
        )}
      </div>
    </motion.div>
  )
}

const motivationalQuotes = [
  { text: "The only bad workout is the one that didn't happen.", emoji: "🔥" },
  { text: "Your body can stand almost anything. It's your mind you have to convince.", emoji: "🧠" },
  { text: "Every rep counts. Every step matters.", emoji: "💪" },
  { text: "Pain is temporary. Results are forever.", emoji: "⚡" },
  { text: "You don't have to be great to start, but you have to start to be great.", emoji: "🚀" },
  { text: "Discipline is choosing between what you want now and what you want most.", emoji: "🎯" },
  { text: "The harder the battle, the sweeter the victory.", emoji: "🏆" },
  { text: "Run the mile you're in.", emoji: "👟" },
  { text: "Suffer now and live the rest of your life as a champion.", emoji: "🥇" },
  { text: "The body achieves what the mind believes.", emoji: "✨" },
  { text: "Don't stop when you're tired. Stop when you're done.", emoji: "🛑" },
  { text: "Success isn't given. It's earned. On the track, on the field, in the gym.", emoji: "🏟️" },
  { text: "Your only limit is you.", emoji: "🪞" },
  { text: "Champions train. Losers complain.", emoji: "👑" },
  { text: "It never gets easier. You just get stronger.", emoji: "📈" },
  { text: "Sweat is just fat crying.", emoji: "💧" },
  { text: "No shortcuts. Just hard work.", emoji: "🔨" },
  { text: "Be stronger than your excuses.", emoji: "🦾" },
  { text: "Embrace the suck.", emoji: "😤" },
  { text: "If it doesn't challenge you, it won't change you.", emoji: "🔄" },
  { text: "Today's pain is tomorrow's power.", emoji: "⚡" },
  { text: "One more rep. One more step. One more mile.", emoji: "🏃" },
  { text: "Obsessed is a word the lazy use to describe the dedicated.", emoji: "🎯" },
  { text: "You're not tired. You're uninspired.", emoji: "💡" },
  { text: "Great things never come from comfort zones.", emoji: "🌋" },
  { text: "Fall seven times. Stand up eight.", emoji: "🗻" },
  { text: "The pain you feel today will be the strength you feel tomorrow.", emoji: "🌅" },
  { text: "Don't wish for it. Work for it.", emoji: "⛏️" },
  { text: "Train insane or remain the same.", emoji: "🔁" },
  { text: "When you feel like quitting, think about why you started.", emoji: "💭" },
  { text: "Make yourself proud.", emoji: "🫡" },
  { text: "Hustle for that muscle.", emoji: "💪" },
  { text: "What seems impossible today will one day be your warm-up.", emoji: "🧘" },
  { text: "Sore today. Strong tomorrow.", emoji: "💥" },
  { text: "The clock is ticking. Make every second count.", emoji: "⏱️" },
  { text: "Excuses don't burn calories.", emoji: "🔥" },
  { text: "You're one workout away from a good mood.", emoji: "😊" },
  { text: "Strive for progress, not perfection.", emoji: "📊" },
  { text: "The best project you'll ever work on is you.", emoji: "🏗️" },
  { text: "Consistency is what transforms average into excellence.", emoji: "🔑" },
  { text: "Your future self will thank you.", emoji: "🙏" },
  { text: "Legends aren't born. They're built.", emoji: "🏛️" },
  { text: "The difference between try and triumph is a little umph.", emoji: "💫" },
  { text: "Push yourself because no one else is going to do it for you.", emoji: "🫵" },
  { text: "The only way to finish is to start.", emoji: "🏁" },
  { text: "Wake up. Work out. Look hot. Kick ass.", emoji: "😎" },
  { text: "Strong people are harder to kill.", emoji: "🛡️" },
  { text: "Mind over matter. If you don't mind, it doesn't matter.", emoji: "🧠" },
  { text: "Nothing worth having comes easy.", emoji: "💎" },
  { text: "Believe in yourself and all that you are.", emoji: "⭐" },
]

function NextWorkoutTab({ workouts = [] }) {
  const workout = useMemo(() => getNextWorkout(workouts), [workouts])
  const upcomingCount = useMemo(() => getUpcomingCount(workouts), [workouts])
  const [quote] = useState(() => motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)])

  if (!workout) {
    return (
      <motion.div
        className="text-center py-16"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="text-5xl mb-4">🏖️</div>
        <h2 className="text-white font-bold text-xl mb-2">No Upcoming Workouts</h2>
        <p className="text-white/30 text-sm">Enjoy your rest! You've earned it.</p>
      </motion.div>
    )
  }

  const isRun = (workout.WorkoutType || '').toLowerCase() === 'run'
  const isStrength = (workout.WorkoutType || '').toLowerCase().includes('strength')
  const color = getTypeColor(workout.WorkoutType)
  const structure = workout.structure || null
  const thresholdSpeed = workout.thresholdSpeed || null

  const isToday = new Date().toDateString() === workout.date.toDateString()
  const isTomorrow = (() => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    return tomorrow.toDateString() === workout.date.toDateString()
  })()

  const plannedDist = parseFloat(workout.PlannedDistanceInMeters) || 0
  const structDist = calcStructureDistance(structure, thresholdSpeed)
  const plannedDuration = parseFloat(workout.PlannedDuration) || 0
  const estDist = estimateDistance(plannedDuration)

  const distDisplay = plannedDist > 0
    ? `${Math.round(plannedDist / 100) / 10}`
    : structDist
      ? `~${structDist}`
      : isRun && estDist
        ? `~${estDist}`
        : null

  const durationDisplay = plannedDuration > 0 ? formatPlannedDuration(plannedDuration) : null

  const tssPlanned = workout.tssPlanned || null
  const ifPlanned = workout.ifPlanned || null

  const description = workout.WorkoutDescription || ''
  const coachComments = workout.CoachComments || ''

  const startTime = workout.startTime ? new Date(workout.startTime) : null
  const hasValidStartTime = startTime && startTime > new Date()

  const runGradient = 'from-amber-500/15 via-orange-500/5 to-transparent'
  const strengthGradient = 'from-lime-500/15 via-green-500/5 to-transparent'
  const otherGradient = 'from-violet-500/15 via-purple-500/5 to-transparent'

  const gradient = isRun ? runGradient : isStrength ? strengthGradient : otherGradient

  return (
    <div className="space-y-4">
      {/* Hero Card */}
      <motion.div
        className={`relative rounded-2xl border border-white/[0.08] overflow-hidden bg-gradient-to-br ${gradient}`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* Glow effect */}
        <div
          className="absolute top-0 right-0 w-40 h-40 rounded-full blur-3xl opacity-20"
          style={{ backgroundColor: color }}
        />

        <div className="relative px-5 pt-5 pb-4">
          {/* Date + Title */}
          <div className="flex gap-3.5 mb-2">
            {/* Calendar block */}
            <div
              className="flex-shrink-0 w-14 h-14 rounded-xl flex flex-col items-center justify-center border"
              style={{ backgroundColor: color + '10', borderColor: color + '25' }}
            >
              <span className="text-white/40 text-[9px] font-bold uppercase tracking-wider leading-none">
                {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][workout.date.getMonth()]}
              </span>
              <span className="text-white font-bold text-xl leading-none mt-0.5">
                {workout.date.getDate()}
              </span>
              <span className="text-white/25 text-[8px] font-semibold uppercase leading-none mt-0.5">
                {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][workout.date.getDay()]}
              </span>
            </div>

            {/* Title + meta */}
            <div className="flex-1 min-w-0 flex flex-col justify-center">
              <div className="flex items-center gap-2 mb-1">
                {isToday && (
                  <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color }}>Today</span>
                )}
                {isTomorrow && (
                  <span className="text-white/40 text-[9px] font-bold uppercase tracking-wider">Tomorrow</span>
                )}
                <span
                  className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full"
                  style={{ backgroundColor: color + '20', color }}
                >
                  {workout.WorkoutType}
                </span>
                {upcomingCount > 1 && (
                  <span className="text-white/15 text-[9px] font-medium">
                    +{upcomingCount - 1} more
                  </span>
                )}
              </div>
              <motion.h2
                className="text-white font-bold text-lg tracking-tight leading-tight truncate"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 }}
              >
                {workout.Title}
              </motion.h2>
            </div>
          </div>

          {/* Countdown */}
          {hasValidStartTime && (
            <motion.div
              className="mb-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.25 }}
            >
              <p className="text-white/20 text-[9px] uppercase tracking-wider mb-1 font-semibold">Starts In</p>
              <Countdown targetDate={startTime} />
            </motion.div>
          )}

          {/* Stats Grid */}
          {(distDisplay || durationDisplay || tssPlanned || ifPlanned) && (
            <motion.div
              className="grid grid-cols-2 gap-2 mt-3"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              {distDisplay && (
                <div className="bg-white/[0.05] backdrop-blur-sm rounded-xl p-3 text-center border border-white/[0.04]">
                  <p className="text-white font-bold text-2xl tracking-tight">
                    {distDisplay}
                    <span className="text-white/25 text-sm ml-0.5 font-normal">km</span>
                  </p>
                  <p className="text-white/25 text-[10px] font-medium mt-0.5">Distance</p>
                </div>
              )}
              {durationDisplay && (
                <div className="bg-white/[0.05] backdrop-blur-sm rounded-xl p-3 text-center border border-white/[0.04]">
                  <p className="text-white font-bold text-2xl tracking-tight">{durationDisplay}</p>
                  <p className="text-white/25 text-[10px] font-medium mt-0.5">Duration</p>
                </div>
              )}
              {tssPlanned && (
                <div className="bg-white/[0.05] backdrop-blur-sm rounded-xl p-3 text-center border border-white/[0.04]">
                  <p className="text-white font-bold text-2xl tracking-tight">{Math.round(tssPlanned)}</p>
                  <p className="text-white/25 text-[10px] font-medium mt-0.5">TSS Target</p>
                  <p className="text-white/[0.12] text-[8px] mt-0.5">Training load score</p>
                </div>
              )}
              {ifPlanned && (
                <div className="bg-white/[0.05] backdrop-blur-sm rounded-xl p-3 text-center border border-white/[0.04]">
                  <p className="text-white font-bold text-2xl tracking-tight">{ifPlanned.toFixed(2)}</p>
                  <p className="text-white/25 text-[10px] font-medium mt-0.5">IF Target</p>
                  <p className="text-white/[0.12] text-[8px] mt-0.5">Effort vs threshold</p>
                </div>
              )}
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Strength body part view */}
      {isStrength && <StrengthView workout={workout} />}

      {/* Workout Structure */}
      {isRun && structure && (
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
          <StructureBlocks structure={structure} color={color} thresholdSpeed={thresholdSpeed} />
        </div>
      )}

      {/* Pace Zones */}
      {isRun && structure && thresholdSpeed && (
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
          <PaceZonesChart structure={structure} thresholdSpeed={thresholdSpeed} color={color} />
        </div>
      )}

      {/* Last Similar Workout */}
      <LastSimilarWorkout workout={workout} allWorkouts={workouts} color={color} />

      {/* Week Context */}
      <WeekContext workout={workout} allWorkouts={workouts} color={color} />

      {/* Workout Description */}
      {description && (
        <motion.div
          className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          dir="rtl"
        >
          <p className="text-white/25 text-[10px] uppercase tracking-wider mb-2 font-semibold text-right">פרטי אימון</p>
          <p className="text-white/50 text-xs leading-relaxed whitespace-pre-line text-right">{description}</p>
        </motion.div>
      )}

      {/* Coach Comments */}
      {coachComments && (
        <motion.div
          className="rounded-2xl border border-white/[0.06] overflow-hidden"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <div className="bg-gradient-to-r from-accent/10 to-transparent p-4" dir="rtl">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-base">🎓</span>
              <p className="text-white/30 text-[10px] uppercase tracking-wider font-semibold text-right">הערות מאמן</p>
            </div>
            <p className="text-white/50 text-xs leading-relaxed whitespace-pre-line text-right">{coachComments}</p>
          </div>
        </motion.div>
      )}

      {/* Motivational Quote */}
      <motion.div
        className="text-center py-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
      >
        <span className="text-2xl mb-2 block">{quote.emoji}</span>
        <p className="text-white/15 text-xs italic max-w-[250px] mx-auto leading-relaxed">
          "{quote.text}"
        </p>
      </motion.div>
    </div>
  )
}

export default NextWorkoutTab
