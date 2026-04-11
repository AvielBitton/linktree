'use client'

import { useMemo } from 'react'
import { motion } from 'framer-motion'

function computeStreak(stravaActivities, gymSessions, workouts) {
  const activeDays = new Set()

  for (const a of stravaActivities) {
    if (a.date) activeDays.add(a.date)
  }
  for (const s of gymSessions) {
    if (s.started_at) activeDays.add(s.started_at.slice(0, 10))
  }
  for (const w of workouts) {
    if (!w.date) continue
    const dist = parseFloat(w.DistanceInMeters) || 0
    const dur = parseFloat(w.TimeTotalInHours) || 0
    if (dist > 0 || dur > 0) {
      activeDays.add(w.date.toISOString().slice(0, 10))
    }
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayStr = today.toISOString().slice(0, 10)

  let streak = 0
  const d = new Date(today)

  if (!activeDays.has(todayStr)) {
    d.setDate(d.getDate() - 1)
  }

  while (true) {
    const key = d.toISOString().slice(0, 10)
    if (activeDays.has(key)) {
      streak++
      d.setDate(d.getDate() - 1)
    } else {
      break
    }
  }

  return { streak, hasToday: activeDays.has(todayStr) }
}

function StreakCounter({ stravaActivities = [], gymSessions = [], workouts = [] }) {
  const { streak, hasToday } = useMemo(
    () => computeStreak(stravaActivities, gymSessions, workouts),
    [stravaActivities, gymSessions, workouts]
  )

  return (
    <div className="flex flex-col items-center">
      <motion.div
        className="relative"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', damping: 15, stiffness: 200 }}
      >
        <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
          <span className="text-emerald-400 font-bold text-lg tabular-nums">{streak}</span>
        </div>
        {hasToday && (
          <motion.div
            className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-400"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: 'spring' }}
          />
        )}
      </motion.div>
      <p className="text-white/30 text-[9px] font-medium mt-1.5 uppercase tracking-wider">Streak</p>
    </div>
  )
}

export { computeStreak }
export default StreakCounter
