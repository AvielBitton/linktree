'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useEditMode } from '@/src/contexts/EditModeContext'
import { getSessionToken } from '@/lib/auth-client'
import { logWeight as logWeightAction } from '@/lib/actions/gym'

function BodyWeightWidget({ weights = [] }) {
  const { editMode } = useEditMode()
  const [mounted, setMounted] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const [expanded, setExpanded] = useState(false)
  const [range, setRange] = useState(30)

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

  const stats = useMemo(() => {
    if (logs.length === 0) return null
    const all = logs.map(l => l.weightKg)
    const current = all[0]
    const lowest = Math.min(...all)
    const highest = Math.max(...all)
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - 30)
    const recent = logs.filter(l => new Date(l.date) >= cutoff)
    const avg30 = recent.length > 0 ? +(recent.reduce((s, l) => s + l.weightKg, 0) / recent.length).toFixed(1) : null
    return { current, lowest, highest, avg30: avg30 || '—' }
  }, [logs])

  const yesterdayWeight = useMemo(() => {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const yStr = yesterday.toISOString().slice(0, 10)
    return logs.find(l => l.date === yStr)?.weightKg || null
  }, [logs])

  const delta = todayWeight && yesterdayWeight ? +(todayWeight - yesterdayWeight).toFixed(1) : null

  async function handleSubmit(e) {
    e.preventDefault()
    const w = parseFloat(inputValue)
    if (!w || w < 20 || w > 300) return
    const token = getSessionToken()
    if (!token) return
    const result = await logWeightAction(token, w)
    if (result.success) {
      setInputValue('')
    }
  }

  const chartData = useMemo(() => {
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - range)
    return logs.filter(l => new Date(l.date) >= cutoff).slice().reverse()
  }, [logs, range])

  const sparkPoints = useMemo(() => {
    if (chartData.length === 0) return ''
    const weights = chartData.map(l => l.weightKg)
    const min = Math.min(...weights) - 0.5
    const max = Math.max(...weights) + 0.5
    return chartData.map((l, i) => {
      const x = chartData.length === 1 ? 100 : (i / (chartData.length - 1)) * 200
      const y = max === min ? 20 : 40 - ((l.weightKg - min) / (max - min)) * 40
      return `${x},${y}`
    }).join(' ')
  }, [chartData])

  const hasData = logs.length > 0

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
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center">
            <svg className="w-4 h-4 text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 20V10" /><path d="M18 20V4" /><path d="M6 20v-4" />
            </svg>
          </div>
          <div className="text-left">
            <p className="text-[10px] text-white/30 font-medium">Body Weight</p>
            {!mounted ? (
              <p className="text-white/20 text-xs">&nbsp;</p>
            ) : todayWeight ? (
              <div className="flex items-center gap-1.5">
                <p className="text-white font-bold text-sm tabular-nums">{todayWeight} kg</p>
                {delta !== null && delta !== 0 && (
                  <span className={`text-[10px] font-medium tabular-nums ${delta > 0 ? 'text-red-400/60' : 'text-emerald-400/60'}`}>
                    {delta > 0 ? '↑' : '↓'}{Math.abs(delta)}
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
                type="number"
                inputMode="decimal"
                step="0.1"
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                placeholder="kg"
                className="w-16 bg-white/[0.06] rounded-lg px-2 py-1.5 text-xs text-white text-center font-medium tabular-nums placeholder:text-white/15 focus:outline-none focus:ring-1 focus:ring-blue-500/30 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <button
                type="submit"
                className="w-7 h-7 rounded-lg bg-blue-500/15 text-blue-400 flex items-center justify-center hover:bg-blue-500/25 active:scale-95 transition-all"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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
                {[30, 90, 365].map(d => (
                  <button
                    key={d}
                    onClick={() => setRange(d)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-medium transition-colors ${
                      range === d ? 'bg-blue-500/15 text-blue-400' : 'bg-white/[0.04] text-white/25'
                    }`}
                  >
                    {d === 365 ? 'All' : `${d}d`}
                  </button>
                ))}
              </div>

              {chartData.length > 1 && (
                <div className="mb-3">
                  <WeightChart data={chartData} />
                </div>
              )}

              {stats && (
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { label: 'Current', value: stats.current },
                    { label: 'Low', value: stats.lowest },
                    { label: 'High', value: stats.highest },
                    { label: 'Avg 30d', value: stats.avg30 || '—' },
                  ].map(s => (
                    <div key={s.label} className="text-center">
                      <p className="text-white font-bold text-xs tabular-nums">{s.value}</p>
                      <p className="text-[10px] text-white/20">{s.label}</p>
                    </div>
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

function WeightChart({ data }) {
  if (data.length < 2) return null
  const weights = data.map(d => d.weightKg)
  const min = Math.min(...weights) - 0.5
  const max = Math.max(...weights) + 0.5
  const range = max - min || 1
  const w = 280, h = 80, pad = 4

  const points = data.map((d, i) => ({
    x: pad + (i / (data.length - 1)) * (w - 2 * pad),
    y: pad + (1 - (d.weightKg - min) / range) * (h - 2 * pad),
  }))

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ')
  const areaD = `${pathD} L${points.at(-1).x},${h} L${points[0].x},${h} Z`

  return (
    <svg width="100%" viewBox={`0 0 ${w} ${h}`} className="overflow-visible">
      <defs>
        <linearGradient id="bwGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.12" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaD} fill="url(#bwGrad)" className="text-blue-400" />
      <path d={pathD} fill="none" stroke="currentColor" className="text-blue-400" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={points.at(-1).x} cy={points.at(-1).y} r="3" fill="currentColor" className="text-blue-400" />
    </svg>
  )
}

export default BodyWeightWidget
