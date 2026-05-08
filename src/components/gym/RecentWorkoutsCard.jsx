'use client'

import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

function formatDateTime(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ''
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const hh = String(d.getHours()).padStart(2, '0')
  const mi = String(d.getMinutes()).padStart(2, '0')
  return `${dd}/${mm} ${hh}:${mi}`
}

function formatDay(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ''
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  return `${dd}/${mm}`
}

function localDayFromDate(date) {
  const d = new Date(date)
  if (isNaN(d.getTime())) return ''
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

function localDayFromIso(iso) {
  if (!iso) return ''
  return localDayFromDate(new Date(iso))
}

function formatIsoDayDM(dayIso) {
  // dayIso: YYYY-MM-DD -> DD/MM (e.g. 2026-04-30 -> 30/04)
  if (!dayIso || typeof dayIso !== 'string' || dayIso.length < 10) return ''
  const y = dayIso.slice(0, 4)
  const m = dayIso.slice(5, 7)
  const d = dayIso.slice(8, 10)
  if (!/^\d{4}$/.test(y) || !/^\d{2}$/.test(m) || !/^\d{2}$/.test(d)) return ''
  return `${d}/${m}`
}

function computeSessionStats(session) {
  const logs = session?.exercise_logs || session?.exerciseLogs || []
  const totalVolume = logs.reduce((s, l) => s + (l.weight_kg ?? l.weightKg ?? 0) * (l.reps ?? 0), 0)
  const totalSets = logs.length
  const dur = session.duration_sec ?? session.durationSeconds ?? 0
  return { totalVolume, totalSets, dur }
}

function computeRunStats(workout) {
  const meters = parseFloat(workout?.DistanceInMeters) || 0
  const km = meters > 0 ? meters / 1000 : 0
  const hours = parseFloat(workout?.TimeTotalInHours) || 0
  const mins = hours > 0 ? Math.round(hours * 60) : 0
  return { km, mins }
}

function groupLogsByExercise(session) {
  const logs = session?.exercise_logs || session?.exerciseLogs || []
  const map = new Map()
  for (const l of logs) {
    const key = l.exercise_key || l.exerciseKey
    if (!key) continue
    if (!map.has(key)) map.set(key, [])
    map.get(key).push(l)
  }
  for (const [, arr] of map) {
    arr.sort((a, b) => (a.set_number ?? a.setNumber ?? 0) - (b.set_number ?? b.setNumber ?? 0))
  }
  return map
}

function clamp01(x) {
  return Math.max(0, Math.min(1, x))
}

function hexToRgb(hex) {
  if (!hex || typeof hex !== 'string') return null
  const h = hex.trim().replace('#', '')
  if (h.length === 3) {
    const r = parseInt(h[0] + h[0], 16)
    const g = parseInt(h[1] + h[1], 16)
    const b = parseInt(h[2] + h[2], 16)
    if ([r, g, b].some(v => Number.isNaN(v))) return null
    return { r, g, b }
  }
  if (h.length === 6) {
    const r = parseInt(h.slice(0, 2), 16)
    const g = parseInt(h.slice(2, 4), 16)
    const b = parseInt(h.slice(4, 6), 16)
    if ([r, g, b].some(v => Number.isNaN(v))) return null
    return { r, g, b }
  }
  return null
}

function rgba({ r, g, b }, a) {
  return `rgba(${r}, ${g}, ${b}, ${a})`
}

function heatStyle(level, baseHex) {
  const l = Math.max(0, Math.min(4, level))
  if (l === 0) {
    return {
      backgroundColor: 'rgba(255,255,255,0.04)',
      borderColor: 'rgba(255,255,255,0.06)',
    }
  }

  const rgb = hexToRgb(baseHex) || { r: 16, g: 185, b: 129 } // fallback emerald
  const fills = [0, 0.16, 0.28, 0.42, 0.62]
  const borders = [0, 0.24, 0.30, 0.40, 0.55]
  return {
    backgroundColor: rgba(rgb, fills[l]),
    borderColor: rgba(rgb, borders[l]),
  }
}

function RecentWorkoutModal({ open, onClose, session, template }) {
  if (!open || !session) return null

  const color = template?.color || '#60A5FA'
  const title = template?.name || session.template_id || 'Workout'
  const time = formatDateTime(session.finished_at || session.started_at)
  const { totalVolume, totalSets, dur } = computeSessionStats(session)
  const logsByExercise = groupLogsByExercise(session)

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[70] bg-black/70 backdrop-blur-sm flex items-center justify-center p-5"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, y: 20, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.95, y: 20, opacity: 0 }}
        transition={{ type: 'spring', damping: 26, stiffness: 320 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-md bg-[#161B22] border border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden"
      >
        <div className="px-4 py-3 border-b border-white/[0.06] flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
              <h3 className="text-white font-bold text-sm truncate">{title}</h3>
            </div>
            <p className="text-white/20 text-[11px] mt-0.5 tabular-nums">{time}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white/30 hover:text-white/60 hover:bg-white/[0.06] transition-colors"
            aria-label="Close"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="px-4 py-3">
          <div className="grid grid-cols-3 gap-2 mb-3">
            <div className="text-center bg-white/[0.03] rounded-xl py-2">
              <p className="text-white font-bold text-xs tabular-nums">{totalSets}</p>
              <p className="text-[9px] text-white/20">Sets</p>
            </div>
            <div className="text-center bg-white/[0.03] rounded-xl py-2">
              <p className="text-white font-bold text-xs tabular-nums">{Math.round(totalVolume).toLocaleString()}</p>
              <p className="text-[9px] text-white/20">Volume</p>
            </div>
            <div className="text-center bg-white/[0.03] rounded-xl py-2">
              <p className="text-white font-bold text-xs tabular-nums">{dur ? `${Math.round(dur / 60)}m` : '—'}</p>
              <p className="text-[9px] text-white/20">Time</p>
            </div>
          </div>

          {logsByExercise.size > 0 && (
            <div className="space-y-2 max-h-[55vh] overflow-y-auto pr-1">
              {Array.from(logsByExercise.entries()).map(([exKey, logs]) => (
                <div key={exKey} className="bg-white/[0.03] border border-white/[0.05] rounded-xl px-3 py-2">
                  <div className="flex items-center gap-2">
                    <div className="w-1 h-4 rounded-full" style={{ backgroundColor: color, opacity: 0.7 }} />
                    <p className="text-white/70 text-xs font-medium truncate flex-1">{exKey.replace(/_/g, ' ')}</p>
                  </div>
                  <div className="flex gap-1.5 mt-1.5 flex-wrap ml-3">
                    {logs.map((l, i) => (
                      <span key={i} className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/[0.05] text-white/50">
                        {(l.weight_kg ?? l.weightKg ?? 0)}<span className="text-white/25">kg</span>×{(l.reps ?? 0)}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}

function DaySummaryModal({ open, onClose, dayIso, sessions = [], runWorkouts = [], templatesById }) {
  if (!open || !dayIso) return null

  const title = formatIsoDayDM(dayIso)
  const daySessions = sessions
    .filter(s => localDayFromIso(s.finished_at || s.started_at) === dayIso)
    .sort((a, b) => String(b.finished_at || b.started_at).localeCompare(String(a.finished_at || a.started_at)))

  const dayRuns = runWorkouts
    .filter(w => (w.WorkoutDay || '').slice(0, 10) === dayIso)
    .sort((a, b) => String(b.WorkoutDay || '').localeCompare(String(a.WorkoutDay || '')))

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[70] bg-black/70 backdrop-blur-sm flex items-center justify-center p-5"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, y: 20, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.95, y: 20, opacity: 0 }}
        transition={{ type: 'spring', damping: 26, stiffness: 320 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-md bg-[#161B22] border border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden"
      >
        <div className="px-4 py-3 border-b border-white/[0.06] flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-white font-bold text-sm truncate">{title}</h3>
            <p className="text-white/20 text-[11px] mt-0.5">{daySessions.length} session{daySessions.length === 1 ? '' : 's'}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white/30 hover:text-white/60 hover:bg-white/[0.06] transition-colors"
            aria-label="Close"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="px-4 py-3 space-y-2 max-h-[70vh] overflow-y-auto">
          {dayRuns.map((w, idx) => {
            const { km, mins } = computeRunStats(w)
            const name = w.Title || 'Run'
            return (
              <div key={`run-${idx}`} className="bg-white/[0.03] border border-white/[0.06] rounded-xl px-3 py-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-pink-400" />
                  <p className="text-white/80 text-xs font-semibold truncate flex-1">{name}</p>
                  <p className="text-white/20 text-[10px] tabular-nums">{formatDay(w.WorkoutDay)}</p>
                </div>
                <div className="mt-1.5 grid grid-cols-2 gap-2">
                  <div className="text-center bg-white/[0.03] rounded-lg py-1.5">
                    <p className="text-white/80 font-bold text-[11px] tabular-nums">{km ? km.toFixed(1) : '—'}</p>
                    <p className="text-[9px] text-white/20">km</p>
                  </div>
                  <div className="text-center bg-white/[0.03] rounded-lg py-1.5">
                    <p className="text-white/80 font-bold text-[11px] tabular-nums">{mins ? `${mins}m` : '—'}</p>
                    <p className="text-[9px] text-white/20">Time</p>
                  </div>
                </div>
              </div>
            )
          })}

          {daySessions.map(s => {
            const tid = s.template_id || s.templateId
            const t = templatesById.get(tid)
            const color = t?.color || '#60A5FA'
            const name = t?.name || tid
            const time = formatDateTime(s.finished_at || s.started_at)
            const { totalVolume, totalSets, dur } = computeSessionStats(s)

            return (
              <div key={s.id} className="bg-white/[0.03] border border-white/[0.06] rounded-xl px-3 py-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                  <p className="text-white/80 text-xs font-semibold truncate flex-1">{name}</p>
                  <p className="text-white/20 text-[10px] tabular-nums">{time}</p>
                </div>
                <div className="mt-1.5 grid grid-cols-3 gap-2">
                  <div className="text-center bg-white/[0.03] rounded-lg py-1.5">
                    <p className="text-white/80 font-bold text-[11px] tabular-nums">{totalSets}</p>
                    <p className="text-[9px] text-white/20">Sets</p>
                  </div>
                  <div className="text-center bg-white/[0.03] rounded-lg py-1.5">
                    <p className="text-white/80 font-bold text-[11px] tabular-nums">{Math.round(totalVolume).toLocaleString()}</p>
                    <p className="text-[9px] text-white/20">Volume</p>
                  </div>
                  <div className="text-center bg-white/[0.03] rounded-lg py-1.5">
                    <p className="text-white/80 font-bold text-[11px] tabular-nums">{dur ? `${Math.round(dur / 60)}m` : '—'}</p>
                    <p className="text-[9px] text-white/20">Time</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </motion.div>
    </motion.div>
  )
}

export default function RecentWorkoutsCard({ templates = [], sessions = [], runWorkouts = [], count = 5 }) {
  const [activeId, setActiveId] = useState(null)
  const [activeDay, setActiveDay] = useState(null)
  const [hoverDay, setHoverDay] = useState(null)

  const templatesById = useMemo(() => {
    const map = new Map()
    for (const t of templates) map.set(t.id, t)
    return map
  }, [templates])

  const completedSessions = useMemo(() => {
    return sessions.filter(s => (s.finished_at || s.finishedAt) && (s.template_id || s.templateId))
  }, [sessions])

  const recent = useMemo(() => completedSessions.slice(0, count), [completedSessions, count])

  const activeSession = useMemo(() => recent.find(s => s.id === activeId) || null, [recent, activeId])
  const activeTemplate = activeSession ? templatesById.get(activeSession.template_id || activeSession.templateId) : null

  // Heatmap: last 8 weeks (strength from DB + runs from other sources)
  // NOTE: must be called before any early returns to satisfy Rules of Hooks
  const heat = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    // Align to calendar weeks starting Monday (GitHub-style columns)
    const rangeDays = 56
    const start = new Date(today)
    start.setDate(start.getDate() - (rangeDays - 1))
    // Move start back to Monday
    const startDow = (start.getDay() + 6) % 7 // Mon=0..Sun=6
    start.setDate(start.getDate() - startDow)

    const days = []
    for (let d = new Date(start); d <= today; d.setDate(d.getDate() + 1)) {
      days.push(new Date(d))
    }

    const strengthByDay = new Map()
    for (const s of completedSessions) {
      const day = localDayFromIso(s.finished_at || s.started_at)
      if (!day) continue
      if (!strengthByDay.has(day)) strengthByDay.set(day, [])
      strengthByDay.get(day).push(s)
    }

    const runByDay = new Map()
    for (const w of runWorkouts || []) {
      const day = (w.WorkoutDay || '').slice(0, 10)
      if (!day) continue
      if (!runByDay.has(day)) runByDay.set(day, [])
      runByDay.get(day).push(w)
    }

    // Strength intensity: volume
    const strengthTotals = []
    for (const d of days) {
      const key = localDayFromDate(d)
      const list = strengthByDay.get(key) || []
      const vol = list.reduce((sum, s) => sum + computeSessionStats(s).totalVolume, 0)
      strengthTotals.push(vol)
    }

    // Run intensity: km (distance)
    const runTotalsKm = []
    for (const d of days) {
      const key = localDayFromDate(d)
      const list = runByDay.get(key) || []
      const km = list.reduce((sum, w) => sum + computeRunStats(w).km, 0)
      runTotalsKm.push(km)
    }

    const strengthNonZero = strengthTotals.filter(v => v > 0).sort((a, b) => a - b)
    const strengthP85 = strengthNonZero.length ? strengthNonZero[Math.floor(strengthNonZero.length * 0.85)] : 1
    const strengthScaleMax = Math.max(1, strengthP85 || 1)

    const runNonZero = runTotalsKm.filter(v => v > 0).sort((a, b) => a - b)
    const runP85 = runNonZero.length ? runNonZero[Math.floor(runNonZero.length * 0.85)] : 1
    const runScaleMax = Math.max(1, runP85 || 1)

    const cells = days.map((d, idx) => {
      const key = localDayFromDate(d)
      const strengthList = strengthByDay.get(key) || []
      const runList = runByDay.get(key) || []
      const strengthVol = strengthTotals[idx]
      const runKm = runTotalsKm[idx]

      const hasStrength = strengthList.length > 0
      const hasRun = runList.length > 0

      const level = (() => {
        if (!hasStrength && !hasRun) return 0
        if (hasStrength) {
          const norm = clamp01(strengthVol / strengthScaleMax)
          return norm < 0.25 ? 1 : norm < 0.5 ? 2 : norm < 0.75 ? 3 : 4
        }
        const norm = clamp01(runKm / runScaleMax)
        return norm < 0.25 ? 1 : norm < 0.5 ? 2 : norm < 0.75 ? 3 : 4
      })()

      // Pick a representative template (dominant by volume) for the day's color
      let dominantColor = null
      if (hasStrength) {
        let dominantTemplateId = null
        let dominantVol = -1
        for (const s of strengthList) {
          const v = computeSessionStats(s).totalVolume
          if (v > dominantVol) {
            dominantVol = v
            dominantTemplateId = s.template_id || s.templateId
          }
        }
        const dominantTemplate = dominantTemplateId ? templatesById.get(dominantTemplateId) : null
        dominantColor = dominantTemplate?.color || null
      } else if (hasRun) {
        dominantColor = '#EC4899'
      }

      const templates = [
        ...strengthList.map(s => {
          const tid = s.template_id || s.templateId
          const t = templatesById.get(tid)
          return t?.name || tid
        }),
        ...(hasRun ? ['Run'] : []),
      ].filter(Boolean)

      return {
        dayIso: key,
        dow: (d.getDay() + 6) % 7, // Mon=0...Sun=6 (GitHub-ish)
        week: Math.floor(idx / 7),
        level,
        sessionsCount: strengthList.length + runList.length,
        strengthCount: strengthList.length,
        runCount: runList.length,
        strengthVolume: strengthVol,
        runKm,
        templates,
        dominantColor,
      }
    })

    // Legend: choose the most common dominant color in the period
    const colorCounts = new Map()
    for (const c of cells) {
      if (!c.dominantColor || c.level === 0) continue
      colorCounts.set(c.dominantColor, (colorCounts.get(c.dominantColor) || 0) + 1)
    }
    let legendColor = null
    let best = -1
    for (const [col, n] of colorCounts.entries()) {
      if (n > best) { best = n; legendColor = col }
    }

    const weeksCount = Math.ceil(days.length / 7)
    return { cells, strengthScaleMax, runScaleMax, legendColor, start, weeksCount }
  }, [completedSessions, templatesById, runWorkouts])

  const cellsByWeek = useMemo(() => {
    const weeks = []
    for (let w = 0; w < heat.weeksCount; w++) {
      const col = Array.from({ length: 7 }, () => null)
      weeks.push(col)
    }
    for (const c of heat.cells) {
      if (c.week >= 0 && c.week < heat.weeksCount) weeks[c.week][c.dow] = c
    }
    return weeks
  }, [heat.cells, heat.weeksCount])

  const monthLabels = useMemo(() => {
    const labels = []
    const fmt = new Intl.DateTimeFormat('en', { month: 'short' })
    let prev = null
    for (let w = 0; w < heat.weeksCount; w++) {
      const d = new Date(heat.start)
      d.setDate(d.getDate() + w * 7)
      const m = fmt.format(d)
      labels.push(m !== prev ? m : '')
      prev = m
    }
    return labels
  }, [heat.start, heat.weeksCount])

  if (recent.length === 0) return null

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-2 px-0.5">
        <div className="flex items-center gap-2">
          <p className="text-[10px] text-white/30 font-medium uppercase tracking-wider">Training</p>
          <span className="text-[9px] text-white/15">last 8 weeks</span>
        </div>
        <span className="text-[9px] text-white/12">&nbsp;</span>
      </div>

      <div className="relative rounded-2xl border border-white/[0.06] bg-white/[0.02] px-3 py-3 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none opacity-[0.35]" style={{
          backgroundImage: 'radial-gradient(circle at 20% 0%, rgba(16,185,129,0.10), transparent 45%), radial-gradient(circle at 80% 100%, rgba(16,185,129,0.08), transparent 50%)',
        }} />

        <div className="relative">
          {(() => {
            const cellPx = 12
            const gapPx = 6
            const labelPx = 28

            return (
              <>
                {/* Month labels (aligned to columns) */}
                <div
                  className="grid mb-2"
                  style={{
                    gap: `${gapPx}px`,
                    gridTemplateColumns: `${labelPx}px repeat(${heat.weeksCount}, ${cellPx}px)`,
                  }}
                >
                  <div />
                  {monthLabels.map((m, i) => (
                    <div key={i} className="h-3 flex items-center">
                      {m ? <span className="text-[9px] text-white/15">{m}</span> : null}
                    </div>
                  ))}
                </div>

                <div className="grid items-start" style={{ gridTemplateColumns: `${labelPx}px 1fr`, gap: `${gapPx}px` }}>
                  {/* Day labels */}
                  <div className="pt-[1px]" style={{ display: 'grid', gridTemplateRows: `repeat(7, ${cellPx}px)`, gap: `${gapPx}px` }}>
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d, idx) => (
                      <div key={d} className={`flex items-center ${idx % 2 === 0 ? '' : 'opacity-0'}`}>
                        <span className="text-[9px] text-white/15">{d}</span>
                      </div>
                    ))}
                  </div>

                  {/* Heat grid (true grid so it can't drift) */}
                  <div
                    className="grid"
                    style={{
                      gridTemplateColumns: `repeat(${heat.weeksCount}, ${cellPx}px)`,
                      gridTemplateRows: `repeat(7, ${cellPx}px)`,
                      gap: `${gapPx}px`,
                      width: 'fit-content',
                    }}
                  >
                    {cellsByWeek.map((week, w) =>
                      week.map((cell, r) => {
                        const dayIso = cell?.dayIso
                        const label = cell
                          ? `${cell.templates.join(', ') || 'Workout'} • ${cell.sessionsCount} session${cell.sessionsCount === 1 ? '' : 's'}`
                          : ''
                        const style = heatStyle(cell?.level || 0, cell?.dominantColor || heat.legendColor)

                        return (
                          <button
                            key={`${w}-${r}`}
                            type="button"
                            onClick={() => dayIso && setActiveDay(dayIso)}
                            onMouseEnter={() => dayIso && setHoverDay(dayIso)}
                            onMouseLeave={() => setHoverDay(prev => (prev === dayIso ? null : prev))}
                            onFocus={() => dayIso && setHoverDay(dayIso)}
                            onBlur={() => setHoverDay(prev => (prev === dayIso ? null : prev))}
                            className="rounded-[3px] border hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-white/10 transition"
                            style={{
                              ...style,
                              gridColumn: w + 1,
                              gridRow: r + 1,
                            }}
                            aria-label={dayIso ? `${dayIso} ${label}` : 'No workout'}
                            title={dayIso ? `${formatIsoDayDM(dayIso)} • ${label}` : ''}
                          />
                        )
                      })
                    )}
                  </div>
                </div>
              </>
            )
          })()}

          {/* Hover card */}
          <AnimatePresence>
            {hoverDay && (() => {
              const cell = heat.cells.find(c => c.dayIso === hoverDay)
              if (!cell) return null
              const title = formatIsoDayDM(hoverDay)
              const tmpl = cell.templates.slice(0, 3)
              const more = cell.templates.length - tmpl.length
              return (
                <motion.div
                  initial={{ opacity: 0, y: 6, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.98 }}
                  transition={{ duration: 0.14 }}
                  className="absolute right-3 top-3 pointer-events-none"
                >
                  <div className="bg-[#0D1117] border border-white/[0.10] rounded-xl px-3 py-2 shadow-2xl shadow-black/60 min-w-[220px]">
                    <div className="flex items-center justify-between">
                      <p className="text-white text-[11px] font-semibold">{title}</p>
                      <p className="text-white/25 text-[10px] tabular-nums">{cell.sessionsCount}x</p>
                    </div>
                    <p className="text-white/25 text-[10px] mt-1">
                      {tmpl.join(' · ')}{more > 0 ? ` +${more}` : ''}
                    </p>
                    <div className="mt-1 space-y-0.5">
                      {cell.strengthCount > 0 && (
                        <p className="text-white/15 text-[9px] tabular-nums">
                          Strength vol {Math.round(cell.strengthVolume).toLocaleString()}
                        </p>
                      )}
                      {cell.runCount > 0 && (
                        <p className="text-white/15 text-[9px] tabular-nums">
                          Run {cell.runKm.toFixed(1)} km
                        </p>
                      )}
                    </div>
                  </div>
                </motion.div>
              )
            })()}
          </AnimatePresence>
        </div>
      </div>

      <AnimatePresence>
        {activeSession && (
          <RecentWorkoutModal
            open={!!activeSession}
            onClose={() => setActiveId(null)}
            session={activeSession}
            template={activeTemplate}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {activeDay && (
          <DaySummaryModal
            open={!!activeDay}
            onClose={() => setActiveDay(null)}
            dayIso={activeDay}
            sessions={completedSessions}
            runWorkouts={runWorkouts}
            templatesById={templatesById}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

