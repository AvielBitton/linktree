'use client'

import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

function intensityColor(runKm, hasGym) {
  if (runKm <= 0 && !hasGym) return 'rgba(255,255,255,0.03)'
  if (runKm > 0 && hasGym) {
    const alpha = Math.min(0.25 + runKm / 25, 0.9)
    return `rgba(52, 211, 153, ${alpha})`
  }
  if (hasGym) return 'rgba(132, 204, 22, 0.4)'
  const alpha = Math.min(0.15 + runKm / 20, 0.85)
  return `rgba(245, 158, 11, ${alpha})`
}

function TrainingHeatmap({ stravaActivities = [], gymSessions = [], workouts = [] }) {
  const [selectedDay, setSelectedDay] = useState(null)

  const { grid, weeks } = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const startSunday = new Date(today)
    startSunday.setDate(today.getDate() - today.getDay() - 12 * 7)

    const activityByDate = new Map()
    for (const a of stravaActivities) {
      const key = a.date
      if (!activityByDate.has(key)) activityByDate.set(key, { runKm: 0, types: [] })
      const entry = activityByDate.get(key)
      if (a.type === 'Run') entry.runKm += (a.distance || 0) / 1000
      entry.types.push(a.type)
    }

    const gymByDate = new Set()
    for (const s of gymSessions) {
      if (s.started_at) {
        const d = s.started_at.slice(0, 10)
        gymByDate.add(d)
      }
    }

    const workoutByDate = new Map()
    for (const w of workouts) {
      if (w.date) {
        const key = w.date.toISOString().slice(0, 10)
        const dist = parseFloat(w.DistanceInMeters) || 0
        const type = w.WorkoutType || ''
        if (!workoutByDate.has(key)) workoutByDate.set(key, { runKm: 0, types: [] })
        const entry = workoutByDate.get(key)
        if (type.toLowerCase().includes('run') && dist > 0) entry.runKm += dist / 1000
        if (dist > 0 || (parseFloat(w.TimeTotalInHours) || 0) > 0) entry.types.push(type)
      }
    }

    const totalWeeks = 13
    const cells = []
    for (let week = 0; week < totalWeeks; week++) {
      for (let day = 0; day < 7; day++) {
        const d = new Date(startSunday)
        d.setDate(startSunday.getDate() + week * 7 + day)
        const key = d.toISOString().slice(0, 10)
        const isFuture = d > today

        const strava = activityByDate.get(key)
        const wo = workoutByDate.get(key)
        const hasGym = gymByDate.has(key)
        let runKm = 0
        let types = []
        if (strava) { runKm += strava.runKm; types.push(...strava.types) }
        if (wo && !strava) { runKm += wo.runKm; types.push(...wo.types) }

        cells.push({
          week, day, date: d, dateKey: key, isFuture,
          runKm: Math.round(runKm * 10) / 10,
          hasGym,
          types: [...new Set(types)],
          hasActivity: runKm > 0 || hasGym || types.length > 0,
        })
      }
    }

    return { grid: cells, weeks: totalWeeks }
  }, [stravaActivities, gymSessions, workouts])

  const cellSize = 14
  const cellGap = 3
  const labelW = 16
  const headerH = 14
  const svgW = labelW + weeks * (cellSize + cellGap) - cellGap
  const svgH = headerH + 7 * (cellSize + cellGap) - cellGap

  const monthLabels = useMemo(() => {
    const labels = []
    let lastMonth = -1
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    for (const cell of grid) {
      if (cell.day === 0 && cell.date.getMonth() !== lastMonth) {
        lastMonth = cell.date.getMonth()
        labels.push({ week: cell.week, label: months[lastMonth] })
      }
    }
    return labels
  }, [grid])

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15, duration: 0.5 }}
      className="bg-white/[0.03] rounded-2xl p-4 border border-white/[0.06]"
    >
      <div className="flex items-center justify-between mb-3">
        <p className="text-white/40 text-[11px] font-medium uppercase tracking-wider">Training Activity</p>
        <div className="flex items-center gap-3 text-[9px] text-white/25">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-sm" style={{ backgroundColor: 'rgba(245, 158, 11, 0.5)' }} />
            Run
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-sm" style={{ backgroundColor: 'rgba(132, 204, 22, 0.4)' }} />
            Gym
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-sm" style={{ backgroundColor: 'rgba(52, 211, 153, 0.5)' }} />
            Both
          </span>
        </div>
      </div>

      <div className="overflow-x-auto no-scrollbar">
        <svg width={svgW} height={svgH} className="block mx-auto">
          {monthLabels.map((m, i) => (
            <text
              key={i}
              x={labelW + m.week * (cellSize + cellGap)}
              y={10}
              fill="rgba(255,255,255,0.2)"
              fontSize="8"
              fontFamily="monospace"
            >
              {m.label}
            </text>
          ))}

          {[0, 1, 2, 3, 4, 5, 6].map(d => (
            d % 2 === 1 && (
              <text
                key={d}
                x={0}
                y={headerH + d * (cellSize + cellGap) + cellSize - 3}
                fill="rgba(255,255,255,0.15)"
                fontSize="8"
                fontFamily="monospace"
              >
                {DAY_LABELS[d]}
              </text>
            )
          ))}

          {grid.map((cell, i) => (
            <rect
              key={i}
              x={labelW + cell.week * (cellSize + cellGap)}
              y={headerH + cell.day * (cellSize + cellGap)}
              width={cellSize}
              height={cellSize}
              rx={3}
              fill={cell.isFuture ? 'rgba(255,255,255,0.015)' : intensityColor(cell.runKm, cell.hasGym)}
              className={cell.hasActivity && !cell.isFuture ? 'cursor-pointer' : ''}
              onClick={() => cell.hasActivity && !cell.isFuture && setSelectedDay(
                selectedDay?.dateKey === cell.dateKey ? null : cell
              )}
            />
          ))}
        </svg>
      </div>

      <AnimatePresence>
        {selectedDay && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mt-3 pt-3 border-t border-white/[0.06] flex items-center justify-between">
              <div>
                <p className="text-white/40 text-[10px] font-medium">
                  {selectedDay.date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  {selectedDay.runKm > 0 && (
                    <span className="text-amber-400 text-xs font-semibold">{selectedDay.runKm} km</span>
                  )}
                  {selectedDay.hasGym && (
                    <span className="text-lime-400 text-xs font-semibold">Gym</span>
                  )}
                </div>
              </div>
              <div className="flex gap-1">
                {selectedDay.types.map((t, i) => (
                  <span key={i} className="text-[9px] text-white/20 bg-white/[0.04] px-1.5 py-0.5 rounded">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default TrainingHeatmap
