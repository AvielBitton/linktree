'use client'

import { useState, useCallback, useMemo, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import SocialIcons from './components/SocialIcons'
import DayRow from './components/dashboard/DayRow'
import WorkoutDetailModal from './components/dashboard/WorkoutDetailModal'
import NavArrow from './components/dashboard/NavArrow'
import { hydrateWorkouts } from './utils/workouts'
import { getWeekSunday, buildWeekData } from './utils/dashboard'

function App({ initialWorkouts = [] }) {
  const allWorkouts = useMemo(() => hydrateWorkouts(initialWorkouts), [initialWorkouts])

  const { firstDate, lastDate } = useMemo(() => {
    const sorted = [...allWorkouts].sort((a, b) => a.date - b.date)
    return {
      firstDate: sorted.length > 0 ? sorted[0].date : new Date(),
      lastDate: sorted.length > 0 ? sorted[sorted.length - 1].date : new Date(),
    }
  }, [allWorkouts])

  const [currentSunday, setCurrentSunday] = useState(() => getWeekSunday(new Date()))
  const [selectedWorkout, setSelectedWorkout] = useState(null)
  const [swipeDir, setSwipeDir] = useState(0)
  const touchRef = useRef(null)

  const navigateWeek = useCallback((offset) => {
    setSwipeDir(offset)
    setCurrentSunday(prev => {
      const next = new Date(prev)
      next.setDate(prev.getDate() + offset * 7)
      return next
    })
  }, [])

  const isCurrentWeek = currentSunday && getWeekSunday(new Date()).getTime() === currentSunday.getTime()
  const canGoBack = currentSunday && firstDate && currentSunday > getWeekSunday(firstDate)
  const maxForwardSunday = getWeekSunday(new Date())
  maxForwardSunday.setDate(maxForwardSunday.getDate() + 3 * 7)
  const canGoForward = currentSunday && currentSunday < maxForwardSunday && lastDate && currentSunday < getWeekSunday(lastDate)

  const weekData = currentSunday && firstDate
    ? buildWeekData(allWorkouts, currentSunday, firstDate)
    : null

  const handleTouchStart = useCallback((e) => {
    touchRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
  }, [])

  const handleTouchEnd = useCallback((e) => {
    if (!touchRef.current) return
    const dx = e.changedTouches[0].clientX - touchRef.current.x
    const dy = e.changedTouches[0].clientY - touchRef.current.y
    touchRef.current = null
    if (Math.abs(dx) < 60 || Math.abs(dy) > Math.abs(dx)) return
    if (dx > 0 && canGoBack) navigateWeek(-1)
    else if (dx < 0 && canGoForward) navigateWeek(1)
  }, [canGoBack, canGoForward, navigateWeek])

  const handleShare = useCallback(async () => {
    const text = `Week ${weekData?.weekNum} | ${weekData?.dateRange} | Done: ${weekData?.totalActualKm} km`
    const url = typeof window !== 'undefined' ? window.location.href : 'https://aviel.club'
    if (navigator.share) {
      try { await navigator.share({ title: 'Aviel Bitton', text, url }) } catch {}
    } else {
      await navigator.clipboard.writeText(`${text}\n${url}`)
    }
  }, [weekData])

  return (
    <div className="min-h-screen bg-[#0D1117]">
      <div className="max-w-lg mx-auto px-5 py-8 sm:py-12">

        {/* Archive Chip */}
        <motion.a
          href="/telaviv2026"
          className="inline-flex items-center gap-1.5 bg-white/[0.04] rounded-full px-3.5 py-1.5 border border-white/[0.07] mb-8 hover:border-white/[0.15] transition-colors"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <span className="text-white/45 text-xs font-medium">Tel Aviv 2026</span>
          <svg className="w-3 h-3 text-white/25" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </motion.a>

        {/* Hero */}
        <motion.div
          className="mb-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.05, duration: 0.6 }}
        >
          <div className="flex items-center justify-between mb-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Aviel Bitton
            </h1>
            <SocialIcons onShare={handleShare} />
          </div>
          <p className="text-white/30 text-xs font-medium">
            Live boldly as a <span className="text-amber-400/80 font-semibold">FREE SPIRIT</span>
          </p>
        </motion.div>

        {/* Week Header with Navigation */}
        <motion.div
          className="mb-3"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.5 }}
        >
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2.5">
              <h2 className="text-white font-bold text-base tracking-tight">{weekData.dateRange}</h2>
              <span className="bg-white/[0.08] text-white/60 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                Week {weekData.weekNum}
              </span>
            </div>
            <div className="flex items-center gap-0.5">
              <NavArrow direction="left" onClick={() => navigateWeek(-1)} disabled={!canGoBack} />
              <button
                onClick={() => setCurrentSunday(getWeekSunday(new Date()))}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                  isCurrentWeek
                    ? 'text-run cursor-default'
                    : 'text-white/30 hover:text-run hover:bg-white/[0.06] active:bg-white/[0.1]'
                }`}
              >
                <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  {isCurrentWeek && <circle cx="12" cy="15" r="2" fill="currentColor" stroke="none" />}
                </svg>
              </button>
              <NavArrow direction="right" onClick={() => navigateWeek(1)} disabled={!canGoForward} />
            </div>
          </div>
          <div className="flex items-center gap-4 text-xs font-medium">
            {weekData.totalPlannedKm === 0 && weekData.totalActualKm === 0 ? (
              <p className="text-white/25">Recovery Week</p>
            ) : (
              <>
                {weekData.totalPlannedKm > 0 && (
                  <p className="text-white/30">
                    Plan:{' '}
                    <span className="text-white/50 font-bold">
                      {weekData.plannedIsEstimate ? '~' : ''}{weekData.totalPlannedKm} km
                    </span>
                  </p>
                )}
                <p className="text-run/80">
                  Done:{' '}
                  <span className="text-white font-bold">
                    {weekData.totalActualKm} km
                  </span>
                </p>
              </>
            )}
          </div>
        </motion.div>

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-white/[0.06] via-white/[0.03] to-transparent mb-1" />

        {/* Day Rows */}
        <div onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSunday?.getTime()}
            initial={{ opacity: 0, x: swipeDir * 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: swipeDir * -40 }}
            transition={{ duration: 0.2 }}
          >
            {weekData.days.map((day, i) => (
              <DayRow
                key={i}
                dayName={day.dayName}
                dateNum={day.dateNum}
                workouts={day.workouts}
                isToday={day.isToday}
                onSelectWorkout={setSelectedWorkout}
              />
            ))}
          </motion.div>
        </AnimatePresence>
        </div>

      </div>

      <AnimatePresence>
        {selectedWorkout && (
          <WorkoutDetailModal
            key="workout-modal"
            workout={selectedWorkout}
            onClose={() => setSelectedWorkout(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

export default App
