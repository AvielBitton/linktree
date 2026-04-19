'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { XAxis, YAxis, ResponsiveContainer, Tooltip, AreaChart, Area, ReferenceLine } from 'recharts'
import { toast } from 'sonner'
import { useEditMode } from '@/src/contexts/EditModeContext'
import { getSessionToken } from '@/lib/auth-client'
import { logWeight as logWeightAction } from '@/lib/actions/gym'
import { getAllWeeksStats, getISOYearWeek } from '../utils/workouts'
import {
  isWorkoutCompleted, isDisplayableWorkout, getTypeColor, getWeekSunday,
  buildWeekData, calcStructureDistance, estimateDistance, formatPlannedDuration,
  formatActualDuration,
} from '../utils/dashboard'

function SectionCard({ children, delay = 0, className = '' }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      className={`bg-white/[0.03] rounded-2xl p-4 border border-white/[0.06] ${className}`}
    >
      {children}
    </motion.div>
  )
}

function isCutForDate(dateStr, plans) {
  const plan = plans.find(p => p.start_date && p.end_date && dateStr >= p.start_date && dateStr <= p.end_date)
  return plan ? /cut/i.test(plan.id || plan.name) : false
}

function pctColor(pct, isCut = false) {
  if (pct === null || pct === undefined) return 'text-white/30'
  if (isCut) {
    const abs = Math.abs(pct)
    if (pct <= 0 && abs >= 0.5 && abs <= 1.0) return 'text-emerald-400'
    if (pct <= 0 && abs < 0.5) return 'text-yellow-400'
    if (pct <= 0 && abs > 1.0) return 'text-orange-400'
    return 'text-red-400'
  }
  if (pct >= 0.5 && pct <= 1.0) return 'text-emerald-400'
  if (pct > 0 && pct < 0.5) return 'text-yellow-400'
  if (pct > 1.0) return 'text-orange-400'
  return 'text-red-400'
}

function pctBg(pct, isCut = false) {
  if (pct === null || pct === undefined) return 'bg-white/[0.03]'
  if (isCut) {
    const abs = Math.abs(pct)
    if (pct <= 0 && abs >= 0.5 && abs <= 1.0) return 'bg-emerald-500/[0.06]'
    if (pct <= 0 && abs < 0.5) return 'bg-yellow-500/[0.06]'
    if (pct <= 0 && abs > 1.0) return 'bg-orange-500/[0.06]'
    return 'bg-red-500/[0.06]'
  }
  if (pct >= 0.5 && pct <= 1.0) return 'bg-emerald-500/[0.06]'
  if (pct > 0 && pct < 0.5) return 'bg-yellow-500/[0.06]'
  if (pct > 1.0) return 'bg-orange-500/[0.06]'
  return 'bg-red-500/[0.06]'
}

function WeightChart({ data }) {
  if (data.length < 2) return null
  const wts = data.map(d => d.weightKg)
  const min = Math.min(...wts) - 0.3
  const max = Math.max(...wts) + 0.3
  const yRange = max - min || 1
  const w = 300, h = 100, padL = 28, padR = 8, padT = 8, padB = 18
  const chartW = w - padL - padR
  const chartH = h - padT - padB

  const points = data.map((d, i) => ({
    x: padL + (i / (data.length - 1)) * chartW,
    y: padT + (1 - (d.weightKg - min) / yRange) * chartH,
    kg: d.weightKg,
  }))

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ')
  const areaD = `${pathD} L${points.at(-1).x},${padT + chartH} L${points[0].x},${padT + chartH} Z`

  const gridLines = 3
  const yLabels = Array.from({ length: gridLines + 1 }, (_, i) => {
    const val = min + (yRange / gridLines) * i
    return { val: Math.round(val * 10) / 10, y: padT + (1 - i / gridLines) * chartH }
  })

  const xStep = Math.max(1, Math.floor((data.length - 1) / 4))
  const xLabels = []
  for (let i = 0; i < data.length; i += xStep) {
    const d = new Date(data[i].date)
    xLabels.push({ x: points[i].x, label: `${d.getDate()}/${d.getMonth() + 1}` })
  }

  return (
    <svg width="100%" viewBox={`0 0 ${w} ${h}`} className="overflow-visible">
      <defs>
        <linearGradient id="dashWGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgb(96,165,250)" stopOpacity="0.18" />
          <stop offset="100%" stopColor="rgb(96,165,250)" stopOpacity="0" />
        </linearGradient>
      </defs>
      {yLabels.map((l, i) => (
        <g key={i}>
          <line x1={padL} y1={l.y} x2={w - padR} y2={l.y} stroke="white" strokeOpacity="0.04" strokeWidth="0.5" />
          <text x={padL - 4} y={l.y + 3} textAnchor="end" fill="white" fillOpacity="0.2" fontSize="7" fontFamily="monospace">{l.val}</text>
        </g>
      ))}
      {xLabels.map((l, i) => (
        <text key={i} x={l.x} y={h - 2} textAnchor="middle" fill="white" fillOpacity="0.2" fontSize="7" fontFamily="monospace">{l.label}</text>
      ))}
      <path d={areaD} fill="url(#dashWGrad)" />
      <path d={pathD} fill="none" stroke="rgb(96,165,250)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={points.at(-1).x} cy={points.at(-1).y} r="3.5" fill="rgb(96,165,250)" />
      <text x={points.at(-1).x} y={points.at(-1).y - 7} textAnchor="middle" fill="white" fillOpacity="0.8" fontSize="8" fontWeight="bold" fontFamily="monospace">{points.at(-1).kg}</text>
    </svg>
  )
}

