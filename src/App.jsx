import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import SocialIcons from './components/SocialIcons'
import { loadWorkouts } from './utils/workouts'

const DAY_NAMES = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const TYPE_COLORS = {
  Run: '#F59E0B',
  Strength: '#84CC16',
  Custom: '#A78BFA',
  Other: '#A78BFA',
  Swim: '#60A5FA',
  Bike: '#34D399',
  Walk: '#A78BFA',
}

function getTypeColor(type) {
  return TYPE_COLORS[type] || '#A78BFA'
}

function getWeekSunday(date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() - d.getDay())
  return d
}

function formatDateRange(sunday) {
  const saturday = new Date(sunday)
  saturday.setDate(sunday.getDate() + 6)
  const sMonth = MONTH_NAMES[sunday.getMonth()]
  const eMonth = MONTH_NAMES[saturday.getMonth()]
  if (sMonth === eMonth) {
    return `${sMonth} ${sunday.getDate()} - ${saturday.getDate()}`
  }
  return `${sMonth} ${sunday.getDate()} - ${eMonth} ${saturday.getDate()}`
}

function calcWeekNumber(sunday, firstWorkoutDate) {
  const firstSunday = getWeekSunday(firstWorkoutDate)
  const diffWeeks = Math.round((sunday - firstSunday) / (7 * 24 * 60 * 60 * 1000))
  return Math.max(1, diffWeeks + 1)
}

function isWorkoutCompleted(w) {
  return (parseFloat(w.DistanceInMeters) || 0) > 0 || (parseFloat(w.TimeTotalInHours) || 0) > 0
}

function isDisplayableWorkout(w) {
  const title = (w.Title || '').trim()
  if (/\|\s*Week/i.test(title)) return false
  if (/^(Race Week|Off Season)$/i.test(title)) return false
  if (/^Transition\s/i.test(title)) return false
  if (/^Build\s.*Week\s/i.test(title)) return false
  return true
}

function formatActualDuration(hours) {
  if (!hours || hours <= 0) return ''
  const h = Math.floor(hours)
  const m = Math.floor((hours - h) * 60)
  const s = Math.round(((hours - h) * 60 - m) * 60)
  const parts = []
  if (h > 0) parts.push(`${h}h`)
  if (m > 0) parts.push(`${m}m`)
  if (s > 0) parts.push(`${s}s`)
  return parts.join(' ')
}

function formatPlannedDuration(hours) {
  if (!hours || hours <= 0) return ''
  const totalMin = Math.round(hours * 60)
  const h = Math.floor(totalMin / 60)
  const m = totalMin % 60
  if (h > 0 && m > 0) return `${h}h ${m}m`
  if (h > 0) return `${h}h`
  return `${m}m`
}

function buildWeekData(workouts, sunday, firstDate) {
  const saturday = new Date(sunday)
  saturday.setDate(sunday.getDate() + 6)
  saturday.setHours(23, 59, 59, 999)

  const weekNum = calcWeekNumber(sunday, firstDate)

  const weekWorkouts = workouts
    .filter(w => w.date && w.date >= sunday && w.date <= saturday)
    .filter(isDisplayableWorkout)

  const days = Array.from({ length: 7 }, (_, i) => {
    const dayDate = new Date(sunday)
    dayDate.setDate(sunday.getDate() + i)

    const dayWorkouts = weekWorkouts.filter(w =>
      w.date.getDate() === dayDate.getDate() &&
      w.date.getMonth() === dayDate.getMonth()
    )

    return {
      dayName: DAY_NAMES[i],
      dateNum: dayDate.getDate(),
      workouts: dayWorkouts,
      isToday: dayDate.toDateString() === new Date().toDateString(),
    }
  })

  const runWorkouts = weekWorkouts.filter(w => (w.WorkoutType || '').toLowerCase() === 'run')
  const totalPlanned = runWorkouts.reduce((s, w) => s + ((parseFloat(w.PlannedDistanceInMeters) || 0) / 1000), 0)
  const totalActual = runWorkouts.reduce((s, w) => s + ((parseFloat(w.DistanceInMeters) || 0) / 1000), 0)

  return {
    sunday,
    dateRange: formatDateRange(sunday),
    weekNum,
    days,
    totalPlannedKm: Math.round(totalPlanned * 10) / 10,
    totalActualKm: Math.round(totalActual * 10) / 10,
  }
}

