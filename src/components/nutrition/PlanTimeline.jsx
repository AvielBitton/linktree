'use client'

import { useMemo } from 'react'
import { motion } from 'framer-motion'

const PLAN_COLORS = {
  'bulk-default': { bg: '#F59E0B', glow: 'rgba(245,158,11,0.3)' },
  'mini-cut': { bg: '#3B82F6', glow: 'rgba(59,130,246,0.3)' },
  'cut': { bg: '#EF4444', glow: 'rgba(239,68,68,0.3)' },
}

const FALLBACK_COLOR = { bg: '#8B5CF6', glow: 'rgba(139,92,246,0.3)' }

function toDate(str) {
  const [y, m, d] = str.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function formatShort(date) {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function daysBetween(a, b) {
  return Math.round((b - a) / (1000 * 60 * 60 * 24))
}

function PlanTimeline({ plans, activePlanId }) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const timeline = useMemo(() => {
    const scheduled = plans
      .filter(p => p.start_date && p.end_date)
      .map(p => ({
        ...p,
        start: toDate(p.start_date),
        end: toDate(p.end_date),
        colors: PLAN_COLORS[p.id] || FALLBACK_COLOR,
      }))
      .sort((a, b) => a.start - b.start)

    return { scheduled }
  }, [plans])

  const { scheduled } = timeline
  if (scheduled.length === 0) return null

  const timelineStart = new Date(Math.min(today, ...scheduled.map(s => s.start)))
  timelineStart.setDate(timelineStart.getDate() - 3)
  const timelineEnd = new Date(Math.max(today, ...scheduled.map(s => s.end)))
  timelineEnd.setDate(timelineEnd.getDate() + 7)
  const totalDays = daysBetween(timelineStart, timelineEnd)

  function pct(date) {
    return (daysBetween(timelineStart, date) / totalDays) * 100
  }

  const todayPct = pct(today)

  const months = []
  const cursor = new Date(timelineStart)
  cursor.setDate(1)
  if (cursor < timelineStart) cursor.setMonth(cursor.getMonth() + 1)
  while (cursor <= timelineEnd) {
    months.push({ date: new Date(cursor), pct: pct(cursor) })
    cursor.setMonth(cursor.getMonth() + 1)
  }

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-white/50 text-[10px] font-semibold uppercase tracking-widest">Plan Timeline</h3>
        <span className="text-white/20 text-[10px]">
          {formatShort(timelineStart)} — {formatShort(timelineEnd)}
        </span>
      </div>

      {/* Timeline track */}
      <div className="relative h-14 rounded-xl bg-white/[0.03] border border-white/[0.06] overflow-hidden">

        {/* Month markers */}
        {months.map((m, i) => (
          <div
            key={i}
            className="absolute top-0 bottom-0 border-l border-white/[0.06]"
            style={{ left: `${m.pct}%` }}
          >
            <span className="absolute top-1 left-1 text-[8px] text-white/15 font-medium uppercase">
              {m.date.toLocaleDateString('en-US', { month: 'short' })}
            </span>
          </div>
        ))}

        {/* Scheduled plan blocks */}
        {scheduled.map((plan, i) => {
          const left = pct(plan.start)
          const width = pct(plan.end) - left
          const isActive = plan.id === activePlanId

          return (
            <motion.div
              key={plan.id}
              initial={{ scaleX: 0, opacity: 0 }}
              animate={{ scaleX: 1, opacity: 1 }}
              transition={{ duration: 0.6, delay: i * 0.15, ease: [0.22, 1, 0.36, 1] }}
              style={{
                left: `${left}%`,
                width: `${width}%`,
                originX: 0,
                boxShadow: isActive ? `0 0 20px ${plan.colors.glow}` : 'none',
              }}
              className="absolute top-2 bottom-2 rounded-lg flex items-center justify-center overflow-hidden"
            >
              <div
                className="absolute inset-0 rounded-lg"
                style={{
                  backgroundColor: plan.colors.bg,
                  opacity: isActive ? 0.25 : 0.12,
                }}
              />
              <div
                className="absolute inset-0 rounded-lg border"
                style={{ borderColor: plan.colors.bg, opacity: isActive ? 0.6 : 0.3 }}
              />
              <div className="relative z-10 text-center px-0.5">
                <div className="text-[10px] font-bold text-white/90 leading-none whitespace-nowrap">{plan.name}</div>
                <div className="text-[7px] text-white/40 mt-0.5 whitespace-nowrap">
                  {formatShort(plan.start)} — {formatShort(plan.end)}
                </div>
              </div>
            </motion.div>
          )
        })}

        {/* Today marker */}
        <motion.div
          initial={{ opacity: 0, scaleY: 0 }}
          animate={{ opacity: 1, scaleY: 1 }}
          transition={{ duration: 0.4, delay: 0.5 }}
          className="absolute top-0 bottom-0 w-px z-20"
          style={{ left: `${todayPct}%`, backgroundColor: '#22C55E' }}
        >
          <div className="absolute -top-0 left-1/2 -translate-x-1/2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/50" />
          </div>
          <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 whitespace-nowrap">
            <span className="text-[9px] text-emerald-400 font-semibold">Today</span>
          </div>
        </motion.div>
      </div>

      {/* Plan cards: current + next */}
      {(() => {
        const activePlan = scheduled.find(p => p.id === activePlanId)
        const nextPlan = scheduled.find(p => today < p.start)
        const cards = [activePlan, nextPlan].filter(Boolean).filter((p, i, arr) => arr.findIndex(x => x.id === p.id) === i)

        return (
          <div className="grid grid-cols-2 gap-2 mt-5">
            {cards.map(plan => {
              const totalDaysInPlan = daysBetween(plan.start, plan.end)
              const elapsed = Math.max(0, Math.min(daysBetween(plan.start, today), totalDaysInPlan))
              const progress = totalDaysInPlan > 0 ? elapsed / totalDaysInPlan : 0
              const isActive = plan.id === activePlanId
              const isFuture = today < plan.start

              return (
                <div
                  key={plan.id}
                  className={`rounded-lg p-2.5 border ${
                    isActive
                      ? 'bg-white/[0.05] border-white/[0.12]'
                      : 'bg-white/[0.03] border-white/[0.06]'
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: plan.colors.bg }} />
                    <span className="text-[10px] text-white/60 font-semibold">{plan.name}</span>
                    {isActive && (
                      <span className="text-[8px] text-emerald-400 font-bold ml-auto">NOW</span>
                    )}
                    {!isActive && isFuture && (
                      <span className="text-[8px] text-white/25 font-bold ml-auto">NEXT</span>
                    )}
                  </div>
                  <div className="text-[10px] text-white/25">
                    {isActive && isFuture
                      ? 'Active (default)'
                      : isFuture
                        ? `Starts in ${daysBetween(today, plan.start)}d`
                        : progress >= 1
                          ? 'Completed'
                          : `Day ${elapsed + 1} of ${totalDaysInPlan}`
                    }
                  </div>
                  <div className="text-sm text-white font-bold mt-1">
                    {plan.meals?.reduce((s, m) => s + m.target_kcal, 0)} kcal
                  </div>
                  {!isFuture && progress < 1 && (
                    <div className="mt-1.5 h-1 rounded-full bg-white/[0.06] overflow-hidden">
                      <motion.div
                        className="h-full rounded-full"
                        style={{ backgroundColor: plan.colors.bg }}
                        initial={{ width: 0 }}
                        animate={{ width: `${progress * 100}%` }}
                        transition={{ duration: 0.8, delay: 0.3 }}
                      />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )
      })()}
    </div>
  )
}

export default PlanTimeline