function WeightProgressBar({ avg, prevAvg, targetLow, targetHigh, deltaPct, deltaKg, isCut = false }) {
  const margin = 0.6
  const barMin = Math.min(prevAvg, avg, targetLow || prevAvg) - margin
  const barMax = Math.max(prevAvg, avg, targetHigh || prevAvg) + margin
  const barRange = barMax - barMin || 1
  const w = 300, h = 50, padL = 8, padR = 8
  const trackY = 16, trackH = 6, trackW = w - padL - padR
  const toX = isCut
    ? val => padL + ((barMax - val) / barRange) * trackW
    : val => padL + ((val - barMin) / barRange) * trackW
  const prevX = toX(prevAvg)
  const avgX = toX(avg)
  const goalLX = targetLow ? toX(targetLow) : null
  const goalHX = targetHigh ? toX(targetHigh) : null
  const fillWidth = Math.max(0, avgX - padL)

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <p className="text-[10px] text-white/30 font-medium uppercase tracking-wider">Weekly Goal</p>
        {deltaPct !== null && (
          <span className={`text-[10px] font-bold tabular-nums px-1.5 py-0.5 rounded ${pctBg(deltaPct, isCut)} ${pctColor(deltaPct, isCut)}`}>
            {deltaPct > 0 ? '+' : ''}{deltaPct}%
          </span>
        )}
      </div>
      <svg width="100%" viewBox={`0 0 ${w} ${h}`} className="overflow-visible">
        <defs>
          <linearGradient id="dashProgFill" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="rgb(96,165,250)" stopOpacity="0.15" />
            <stop offset="100%" stopColor="rgb(96,165,250)" stopOpacity="0.5" />
          </linearGradient>
        </defs>
        <rect x={padL} y={trackY} width={trackW} height={trackH} rx={trackH / 2} fill="white" fillOpacity="0.04" />
        {goalLX !== null && (
          <rect x={Math.min(goalLX, goalHX)} y={trackY - 1} width={Math.abs(goalHX - goalLX)} height={trackH + 2} rx={2} fill="rgb(52,211,153)" fillOpacity="0.12" stroke="rgb(52,211,153)" strokeOpacity="0.2" strokeWidth="0.5" />
        )}
        <rect x={padL} y={trackY} width={fillWidth} height={trackH} rx={trackH / 2} fill="url(#dashProgFill)" />
        <line x1={prevX} y1={trackY - 3} x2={prevX} y2={trackY + trackH + 3} stroke="white" strokeOpacity="0.15" strokeWidth="1" strokeDasharray="2 2" />
        <text x={prevX} y={trackY + trackH + 13} textAnchor="middle" fill="white" fillOpacity="0.2" fontSize="7" fontFamily="monospace">{prevAvg}</text>
        <circle cx={avgX} cy={trackY + trackH / 2} r="5" fill="rgb(96,165,250)" />
        <circle cx={avgX} cy={trackY + trackH / 2} r="7" fill="none" stroke="rgb(96,165,250)" strokeOpacity="0.2" strokeWidth="1" />
        <text x={avgX} y={trackY - 5} textAnchor="middle" fill="white" fillOpacity="0.8" fontSize="9" fontWeight="bold" fontFamily="monospace">{avg}</text>
        {goalLX !== null && (
          <text x={(goalLX + goalHX) / 2} y={trackY + trackH + 13} textAnchor="middle" fill="rgb(52,211,153)" fillOpacity="0.4" fontSize="7" fontFamily="monospace">{targetLow}–{targetHigh}</text>
        )}
      </svg>
    </div>
  )
}

function VolumeTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[#1c1c1e] border border-white/10 rounded-xl px-3 py-2">
      <p className="text-white/40 text-[10px] mb-0.5">W{label}</p>
      <p className="text-white font-semibold text-sm">{payload[0].value} km</p>
    </div>
  )
}

function SleepTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  const hours = payload[0]?.value
  const rhr = payload[1]?.value
  return (
    <div className="bg-[#1c1c1e] border border-white/10 rounded-xl px-3 py-2">
      <p className="text-white/40 text-[10px] mb-0.5">{label}</p>
      {hours != null && <p className="text-white font-semibold text-sm">{hours}h sleep</p>}
      {rhr != null && <p className="text-red-400/80 text-xs">{rhr} bpm</p>}
    </div>
  )
}