function WorkoutCard({ workout }) {
  const completed = isWorkoutCompleted(workout)
  const color = getTypeColor(workout.WorkoutType)

  const distanceM = completed
    ? parseFloat(workout.DistanceInMeters) || 0
    : parseFloat(workout.PlannedDistanceInMeters) || 0
  const distanceKm = distanceM > 0 ? Math.round(distanceM / 100) / 10 : 0

  const duration = completed
    ? formatActualDuration(parseFloat(workout.TimeTotalInHours) || 0)
    : formatPlannedDuration(parseFloat(workout.PlannedDuration) || 0)

  const subtitle = [
    distanceKm > 0 ? `${distanceKm} km` : '',
    duration,
  ].filter(Boolean).join(' \u00B7 ')

  return (
    <div className="flex-1 min-w-[140px] bg-[#161D2A] rounded-xl border border-white/[0.07] overflow-hidden flex">
      <div className="w-1 flex-shrink-0" style={{ backgroundColor: color }} />
      <div className="flex-1 px-3 py-2.5 flex items-center justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-white font-semibold text-[13px] leading-tight truncate">
            {workout.Title}
          </p>
          {subtitle && (
            <p className="text-white/40 text-xs mt-0.5">{subtitle}</p>
          )}
        </div>
        {completed ? (
          <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
            <svg className="w-3 h-3 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        ) : (
          <div className="w-6 h-6 rounded-full bg-white/[0.06] flex items-center justify-center flex-shrink-0">
            <svg className="w-3 h-3 text-white/25" viewBox="0 0 24 24" fill="currentColor">
              <path d="M13 9h-2V7h2m0 10h-2v-6h2m-1-9A10 10 0 002 12a10 10 0 0010 10 10 10 0 0010-10A10 10 0 0012 2z" opacity="0.6" />
            </svg>
          </div>
        )}
      </div>
    </div>
  )
}

function DayRow({ dayName, dateNum, workouts, isToday }) {
  const hasWorkouts = workouts.length > 0

  return (
    <div className={`flex items-start gap-3 py-3.5 border-b border-white/[0.04] last:border-b-0 ${isToday ? 'bg-white/[0.02] -mx-5 px-5 rounded-2xl' : ''}`}>
      <div className="w-11 flex-shrink-0 text-center pt-0.5">
        <p className={`text-[11px] font-semibold tracking-wider ${isToday ? 'text-run' : 'text-white/30'}`}>
          {dayName}
        </p>
        <p className={`text-xl font-bold leading-tight ${isToday ? 'text-white' : 'text-white/45'}`}>
          {dateNum}
        </p>
      </div>

      {hasWorkouts ? (
        <div className="flex-1 flex flex-wrap gap-2">
          {workouts.map((w, i) => (
            <WorkoutCard key={i} workout={w} />
          ))}
        </div>
      ) : (
        <div className="flex-1 flex items-center pt-2.5">
          <span className="text-white/20 text-sm font-medium">Rest Day</span>
        </div>
      )}
    </div>
  )
}

