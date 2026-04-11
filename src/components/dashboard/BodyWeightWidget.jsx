'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { useEditMode } from '@/src/contexts/EditModeContext'
import { getSessionToken } from '@/lib/auth-client'
import { logWeight as logWeightAction } from '@/lib/actions/gym'

function getWeekNumber(dateStr) {
  const d = new Date(dateStr)
  const jan1 = new Date(d.getFullYear(), 0, 1)
  const dayOfYear = Math.floor((d - jan1) / 86400000) + 1
  return Math.ceil(dayOfYear / 7)
}

function formatWeekRange(logs) {
  if (logs.length === 0) return ''
  const dates = logs.map(l => new Date(l.date)).sort((a, b) => a - b)
  const first = dates[0]
  const last = dates[dates.length - 1]
  const fmt = d => `${d.getDate()}/${d.getMonth() + 1}`
  if (first.toDateString() === last.toDateString()) return fmt(first)
  return `${fmt(first)}–${fmt(last)}`
}

function BodyWeightWidget({ weights = [] }) {
  const { editMode } = useEditMode()
  const [mounted, setMounted] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [range, setRange] = useState('week')

  useEffect(() => { setMounted(true) }, [])

  const logs = useMemo(() =>
    weights.map(w => ({
      date: w.date,
      weightKg: w.weight_kg ?? w.weightKg,
    })),
    [weights]
  )

  const todayStr = new Date().toISOString().slice(0, 10)
  const todayWeight = logs.find(l => l.date === todayStr)?.weightKg || null

  const yesterdayWeight = useMemo(() => {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const yStr = yesterday.toISOString().slice(0, 10)
    return logs.find(l => l.date === yStr)?.weightKg || null
  }, [logs])

  const delta = todayWeight && yesterdayWeight ? +(todayWeight - yesterdayWeight).toFixed(1) : null

  async function handleSubmit(e) {
    e.preventDefault()
    const normalized = inputValue.replace(',', '.')
    const w = parseFloat(normalized)
    if (!w || w < 20 || w > 300) {
      toast.error('Enter a valid weight (20-300 kg)')
      return
    }
    const token = getSessionToken()
    if (!token) {
      toast.error('Not authenticated — unlock edit mode first')
      return
    }
    setSubmitting(true)
    try {
      const result = await logWeightAction(token, w)
      if (result.success) {
        setInputValue('')
        toast.success(`${w} kg logged`)
      } else {
        toast.error(result.error || 'Failed to save weight')
      }
    } catch (err) {
      toast.error('Network error — check your connection')
    } finally {
      setSubmitting(false)
    }
  }

  const rangeDays = range === 'week' ? 7 : range

  const chartData = useMemo(() => {
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - rangeDays)
    return logs.filter(l => new Date(l.date) >= cutoff).slice().reverse()
  }, [logs, rangeDays])

  const weeklyBreakdown = useMemo(() => {
    const source = range === 'week'
      ? logs.filter(l => {
          const cutoff = new Date()
          cutoff.setDate(cutoff.getDate() - 21)
          return new Date(l.date) >= cutoff
        }).slice().reverse()
      : chartData
    if (source.length < 2) return []
    const byWeek = new Map()
    source.forEach(l => {
      const d = new Date(l.date)
      const mon = new Date(d)
      mon.setDate(d.getDate() - ((d.getDay() + 6) % 7))
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
      const prev = weeks[i - 1].avg
      const curr = weeks[i].avg
      weeks[i].deltaKg = +(curr - prev).toFixed(1)
      weeks[i].deltaPct = +((curr - prev) / prev * 100).toFixed(2)
    }

    return weeks
  }, [chartData, range, logs])

  const thisWeekStats = useMemo(() => {
    if (weeklyBreakdown.length === 0) return null
    const current = weeklyBreakdown[weeklyBreakdown.length - 1]
    const prev = weeklyBreakdown.length >= 2 ? weeklyBreakdown[weeklyBreakdown.length - 2] : null
    if (!prev) return { avg: current.avg, deltaKg: null, deltaPct: null, targetLow: null, targetHigh: null }
    const targetLow = +(prev.avg * 1.005).toFixed(1)
    const targetHigh = +(prev.avg * 1.01).toFixed(1)
    return {
      avg: current.avg,
      deltaKg: +(current.avg - prev.avg).toFixed(1),
      deltaPct: +((current.avg - prev.avg) / prev.avg * 100).toFixed(2),
      targetLow,
      targetHigh,
    }
  }, [weeklyBreakdown])

  const currentWeekView = useMemo(() => {
    if (!thisWeekStats) return null
    const thisWeek = weeklyBreakdown[weeklyBreakdown.length - 1]
    if (!thisWeek || thisWeek.logs.length === 0) return null
    const prev = weeklyBreakdown.length >= 2 ? weeklyBreakdown[weeklyBreakdown.length - 2] : null
    return {
      avg: thisWeekStats.avg,
      prevAvg: prev ? prev.avg : null,
      targetLow: thisWeekStats.targetLow,
      targetHigh: thisWeekStats.targetHigh,
      deltaPct: thisWeekStats.deltaPct,
      deltaKg: thisWeekStats.deltaKg,
    }
  }, [weeklyBreakdown, thisWeekStats])

  const sparkPoints = useMemo(() => {
    if (chartData.length === 0) return ''
    const wts = chartData.map(l => l.weightKg)
    const min = Math.min(...wts) - 0.5
    const max = Math.max(...wts) + 0.5
    return chartData.map((l, i) => {
      const x = chartData.length === 1 ? 100 : (i / (chartData.length - 1)) * 200
      const y = max === min ? 20 : 40 - ((l.weightKg - min) / (max - min)) * 40
      return `${x},${y}`
    }).join(' ')
  }, [chartData])

  const hasData = logs.length > 0

  function pctColor(pct) {
    if (pct === null || pct === undefined) return 'text-white/30'
    if (pct >= 0.5 && pct <= 1.0) return 'text-emerald-400'
    if (pct > 0 && pct < 0.5) return 'text-yellow-400'
    if (pct > 1.0) return 'text-orange-400'
    return 'text-red-400'
  }

  function pctBg(pct) {
    if (pct === null || pct === undefined) return 'bg-white/[0.03]'
    if (pct >= 0.5 && pct <= 1.0) return 'bg-emerald-500/[0.06]'
    if (pct > 0 && pct < 0.5) return 'bg-yellow-500/[0.06]'
    if (pct > 1.0) return 'bg-orange-500/[0.06]'
    return 'bg-red-500/[0.06]'
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.5 }}
      className="bg-white/[0.03] rounded-xl border border-white/[0.05] overflow-hidden mb-3"
    >
      <div
        role="button"
        tabIndex={0}
        onClick={() => hasData && setExpanded(!expanded)}
        onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && hasData && setExpanded(!expanded)}
        className="w-full p-3 flex items-center justify-between cursor-pointer"
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
            <svg className="w-4 h-4 text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 20V10" /><path d="M18 20V4" /><path d="M6 20v-4" />
            </svg>
          </div>
          <div className="text-left min-w-0 flex-1">
            <p className="text-[10px] text-white/30 font-medium">Body Weight</p>
            {!mounted ? (
              <p className="text-white/20 text-xs">&nbsp;</p>
            ) : todayWeight ? (
              <div className="flex items-center gap-1.5 flex-wrap">
                <p className="text-white font-bold text-sm tabular-nums">{todayWeight} kg</p>
                {delta !== null && delta !== 0 && (
                  <span className={`text-[10px] font-medium tabular-nums whitespace-nowrap ${delta > 0 ? 'text-blue-400/70' : 'text-red-400/60'}`}>
                    {delta > 0 ? '↑' : '↓'}{Math.abs(delta)} vs yesterday
                  </span>
                )}
                {thisWeekStats?.deltaPct !== null && thisWeekStats?.deltaPct !== undefined && (
                  <span className={`text-[9px] font-medium tabular-nums px-1 py-0.5 rounded whitespace-nowrap ${pctBg(thisWeekStats.deltaPct)} ${pctColor(thisWeekStats.deltaPct)}`}>
                    {thisWeekStats.deltaPct > 0 ? '+' : ''}{thisWeekStats.deltaPct}%/w
                  </span>
                )}
              </div>
            ) : (
              <p className="text-white/20 text-xs">Not logged today</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {mounted && hasData && sparkPoints && (
            <svg width="80" height="24" viewBox="0 0 200 40" className="opacity-30">
              <polyline points={sparkPoints} fill="none" stroke="currentColor" className="text-blue-400" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}

          {mounted && editMode && !todayWeight && (
            <form onSubmit={handleSubmit} onClick={e => e.stopPropagation()} className="flex items-center gap-1.5">
              <input
                type="text"
                inputMode="decimal"
                pattern="[0-9]*[.,]?[0-9]*"
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                placeholder="kg"
                className="w-16 bg-white/[0.06] rounded-lg px-2 py-1.5 text-xs text-white text-center font-medium tabular-nums placeholder:text-white/15 focus:outline-none focus:ring-1 focus:ring-blue-500/30"
              />
              <button
                type="submit"
                disabled={submitting}
                className="min-w-[36px] min-h-[36px] w-9 h-9 rounded-lg bg-blue-500/15 text-blue-400 flex items-center justify-center hover:bg-blue-500/25 active:scale-95 transition-all disabled:opacity-40"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </button>
            </form>
          )}

          {mounted && hasData && (
            <motion.svg
              animate={{ rotate: expanded ? 180 : 0 }}
              className="w-4 h-4 text-white/15"
              viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            >
              <polyline points="6 9 12 15 18 9" />
            </motion.svg>
          )}
        </div>
      </div>

      <AnimatePresence>
        {expanded && hasData && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 border-t border-white/[0.04] pt-3">
              <div className="flex gap-1 mb-3">
                {['week', 30, 90, 365].map(d => (
                  <button
                    key={d}
                    onClick={() => setRange(d)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-medium transition-colors ${
                      range === d ? 'bg-blue-500/15 text-blue-400' : 'bg-white/[0.04] text-white/25'
                    }`}
                  >
                    {d === 'week' ? 'This Week' : d === 365 ? 'All' : `${d}d`}
                  </button>
                ))}
              </div>

              {chartData.length > 1 && (
                <div className="mb-3">
                  <WeightChart data={chartData} range={rangeDays} />
                </div>
              )}

              {range === 'week' ? (
                currentWeekView && currentWeekView.prevAvg && (
                  <WeekProgressBar data={currentWeekView} pctColor={pctColor} pctBg={pctBg} />
                )
              ) : (
                <>
                  {weeklyBreakdown.length > 0 && (() => {
                    const visible = [...weeklyBreakdown].filter(w => w.days >= 2).reverse()
                    return (
                      <div className="mb-3">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-[10px] text-white/30 font-medium uppercase tracking-wider">Weekly Breakdown</p>
                          <p className="text-[9px] text-white/15">Target: 0.5–1%/week</p>
                        </div>
                        <div className="space-y-1">
                          {visible.map((week, i) => (
                            <div key={i} className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg ${pctBg(week.deltaPct)}`}>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] text-white/25 tabular-nums w-[70px]">{week.range}</span>
                                <span className="text-xs text-white font-semibold tabular-nums">{week.avg} kg</span>
                              </div>
                              <div className="flex items-center gap-2">
                                {week.deltaKg !== undefined && (
                                  <span className="text-[10px] text-white/30 tabular-nums">
                                    {week.deltaKg > 0 ? '+' : ''}{week.deltaKg} kg
                                  </span>
                                )}
                                {week.deltaPct !== undefined ? (
                                  <span className={`text-[10px] font-bold tabular-nums min-w-[42px] text-right ${pctColor(week.deltaPct)}`}>
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
                    <div className="grid grid-cols-3 gap-2">
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
                      <div className={`text-center rounded-lg py-1.5 ${pctBg(thisWeekStats.deltaPct)}`}>
                        <p className={`font-bold text-xs tabular-nums ${pctColor(thisWeekStats.deltaPct)}`}>
                          {thisWeekStats.deltaPct !== null ? `${thisWeekStats.deltaPct > 0 ? '+' : ''}${thisWeekStats.deltaPct}%` : '—'}
                        </p>
                        <p className="text-[9px] text-white/20">Weekly %</p>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

function WeekProgressBar({ data, pctColor, pctBg }) {
  const { avg, prevAvg, targetLow, targetHigh, deltaPct, deltaKg } = data
  const margin = 0.6
  const barMin = Math.min(prevAvg, avg, targetLow || prevAvg) - margin
  const barMax = Math.max(prevAvg, avg, targetHigh || prevAvg) + margin
  const barRange = barMax - barMin || 1

  const w = 300, h = 56, padL = 8, padR = 8
  const trackY = 18, trackH = 6, trackW = w - padL - padR
  const toX = val => padL + ((val - barMin) / barRange) * trackW

  const prevX = toX(prevAvg)
  const avgX = toX(avg)
  const goalLX = targetLow ? toX(targetLow) : null
  const goalHX = targetHigh ? toX(targetHigh) : null

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between mb-0.5">
        <p className="text-[10px] text-white/30 font-medium uppercase tracking-wider">This Week</p>
        {deltaPct !== null && (
          <span className={`text-[10px] font-bold tabular-nums px-1.5 py-0.5 rounded ${pctBg(deltaPct)} ${pctColor(deltaPct)}`}>
            {deltaPct > 0 ? '+' : ''}{deltaPct}%
          </span>
        )}
      </div>
      <svg width="100%" viewBox={`0 0 ${w} ${h}`} className="overflow-visible">
        <defs>
          <linearGradient id="progFill" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="rgb(96,165,250)" stopOpacity="0.15" />
            <stop offset="100%" stopColor="rgb(96,165,250)" stopOpacity="0.5" />
          </linearGradient>
        </defs>

        <rect x={padL} y={trackY} width={trackW} height={trackH} rx={trackH / 2} fill="white" fillOpacity="0.04" />

        {goalLX !== null && (
          <rect x={goalLX} y={trackY - 1} width={goalHX - goalLX} height={trackH + 2} rx={2} fill="rgb(52,211,153)" fillOpacity="0.12" stroke="rgb(52,211,153)" strokeOpacity="0.2" strokeWidth="0.5" />
        )}

        <rect x={padL} y={trackY} width={Math.max(0, avgX - padL)} height={trackH} rx={trackH / 2} fill="url(#progFill)" />

        <line x1={prevX} y1={trackY - 3} x2={prevX} y2={trackY + trackH + 3} stroke="white" strokeOpacity="0.15" strokeWidth="1" strokeDasharray="2 2" />
        <text x={prevX} y={trackY + trackH + 14} textAnchor="middle" fill="white" fillOpacity="0.2" fontSize="7" fontFamily="monospace">{prevAvg}</text>
        <text x={prevX} y={trackY + trackH + 22} textAnchor="middle" fill="white" fillOpacity="0.12" fontSize="6" fontFamily="monospace">prev</text>

        <circle cx={avgX} cy={trackY + trackH / 2} r="5" fill="rgb(96,165,250)" />
        <circle cx={avgX} cy={trackY + trackH / 2} r="7" fill="none" stroke="rgb(96,165,250)" strokeOpacity="0.2" strokeWidth="1" />
        <text x={avgX} y={trackY - 6} textAnchor="middle" fill="white" fillOpacity="0.8" fontSize="9" fontWeight="bold" fontFamily="monospace">{avg}</text>

        {goalLX !== null && (
          <>
            <text x={(goalLX + goalHX) / 2} y={trackY + trackH + 14} textAnchor="middle" fill="rgb(52,211,153)" fillOpacity="0.4" fontSize="7" fontFamily="monospace">{targetLow}–{targetHigh}</text>
            <text x={(goalLX + goalHX) / 2} y={trackY + trackH + 22} textAnchor="middle" fill="rgb(52,211,153)" fillOpacity="0.25" fontSize="6" fontFamily="monospace">goal</text>
          </>
        )}
      </svg>
      <p className="text-[9px] text-white/15 text-center tabular-nums">
        Avg {avg} kg · {deltaKg !== null ? `${deltaKg > 0 ? '+' : ''}${deltaKg} kg vs last week` : 'first week'}
      </p>
    </div>
  )
}

function WeightChart({ data, range }) {
  if (data.length < 2) return null
  const wts = data.map(d => d.weightKg)
  const min = Math.min(...wts) - 0.3
  const max = Math.max(...wts) + 0.3
  const yRange = max - min || 1
  const w = 300, h = 110, padL = 28, padR = 8, padT = 8, padB = 20
  const chartW = w - padL - padR
  const chartH = h - padT - padB

  const points = data.map((d, i) => ({
    x: padL + (i / (data.length - 1)) * chartW,
    y: padT + (1 - (d.weightKg - min) / yRange) * chartH,
    kg: d.weightKg,
    date: d.date,
  }))

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ')
  const areaD = `${pathD} L${points.at(-1).x},${padT + chartH} L${points[0].x},${padT + chartH} Z`

  const gridLines = 4
  const yLabels = Array.from({ length: gridLines + 1 }, (_, i) => {
    const val = min + (yRange / gridLines) * i
    return { val: Math.round(val * 10) / 10, y: padT + (1 - i / gridLines) * chartH }
  })

  const xLabelCount = range <= 7 ? data.length : range <= 30 ? 5 : 4
  const xStep = Math.max(1, Math.floor((data.length - 1) / (xLabelCount - 1)))
  const xLabels = []
  for (let i = 0; i < data.length; i += xStep) {
    const d = new Date(data[i].date)
    const label = range <= 7
      ? ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][d.getDay()]
      : `${d.getDate()}/${d.getMonth() + 1}`
    xLabels.push({ x: points[i].x, label })
  }

  return (
    <svg width="100%" viewBox={`0 0 ${w} ${h}`} className="overflow-visible">
      <defs>
        <linearGradient id="bwGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgb(96,165,250)" stopOpacity="0.15" />
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

      <path d={areaD} fill="url(#bwGrad)" />
      <path d={pathD} fill="none" stroke="rgb(96,165,250)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={points.at(-1).x} cy={points.at(-1).y} r="3.5" fill="rgb(96,165,250)" />
      <text x={points.at(-1).x} y={points.at(-1).y - 6} textAnchor="middle" fill="white" fillOpacity="0.7" fontSize="8" fontWeight="bold" fontFamily="monospace">{points.at(-1).kg}</text>
    </svg>
  )
}

export default BodyWeightWidget