function DashboardTab({
  workouts = [],
  stravaActivities = [],
  stravaPRs = [],
  garminHealth = [],
  gymSessions = [],
  gymTemplates = [],
  gymWeights = [],
  mealPlans = [],
  mealCompletions = [],
  runnaPlan = null,
  onTabChange,
}) {
  const { editMode } = useEditMode()
  const [mounted, setMounted] = useState(false)
  const [weightInput, setWeightInput] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [weightRange, setWeightRange] = useState('week')

  useEffect(() => { setMounted(true) }, [])

  const todayStr = new Date().toISOString().slice(0, 10)
  const isCutMode = useMemo(() => isCutForDate(todayStr, mealPlans), [todayStr, mealPlans])

  // ── Weight data ──
  const weightLogs = useMemo(() =>
    gymWeights.map(w => ({ date: w.date, weightKg: w.weight_kg ?? w.weightKg })),
    [gymWeights]
  )
  const todayWeight = weightLogs.find(l => l.date === todayStr)?.weightKg || null
  const yesterdayWeight = useMemo(() => {
    const y = new Date(); y.setDate(y.getDate() - 1)
    return weightLogs.find(l => l.date === y.toISOString().slice(0, 10))?.weightKg || null
  }, [weightLogs])
  const weightDelta = todayWeight && yesterdayWeight ? +(todayWeight - yesterdayWeight).toFixed(1) : null
  const latestWeight = weightLogs[0]?.weightKg || null

  const weightRangeDays = weightRange === 'week' ? 7 : weightRange

  const weightChartData = useMemo(() => {
    const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - weightRangeDays)
    return weightLogs.filter(l => new Date(l.date) >= cutoff).slice().reverse()
  }, [weightLogs, weightRangeDays])

  function formatWeekRange(logs) {
    if (logs.length === 0) return ''
    const dates = logs.map(l => new Date(l.date)).sort((a, b) => a - b)
    const first = dates[0], last = dates[dates.length - 1]
    const fmt = d => `${d.getDate()}/${d.getMonth() + 1}`
    return first.toDateString() === last.toDateString() ? fmt(first) : `${fmt(first)}–${fmt(last)}`
  }

  const weeklyBreakdown = useMemo(() => {
    const source = weightRange === 'week'
      ? weightLogs.filter(l => {
          const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - 21)
          return new Date(l.date) >= cutoff
        }).slice().reverse()
      : weightChartData
    if (source.length < 2) return []
    const byWeek = new Map()
    source.forEach(l => {
      const d = new Date(l.date)
      const mon = new Date(d); mon.setDate(d.getDate() - ((d.getDay() + 6) % 7))
      const key = mon.toISOString().slice(0, 10)
      if (!byWeek.has(key)) byWeek.set(key, [])
      byWeek.get(key).push(l)
    })
    const weeks = []
    for (const [, wLogs] of byWeek) {
      const avg = +(wLogs.reduce((s, l) => s + l.weightKg, 0) / wLogs.length).toFixed(1)
      weeks.push({ logs: wLogs, avg, range: formatWeekRange(wLogs), days: wLogs.length })
    }
    for (let i = 1; i < weeks.length; i++) {
      const prev = weeks[i - 1].avg, curr = weeks[i].avg
      weeks[i].deltaKg = +(curr - prev).toFixed(1)
      weeks[i].deltaPct = +((curr - prev) / prev * 100).toFixed(2)
    }
    return weeks
  }, [weightChartData, weightRange, weightLogs])

  const thisWeekStats = useMemo(() => {
    if (weeklyBreakdown.length === 0) return null
    const current = weeklyBreakdown[weeklyBreakdown.length - 1]
    const prev = weeklyBreakdown.length >= 2 ? weeklyBreakdown[weeklyBreakdown.length - 2] : null
    if (!prev) return { avg: current.avg, deltaKg: null, deltaPct: null, targetLow: null, targetHigh: null }
    return {
      avg: current.avg,
      deltaKg: +(current.avg - prev.avg).toFixed(1),
      deltaPct: +((current.avg - prev.avg) / prev.avg * 100).toFixed(2),
      targetLow: +(prev.avg * (isCutMode ? 0.99 : 1.005)).toFixed(1),
      targetHigh: +(prev.avg * (isCutMode ? 0.995 : 1.01)).toFixed(1),
    }
  }, [weeklyBreakdown, isCutMode])

  const currentWeekView = useMemo(() => {
    if (!thisWeekStats) return null
    const thisWeek = weeklyBreakdown[weeklyBreakdown.length - 1]
    if (!thisWeek || thisWeek.logs.length === 0) return null
    const prev = weeklyBreakdown.length >= 2 ? weeklyBreakdown[weeklyBreakdown.length - 2] : null
    return {
      avg: thisWeekStats.avg, prevAvg: prev ? prev.avg : null,
      targetLow: thisWeekStats.targetLow, targetHigh: thisWeekStats.targetHigh,
      deltaPct: thisWeekStats.deltaPct, deltaKg: thisWeekStats.deltaKg,
    }
  }, [weeklyBreakdown, thisWeekStats])

  const weeklyWeightStats = useMemo(() => {
    const source = weightLogs.filter(l => {
      const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - 21)
      return new Date(l.date) >= cutoff
    }).slice().reverse()
    if (source.length < 2) return null
    const byWeek = new Map()
    source.forEach(l => {
      const d = new Date(l.date)
      const mon = new Date(d); mon.setDate(d.getDate() - ((d.getDay() + 6) % 7))
      const key = mon.toISOString().slice(0, 10)
      if (!byWeek.has(key)) byWeek.set(key, [])
      byWeek.get(key).push(l)
    })
    const weeks = []
    for (const [, wLogs] of byWeek) {
      const avg = +(wLogs.reduce((s, l) => s + l.weightKg, 0) / wLogs.length).toFixed(1)
      weeks.push({ avg, days: wLogs.length })
    }
    if (weeks.length < 2) return null
    const prev = weeks[weeks.length - 2]
    const curr = weeks[weeks.length - 1]
    const deltaKg = +(curr.avg - prev.avg).toFixed(1)
    const deltaPct = +((curr.avg - prev.avg) / prev.avg * 100).toFixed(2)
    const targetLow = +(prev.avg * (isCutMode ? 0.99 : 1.005)).toFixed(1)
    const targetHigh = +(prev.avg * (isCutMode ? 0.995 : 1.01)).toFixed(1)
    return { avg: curr.avg, prevAvg: prev.avg, deltaKg, deltaPct, targetLow, targetHigh }
  }, [weightLogs, isCutMode])

  async function handleWeightSubmit(e) {
    e.preventDefault()
    const w = parseFloat(weightInput.replace(',', '.'))
    if (!w || w < 20 || w > 300) { toast.error('Enter a valid weight (20-300 kg)'); return }
    const token = getSessionToken()
    if (!token) { toast.error('Not authenticated'); return }
    setSubmitting(true)
    try {
      const res = await logWeightAction(token, w)
      if (res.success) { setWeightInput(''); toast.success(`${w} kg logged`) }
      else toast.error(res.error || 'Failed')
    } catch { toast.error('Network error') }
    finally { setSubmitting(false) }
  }

  // ── Today's workouts ──
  const todayWorkouts = useMemo(() => {
    const today = new Date(); today.setHours(0, 0, 0, 0)
    return workouts
      .filter(w => {
        if (!w.date) return false
        const wd = new Date(w.date); wd.setHours(0, 0, 0, 0)
        return wd.getTime() === today.getTime()
      })
      .filter(isDisplayableWorkout)
  }, [workouts])

  const todayInfo = useMemo(() => {
    if (todayWorkouts.length === 0) return { type: 'rest', items: [], allDone: false }
    const items = todayWorkouts.map(w => {
      const type = w.WorkoutType || 'Other'
      const title = w.Title || type
      const completed = isWorkoutCompleted(w)
      const actualKm = parseFloat(w.DistanceInMeters) || 0
      const actualDur = parseFloat(w.TimeTotalInHours) || 0
      let distText = ''
      if (completed && actualKm > 0) distText = `${Math.round(actualKm / 100) / 10} km`
      else {
        const planned = parseFloat(w.PlannedDistanceInMeters) || 0
        if (planned > 0) distText = `${Math.round(planned / 100) / 10} km`
        else {
          const sd = calcStructureDistance(w.structure, w.thresholdSpeed)
          if (sd) distText = `~${sd} km`
          else {
            const dur = parseFloat(w.PlannedDuration) || 0
            const est = estimateDistance(dur)
            if (est) distText = `~${est} km`
          }
        }
      }
      const durText = completed && actualDur > 0
        ? formatActualDuration(actualDur)
        : formatPlannedDuration(parseFloat(w.PlannedDuration) || 0)
      return { type, title, completed, distText, durText, color: getTypeColor(type) }
    })
    return { type: 'active', items, allDone: items.length > 0 && items.every(i => i.completed) }
  }, [todayWorkouts])

  const nextWorkout = useMemo(() => {
    const tomorrow = new Date()
    tomorrow.setHours(0, 0, 0, 0)
    tomorrow.setDate(tomorrow.getDate() + 1)
    const candidates = workouts
      .filter(w => {
        if (!w.date) return false
        const wd = new Date(w.date); wd.setHours(0, 0, 0, 0)
        if (wd < tomorrow) return false
        if (isWorkoutCompleted(w)) return false
        if (!isDisplayableWorkout(w)) return false
        const type = (w.WorkoutType || '').toLowerCase()
        if (type === 'day off' || type === 'rest') return false
        return true
      })
      .sort((a, b) => a.date - b.date)
    const w = candidates[0]
    if (!w) return null
    const type = w.WorkoutType || 'Other'
    const title = w.Title || type
    const planned = parseFloat(w.PlannedDistanceInMeters) || 0
    let distText = ''
    if (planned > 0) distText = `${Math.round(planned / 100) / 10} km`
    else {
      const sd = calcStructureDistance(w.structure, w.thresholdSpeed)
      if (sd) distText = `~${sd} km`
      else {
        const dur = parseFloat(w.PlannedDuration) || 0
        const est = estimateDistance(dur)
        if (est) distText = `~${est} km`
      }
    }
    const diffDays = Math.ceil((new Date(w.date).setHours(0,0,0,0) - new Date().setHours(0,0,0,0)) / (1000 * 60 * 60 * 24))
    let timeLabel = 'Tomorrow'
    if (diffDays === 2) {
      const dayNames = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
      timeLabel = dayNames[new Date(w.date).getDay()]
    } else if (diffDays > 2) {
      const dayNames = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
      timeLabel = `${dayNames[new Date(w.date).getDay()]} · in ${diffDays}d`
    }
    return { type, title, distText, timeLabel, color: getTypeColor(type) }
  }, [workouts])

  // ── Today's meals ──
  const activePlan = useMemo(() => mealPlans.find(p => p.active) || mealPlans[0], [mealPlans])
  const mealsToday = useMemo(() => {
    if (!activePlan?.meals) return { done: 0, total: 0, totalKcal: 0, totalProtein: 0 }
    const todayC = mealCompletions.filter(c => c.date === todayStr && c.plan_id === activePlan.id)
    const doneIds = new Set(todayC.map(c => c.meal_id))
    return {
      done: doneIds.size,
      total: activePlan.meals.length,
      totalKcal: activePlan.meals.reduce((s, m) => s + (m.target_kcal || 0), 0),
      totalProtein: activePlan.meals.reduce((s, m) => s + (m.target_protein || 0), 0),
    }
  }, [activePlan, mealCompletions, todayStr])

  // ── Week progress ──
  const weekProgress = useMemo(() => {
    const sunday = getWeekSunday(new Date())
    const sorted = [...workouts].sort((a, b) => a.date - b.date)
    const firstDate = sorted.length > 0 ? sorted[0].date : new Date()
    const wd = buildWeekData(workouts, sunday, firstDate)

    const today = new Date(); today.setHours(0, 0, 0, 0)
    const allDayWorkouts = wd.days.flatMap(d => d.workouts)
    const displayable = allDayWorkouts.filter(w => {
      const type = (w.WorkoutType || '').toLowerCase()
      return type !== 'day off' && type !== 'rest'
    })
    const completedCount = displayable.filter(isWorkoutCompleted).length
    const totalCount = displayable.length

    const gymThisWeek = gymSessions.filter(s => {
      if (!s.started_at || !s.finished_at) return false
      const d = new Date(s.started_at)
      return d >= sunday && d <= new Date(sunday.getTime() + 7 * 24 * 60 * 60 * 1000)
    }).length

    const remaining = []
    for (const day of wd.days) {
      const dayDate = new Date(sunday)
      const dayIdx = wd.days.indexOf(day)
      dayDate.setDate(sunday.getDate() + dayIdx)
      dayDate.setHours(0, 0, 0, 0)
      if (dayDate < today) continue
      for (const w of day.workouts) {
        const type = (w.WorkoutType || '').toLowerCase()
        if (type === 'day off' || type === 'rest') continue
        if (isWorkoutCompleted(w)) continue
        remaining.push({
          dayName: day.dayName,
          title: w.Title || w.WorkoutType || 'Workout',
          type: w.WorkoutType || 'Other',
          color: getTypeColor(w.WorkoutType || 'Other'),
          distText: (() => {
            const p = parseFloat(w.PlannedDistanceInMeters) || 0
            if (p > 0) return `${Math.round(p / 100) / 10} km`
            const sd = calcStructureDistance(w.structure, w.thresholdSpeed)
            if (sd) return `~${sd} km`
            return ''
          })(),
        })
      }
    }

    return {
      plannedKm: wd.totalPlannedKm,
      actualKm: wd.totalActualKm,
      pctDone: wd.totalPlannedKm > 0 ? Math.round((wd.totalActualKm / wd.totalPlannedKm) * 100) : 0,
      completedCount,
      totalCount,
      gymThisWeek,
      remaining,
      dateRange: wd.dateRange,
    }
  }, [workouts, gymSessions])

  // ── Trends: volume chart ──
  const weekStats = useMemo(() => getAllWeeksStats(workouts), [workouts])
  const volumeChartData = useMemo(() => {
    const gymByWeek = new Map()
    for (const s of gymSessions) {
      if (!s.started_at) continue
      const { year, week } = getISOYearWeek(new Date(s.started_at))
      const key = `${year}-${week.toString().padStart(2, '0')}`
      gymByWeek.set(key, (gymByWeek.get(key) || 0) + 1)
    }
    return [...weekStats].slice(0, 8).reverse().map(week => ({
      week: week.weekKey.split('-')[1],
      distance: week.distanceKm,
      gym: gymByWeek.get(week.weekKey) || 0,
    }))
  }, [weekStats, gymSessions])



  // ── Garmin: Sleep & HR trends ──
  const [sleepRange, setSleepRange] = useState('week')

  const allSleepData = useMemo(() => {
    if (!garminHealth?.length) return []
    return [...garminHealth]
      .filter(d => d.sleep?.totalSeconds || d.restingHeartRate)
      .sort((a, b) => a.date.localeCompare(b.date))
      .map(d => ({
        rawDate: d.date,
        date: `${new Date(d.date).getDate()}/${new Date(d.date).getMonth() + 1}`,
        hours: d.sleep?.totalSeconds ? +(d.sleep.totalSeconds / 3600).toFixed(1) : null,
        rhr: d.restingHeartRate || null,
      }))
  }, [garminHealth])

  const sleepRangeDays = sleepRange === 'week' ? 7 : sleepRange

  const sleepChartData = useMemo(() => {
    if (!allSleepData.length) return []
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - sleepRangeDays)
    const cutoffStr = cutoff.toISOString().slice(0, 10)
    return allSleepData.filter(d => d.rawDate >= cutoffStr)
  }, [allSleepData, sleepRangeDays])

  const sleepStats = useMemo(() => {
    if (!sleepChartData.length) return null
    const validHours = sleepChartData.filter(d => d.hours != null)
    const validRhr = sleepChartData.filter(d => d.rhr != null)
    if (!validHours.length) return null
    const avgHours = +(validHours.reduce((s, d) => s + d.hours, 0) / validHours.length).toFixed(1)
    const above7 = validHours.filter(d => d.hours >= 7).length
    const avgRhr = validRhr.length ? Math.round(validRhr.reduce((s, d) => s + d.rhr, 0) / validRhr.length) : null
    const latestRhr = validRhr.length ? validRhr[validRhr.length - 1].rhr : null
    return { avgHours, above7, totalNights: validHours.length, avgRhr, latestRhr }
  }, [sleepChartData])

  const displayW = todayWeight || latestWeight

  return (
    <div className="space-y-3">

      {/* ═══ Runna Plan Indicator ═══ */}
      {runnaPlan && (
        <div className="flex items-center justify-between px-3.5 py-1.5 rounded-xl border bg-pink-500/[0.04] border-pink-500/[0.08]">
          <div className="flex items-center gap-2 text-[11px]">
            <p className="text-pink-400/50 text-[9px] font-bold uppercase tracking-wider">Run</p>
            <p className="text-pink-400/90 font-semibold">{runnaPlan.name}</p>
            <p className="text-white/15 text-[10px] tabular-nums">
              {runnaPlan.raceDate ? runnaPlan.raceDate.slice(5).replace('-', '/') : ''}
              {runnaPlan.daysToRace > 0 ? ` · ${runnaPlan.daysToRace}d` : ''}
              {runnaPlan.totalPlannedKm > 0 ? ` · ${runnaPlan.completedKm || 0}/${runnaPlan.totalPlannedKm} km` : ''}
            </p>
          </div>
          {runnaPlan.totalWeeks && (
            <div className="flex items-center gap-1.5">
              <div className="flex gap-0.5">
                {Array.from({ length: runnaPlan.totalWeeks }, (_, i) => (
                  <div
                    key={i}
                    className={`h-1.5 rounded-full ${runnaPlan.currentWeek && i < runnaPlan.currentWeek ? 'bg-pink-400' : 'bg-white/10'}`}
                    style={{ width: `${Math.max(12, 36 / runnaPlan.totalWeeks)}px` }}
                  />
                ))}
              </div>
              <span className="text-pink-400/60 text-[9px] font-bold tabular-nums">
                {runnaPlan.currentWeek || 0}/{runnaPlan.totalWeeks}
              </span>
            </div>
          )}
        </div>
      )}

      {/* ═══ Active Plan Indicator ═══ */}
      {activePlan && (
        <div className={`flex items-center justify-between px-3.5 py-1.5 rounded-xl border ${isCutMode ? 'bg-amber-500/[0.04] border-amber-500/[0.08]' : 'bg-blue-500/[0.04] border-blue-500/[0.08]'}`}>
          <div className="flex items-center gap-2 text-[11px]">
            <span className={`text-[9px] font-bold uppercase tracking-wider ${isCutMode ? 'text-amber-400/50' : 'text-blue-400/50'}`}>
              Diet
            </span>
            <span className={`font-semibold ${isCutMode ? 'text-amber-400/90' : 'text-blue-400/90'}`}>{activePlan.name}</span>
            {activePlan.start_date && activePlan.end_date && (
              <span className="text-white/15 text-[10px] tabular-nums">
                {activePlan.start_date.slice(5).replace('-', '/')}–{activePlan.end_date.slice(5).replace('-', '/')}
              </span>
            )}
          </div>
          <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${isCutMode ? 'bg-amber-500/15 text-amber-400/70' : 'bg-blue-500/15 text-blue-400/70'}`}>
            {isCutMode ? 'Cut' : 'Bulk'}
          </span>
        </div>
      )}

      {/* ═══ SECTION 1: Weight Hero ═══ */}
      <SectionCard delay={0.05}>
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
              <svg className="w-4 h-4 text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 20V10" /><path d="M18 20V4" /><path d="M6 20v-4" />
              </svg>
            </div>
            <p className="text-white/40 text-[11px] font-medium uppercase tracking-wider">Body Weight</p>
          </div>
          {weeklyWeightStats?.deltaPct !== null && weeklyWeightStats?.deltaPct !== undefined && (
            <span className={`text-[10px] font-bold tabular-nums px-1.5 py-0.5 rounded ${pctBg(weeklyWeightStats.deltaPct, isCutMode)} ${pctColor(weeklyWeightStats.deltaPct, isCutMode)}`}>
              {weeklyWeightStats.deltaPct > 0 ? '+' : ''}{weeklyWeightStats.deltaPct}%/w
            </span>
          )}
        </div>

        <div className="flex items-end justify-between mt-2 mb-3">
          <div>
            {mounted && displayW ? (
              <>
                <p className="text-white font-bold text-3xl tabular-nums tracking-tight leading-none">
                  {displayW}<span className="text-white/30 text-lg ml-1">kg</span>
                </p>
                <div className="flex items-center gap-2 mt-1">
                  {!todayWeight && (
                    <span className="text-amber-400/70 text-[11px] font-medium">Not logged today</span>
                  )}
                  {weightDelta !== null && weightDelta !== 0 && (
                    <span className={`text-[11px] font-medium tabular-nums ${weightDelta > 0 ? 'text-blue-400/70' : 'text-red-400/60'}`}>
                      {weightDelta > 0 ? '↑' : '↓'}{Math.abs(weightDelta)} vs yesterday
                    </span>
                  )}
                  {weeklyWeightStats && (
                    <span className="text-[11px] text-white/25 tabular-nums">
                      avg {weeklyWeightStats.avg}
                    </span>
                  )}
                </div>
              </>
            ) : !mounted ? (
              <p className="text-white/20 text-lg">&nbsp;</p>
            ) : (
              <p className="text-amber-400/70 text-sm font-medium">Not logged today</p>
            )}
          </div>
          {mounted && editMode && !todayWeight && (
            <form onSubmit={handleWeightSubmit} className="flex items-center gap-1.5">
              <input
                type="text"
                inputMode="decimal"
                pattern="[0-9]*[.,]?[0-9]*"
                value={weightInput}
                onChange={e => setWeightInput(e.target.value)}
                placeholder="kg"
                className="w-16 bg-white/[0.06] rounded-lg px-2 py-1.5 text-xs text-white text-center font-medium tabular-nums placeholder:text-white/15 focus:outline-none focus:ring-1 focus:ring-blue-500/30"
              />
              <button type="submit" disabled={submitting} className="w-9 h-9 rounded-lg bg-blue-500/15 text-blue-400 flex items-center justify-center hover:bg-blue-500/25 active:scale-95 transition-all disabled:opacity-40">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </button>
            </form>
          )}
        </div>

        {weightLogs.length > 0 && (
          <div className="flex gap-1 mb-3 mt-1">
            {['week', 30, 90, 365].map(d => (
              <button
                key={d}
                onClick={() => setWeightRange(d)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-medium transition-colors ${
                  weightRange === d ? 'bg-blue-500/15 text-blue-400' : 'bg-white/[0.04] text-white/25'
                }`}
              >
                {d === 'week' ? 'This Week' : d === 365 ? 'All' : `${d}d`}
              </button>
            ))}
          </div>
        )}

        {weightChartData.length > 1 && <WeightChart data={weightChartData} />}

        {weightRange === 'week' ? (
          currentWeekView && currentWeekView.prevAvg && (
            <div className="mt-3 pt-3 border-t border-white/[0.04]">
              <WeightProgressBar {...currentWeekView} isCut={isCutMode} />
            </div>
          )
        ) : (
          <>
            {weeklyBreakdown.length > 0 && (() => {
              const visible = [...weeklyBreakdown].filter(w => w.days >= 2).reverse().map(week => {
                const lastLog = week.logs[week.logs.length - 1]
                const weekIsCut = lastLog ? isCutForDate(lastLog.date, mealPlans) : isCutMode
                return { ...week, isCut: weekIsCut }
              })
              return (
                <div className="mt-3 pt-3 border-t border-white/[0.04]">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[10px] text-white/30 font-medium uppercase tracking-wider">Weekly Breakdown</p>
                    <p className="text-[9px] text-white/15">Target: {isCutMode ? '-0.5 to -1' : '0.5–1'}%/week</p>
                  </div>
                  <div className="space-y-1">
                    {visible.map((week, i) => (
                      <div key={i} className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg ${pctBg(week.deltaPct, week.isCut)}`}>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-white/25 tabular-nums w-[70px]">{week.range}</span>
                          <span className={`text-[8px] font-bold px-1 py-0.5 rounded ${week.isCut ? 'bg-amber-500/10 text-amber-400/60' : 'bg-blue-500/10 text-blue-400/60'}`}>
                            {week.isCut ? 'C' : 'B'}
                          </span>
                          <span className="text-xs text-white font-semibold tabular-nums">{week.avg} kg</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {week.deltaKg !== undefined && (
                            <span className="text-[10px] text-white/30 tabular-nums">
                              {week.deltaKg > 0 ? '+' : ''}{week.deltaKg} kg
                            </span>
                          )}
                          {week.deltaPct !== undefined ? (
                            <span className={`text-[10px] font-bold tabular-nums min-w-[42px] text-right ${pctColor(week.deltaPct, week.isCut)}`}>
                              {week.deltaPct > 0 ? '+' : ''}{week.deltaPct}%
                            </span>
                          ) : (
                            <span className="text-[10px] text-white/15 min-w-[42px] text-right">—</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })()}

            {thisWeekStats && (
              <div className="grid grid-cols-3 gap-2 mt-3">
                <div className="text-center bg-white/[0.02] rounded-lg py-1.5">
                  <p className="text-white font-bold text-xs tabular-nums">{thisWeekStats.avg} kg</p>
                  <p className="text-[9px] text-white/20">Week Avg</p>
                </div>
                <div className="text-center bg-white/[0.02] rounded-lg py-1.5">
                  <p className={`font-bold text-xs tabular-nums ${thisWeekStats.deltaKg !== null ? (thisWeekStats.deltaKg > 0 ? 'text-blue-400' : 'text-red-400') : 'text-white/30'}`}>
                    {thisWeekStats.deltaKg !== null ? `${thisWeekStats.deltaKg > 0 ? '+' : ''}${thisWeekStats.deltaKg}` : '—'}
                  </p>
                  <p className="text-[9px] text-white/20">vs Last Week</p>
                </div>
                <div className={`text-center rounded-lg py-1.5 ${pctBg(thisWeekStats.deltaPct, isCutMode)}`}>
                  <p className={`font-bold text-xs tabular-nums ${pctColor(thisWeekStats.deltaPct, isCutMode)}`}>
                    {thisWeekStats.deltaPct !== null ? `${thisWeekStats.deltaPct > 0 ? '+' : ''}${thisWeekStats.deltaPct}%` : '—'}
                  </p>
                  <p className="text-[9px] text-white/20">Weekly %</p>
                </div>
              </div>
            )}
          </>
        )}
      </SectionCard>

      {/* ═══ Sleep & Recovery ═══ */}
      {allSleepData.length > 0 && sleepStats && (
        <SectionCard delay={0.08}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <p className="text-white font-bold text-2xl tabular-nums leading-none">
                {sleepStats.avgHours}<span className="text-white/30 text-sm ml-0.5">h</span>
              </p>
              <div className="flex flex-col">
                <span className="text-white/40 text-[10px] font-medium uppercase tracking-wider leading-tight">Avg Sleep</span>
                <span className={`text-[10px] font-medium tabular-nums leading-tight ${sleepStats.avgHours >= 7 ? 'text-emerald-400/70' : sleepStats.avgHours >= 6.5 ? 'text-yellow-400/70' : 'text-red-400/70'}`}>
                  {sleepStats.avgHours >= 7 ? 'On target' : `${(7 - sleepStats.avgHours).toFixed(1)}h below goal`}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {['week', 30, 90].map(d => (
                <button
                  key={d}
                  onClick={() => setSleepRange(d)}
                  className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${
                    sleepRange === d ? 'bg-indigo-500/15 text-indigo-400' : 'text-white/20'
                  }`}
                >
                  {d === 'week' ? '7d' : `${d}d`}
                </button>
              ))}
            </div>
          </div>

          {sleepChartData.length > 0 && (() => {
            const maxH = 10
            const goalH = 7
            const bars = sleepChartData.filter(d => d.hours != null)
            if (!bars.length) return null
            const gap = bars.length > 30 ? 1 : bars.length > 14 ? 2 : 3
            return (
              <div>
                <div className="relative h-28 flex items-end" style={{ gap: `${gap}px` }}>
                  <div className="absolute left-0 right-0 border-t border-dashed border-emerald-400/20" style={{ bottom: `${(goalH / maxH) * 100}%` }}>
                    <span className="absolute -top-3 right-0 text-[8px] text-emerald-400/40 font-medium">7h</span>
                  </div>
                  {bars.map((d, i) => {
                    const pct = Math.min((d.hours / maxH) * 100, 100)
                    const good = d.hours >= goalH
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center justify-end h-full group relative">
                        <div className="absolute top-full mt-1 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                          <div className="bg-[#1c1c1e] border border-white/10 rounded-lg px-2 py-1 whitespace-nowrap shadow-lg">
                            <p className="text-white text-[10px] font-semibold">{d.hours}h</p>
                            <p className="text-white/40 text-[8px]">{d.date}</p>
                          </div>
                        </div>
                        <motion.div
                          className={`w-full rounded-sm ${good ? 'bg-indigo-400/60' : 'bg-indigo-400/25'}`}
                          initial={{ height: 0 }}
                          animate={{ height: `${pct}%` }}
                          transition={{ duration: 0.5, delay: i * 0.01 }}
                        />
                      </div>
                    )
                  })}
                </div>
                <div className="flex justify-between mt-1.5">
                  <span className="text-white/15 text-[9px] tabular-nums">{bars[0]?.date}</span>
                  <span className={`text-[9px] font-medium tabular-nums ${sleepStats.above7 / sleepStats.totalNights >= 0.7 ? 'text-emerald-400/50' : sleepStats.above7 / sleepStats.totalNights >= 0.5 ? 'text-yellow-400/50' : 'text-red-400/50'}`}>
                    {sleepStats.above7}/{sleepStats.totalNights} above 7h
                  </span>
                  <span className="text-white/15 text-[9px] tabular-nums">{bars[bars.length - 1]?.date}</span>
                </div>
              </div>
            )
          })()}
        </SectionCard>
      )}

      {/* ═══ SECTION 2: Today's Plan ═══ */}
      <div className="grid grid-cols-2 gap-2 items-stretch">
        {/* Today's Workout */}
        <SectionCard delay={0.12} className="col-span-1">
          <button onClick={() => onTabChange?.('schedule')} className="w-full text-left">
            <p className="text-white/40 text-[11px] font-medium uppercase tracking-wider mb-2">Today</p>
            {todayInfo.type === 'rest' ? (
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-white/[0.04] flex items-center justify-center">
                  <span className="text-white/20 text-sm">😴</span>
                </div>
                <p className="text-white/30 text-xs font-medium">Rest Day</p>
              </div>
            ) : (
              <div className="space-y-2">
                {todayInfo.items.map((item, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5" style={{ backgroundColor: item.color + '18' }}>
                      {item.completed ? (
                        <svg className="w-3.5 h-3.5 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      ) : (
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={`text-[11px] font-medium truncate ${item.completed ? 'text-white/50' : 'text-white/80'}`}>
                        {item.title}
                      </p>
                      <div className="flex items-center gap-1.5">
                        {item.distText && <span className="text-white/25 text-[10px]">{item.distText}</span>}
                        {item.durText && <span className="text-white/15 text-[10px]">{item.durText}</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {(todayInfo.allDone || todayInfo.type === 'rest') && nextWorkout && (
              <div className="mt-2.5 pt-2.5 border-t border-white/[0.04]">
                <p className="text-white/20 text-[9px] font-medium uppercase tracking-wider mb-1.5">Next</p>
                <div className="flex items-start gap-2">
                  <div className="w-6 h-6 rounded-md flex items-center justify-center shrink-0 mt-0.5" style={{ backgroundColor: nextWorkout.color + '15' }}>
                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: nextWorkout.color }} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] text-white/60 font-medium truncate">{nextWorkout.title}</p>
                    <div className="flex items-center gap-1.5">
                      <span className="text-white/20 text-[10px]">{nextWorkout.timeLabel}</span>
                      {nextWorkout.distText && <span className="text-white/15 text-[10px]">{nextWorkout.distText}</span>}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </button>
        </SectionCard>

        {/* Right column: Resting HR + Meals */}
        <div className="flex flex-col gap-2">
          {sleepStats?.avgRhr && (
            <SectionCard delay={0.14}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-red-500/10 flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4 text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                  </svg>
                </div>
                <div>
                  <p className="text-white font-bold text-lg tabular-nums leading-tight">
                    {sleepStats.latestRhr || sleepStats.avgRhr} <span className="text-white/30 text-xs font-normal">bpm</span>
                  </p>
                  <p className="text-white/25 text-[10px] tabular-nums">Resting HR · avg {sleepStats.avgRhr}</p>
                </div>
              </div>
            </SectionCard>
          )}

          <SectionCard delay={0.16}>
            <button onClick={() => onTabChange?.('nutrition')} className="w-full text-left">
              <p className="text-white/40 text-[11px] font-medium uppercase tracking-wider mb-2">Meals</p>
              <div className="flex items-center justify-between mb-2">
                <p className="text-white font-bold text-lg tabular-nums leading-tight">
                  {mealsToday.done}<span className="text-white/20">/{mealsToday.total}</span>
                </p>
                {activePlan && (
                  <span className="text-[9px] text-white/25 bg-white/[0.04] px-1.5 py-0.5 rounded">{activePlan.name}</span>
                )}
              </div>
              {mealsToday.total > 0 && (
                <div className="w-full h-1.5 bg-white/[0.04] rounded-full overflow-hidden mb-2">
                  <motion.div
                    className="h-full bg-emerald-400/60 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${(mealsToday.done / mealsToday.total) * 100}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                  />
                </div>
              )}
              <div className="flex items-center gap-3 text-[10px] text-white/25 tabular-nums">
                <span>{mealsToday.totalKcal} kcal</span>
                <span>{mealsToday.totalProtein}g prot</span>
              </div>
            </button>
          </SectionCard>
        </div>
      </div>

      {/* ═══ SECTION 3: Week Progress ═══ */}
      <SectionCard delay={0.2}>
        <div className="flex items-center justify-between mb-3">
          <p className="text-white/40 text-[11px] font-medium uppercase tracking-wider">This Week</p>
          <span className="text-white/20 text-[10px]">{weekProgress.dateRange}</span>
        </div>

        {/* KM progress bar */}
        {weekProgress.plannedKm > 0 && (
          <div className="mb-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-white/30 text-[10px]">Running</span>
              <span className="text-white/50 text-[10px] tabular-nums font-medium">
                {weekProgress.actualKm} / {weekProgress.plannedKm} km
              </span>
            </div>
            <div className="w-full h-2 bg-white/[0.04] rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: '#F59E0B' }}
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(weekProgress.pctDone, 100)}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
              />
            </div>
          </div>
        )}

        {/* Stats row */}
        <div className="flex items-center gap-4 mb-3">
          <div className="flex items-center gap-1.5">
            <span className="text-emerald-400 font-bold text-sm tabular-nums">{weekProgress.completedCount}</span>
            <span className="text-white/20 text-[10px]">/ {weekProgress.totalCount} workouts</span>
          </div>
          {weekProgress.gymThisWeek > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="text-lime-400/80 font-bold text-sm tabular-nums">{weekProgress.gymThisWeek}</span>
              <span className="text-white/20 text-[10px]">gym</span>
            </div>
          )}
        </div>

        {/* Remaining workouts */}
        {weekProgress.remaining.length > 0 && (
          <div className="border-t border-white/[0.04] pt-2.5">
            <p className="text-white/25 text-[10px] font-medium uppercase tracking-wider mb-2">Coming Up</p>
            <div className="space-y-1.5">
              {weekProgress.remaining.slice(0, 4).map((w, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-white/15 text-[10px] font-medium w-8 shrink-0">{w.dayName}</span>
                  <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: w.color }} />
                  <p className="text-white/50 text-[11px] truncate flex-1">{w.title}</p>
                  {w.distText && <span className="text-white/20 text-[10px] tabular-nums shrink-0">{w.distText}</span>}
                </div>
              ))}
            </div>
          </div>
        )}
      </SectionCard>

      {/* ═══ SECTION 4: Trends ═══ */}

      {/* Weekly Distance */}
      {volumeChartData.length > 0 && (
        <SectionCard delay={0.28}>
          <div className="flex items-center justify-between mb-4">
            <p className="text-white/50 text-[13px] font-medium">Weekly Distance</p>
            {weekStats[0] && (
              <div className="flex items-center gap-2">
                <span className="text-white font-semibold text-sm tabular-nums">{weekStats[0].distanceKm} km</span>
                {weekStats[1] && (() => {
                  const wow = ((weekStats[0].distanceKm - weekStats[1].distanceKm) / (weekStats[1].distanceKm || 1) * 100)
                  return (
                    <span className={`text-[10px] font-medium tabular-nums ${wow >= 0 ? 'text-emerald-400/70' : 'text-red-400/60'}`}>
                      {wow >= 0 ? '↑' : '↓'}{Math.abs(wow).toFixed(0)}%
                    </span>
                  )
                })()}
              </div>
            )}
          </div>
          <div className="h-36">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={volumeChartData}>
                <defs>
                  <linearGradient id="dashDistGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#F59E0B" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#F59E0B" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="week" axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.2)', fontSize: 10 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.2)', fontSize: 10 }} width={28} />
                <Tooltip content={<VolumeTooltip />} />
                <Area type="monotone" dataKey="distance" stroke="#F59E0B" strokeWidth={1.5} fill="url(#dashDistGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>
      )}


    </div>
  )
}

export default DashboardTab