function NavArrow({ direction, onClick, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
        disabled
          ? 'text-white/10 cursor-default'
          : 'text-white/40 hover:text-white/70 hover:bg-white/[0.06] active:bg-white/[0.1]'
      }`}
    >
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        {direction === 'left'
          ? <path d="M15 18l-6-6 6-6" />
          : <path d="M9 18l6-6-6-6" />
        }
      </svg>
    </button>
  )
}

function App() {
  const [allWorkouts, setAllWorkouts] = useState([])
  const [firstDate, setFirstDate] = useState(null)
  const [lastDate, setLastDate] = useState(null)
  const [currentSunday, setCurrentSunday] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const workouts = await loadWorkouts()
      const sorted = [...workouts].sort((a, b) => a.date - b.date)
      const first = sorted.length > 0 ? sorted[0].date : new Date()
      const last = sorted.length > 0 ? sorted[sorted.length - 1].date : new Date()

      setAllWorkouts(workouts)
      setFirstDate(first)
      setLastDate(last)
      setCurrentSunday(getWeekSunday(new Date()))
      setLoading(false)
    }
    load()
  }, [])

  const navigateWeek = useCallback((offset) => {
    setCurrentSunday(prev => {
      const next = new Date(prev)
      next.setDate(prev.getDate() + offset * 7)
      return next
    })
  }, [])

  const isCurrentWeek = currentSunday && getWeekSunday(new Date()).getTime() === currentSunday.getTime()
  const canGoBack = currentSunday && firstDate && currentSunday > getWeekSunday(firstDate)
  const canGoForward = currentSunday && lastDate && currentSunday < getWeekSunday(lastDate)

  const weekData = currentSunday && firstDate
    ? buildWeekData(allWorkouts, currentSunday, firstDate)
    : null

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0D1117] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-white/15 border-t-white/50 rounded-full animate-spin" />
      </div>
    )
  }

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
          className="mb-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.05, duration: 0.6 }}
        >
          <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight mb-1">
            Aviel Bitton
          </h1>
          <p className="text-white/30 text-sm font-medium mb-4">
            Live boldly as a <span className="text-amber-400/80 font-semibold">FREE SPIRIT</span>
          </p>
          <SocialIcons />
        </motion.div>

        {/* Week Header with Navigation */}
        <motion.div
          className="mb-3"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.5 }}
        >
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-2.5">
              <h2 className="text-white font-bold text-lg tracking-tight">{weekData.dateRange}</h2>
              <span className="bg-white/[0.08] text-white/60 text-[11px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                Week {weekData.weekNum}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <NavArrow direction="left" onClick={() => navigateWeek(-1)} disabled={!canGoBack} />
              {!isCurrentWeek && (
                <button
                  onClick={() => setCurrentSunday(getWeekSunday(new Date()))}
                  className="text-[11px] font-semibold text-run/80 hover:text-run px-2 py-1 rounded-full hover:bg-white/[0.06] transition-colors"
                >
                  Today
                </button>
              )}
              <NavArrow direction="right" onClick={() => navigateWeek(1)} disabled={!canGoForward} />
            </div>
          </div>
          <p className="text-run/80 text-sm font-medium">
            Total:{' '}
            <span className="text-white font-bold">
              {weekData.totalActualKm > 0 ? weekData.totalActualKm : weekData.totalPlannedKm} km
            </span>
            {weekData.totalActualKm > 0 && weekData.totalPlannedKm > 0 && (
              <span className="text-white/25 font-normal"> / {weekData.totalPlannedKm} km</span>
            )}
          </p>
        </motion.div>

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-white/[0.06] via-white/[0.03] to-transparent mb-1" />

        {/* Day Rows */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSunday?.getTime()}
            initial={{ opacity: 0, x: 0 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {weekData.days.map((day, i) => (
              <DayRow
                key={i}
                dayName={day.dayName}
                dateNum={day.dateNum}
                workouts={day.workouts}
                isToday={day.isToday}
              />
            ))}
          </motion.div>
        </AnimatePresence>

        {/* Building Next Prep */}
        <motion.div
          className="mt-12 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.6 }}
        >
          <p className="text-white/10 text-[10px] uppercase tracking-[0.3em] font-medium mb-2">
            Next chapter
          </p>
          <p className="text-white/20 text-sm font-medium tracking-tight">
            Building next prep...
          </p>
        </motion.div>
      </div>
    </div>
  )
}

export default App
