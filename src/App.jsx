import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import SocialIcons from './components/SocialIcons'
import { loadWorkouts, formatPace, formatWorkoutDate } from './utils/workouts'

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

const AVG_PACE_MIN_PER_KM = 6 + 10 / 60

function estimateDistance(durationHours) {
  if (!durationHours || durationHours <= 0) return null
  const km = (durationHours * 60) / AVG_PACE_MIN_PER_KM
  return Math.floor(km * 2) / 2
}

function getRunDistance(workout, completed) {
  const isRun = (workout.WorkoutType || '').toLowerCase() === 'run'
  if (!isRun) return { text: '', estimated: false }

  if (completed) {
    const actual = parseFloat(workout.DistanceInMeters) || 0
    if (actual > 0) return { text: `${Math.round(actual / 100) / 10} km`, estimated: false }
  }

  const planned = parseFloat(workout.PlannedDistanceInMeters) || 0
  if (planned > 0) return { text: `${Math.round(planned / 100) / 10} km`, estimated: false }

  const duration = parseFloat(workout.PlannedDuration) || 0
  const est = estimateDistance(duration)
  if (est) return { text: `~${est} km`, estimated: true }

  return { text: '', estimated: false }
}

function WorkoutCard({ workout, onClick }) {
  const completed = isWorkoutCompleted(workout)
  const color = getTypeColor(workout.WorkoutType)
  const isRun = (workout.WorkoutType || '').toLowerCase() === 'run'

  const runDist = getRunDistance(workout, completed)

  const nonRunDistanceM = !isRun && completed
    ? parseFloat(workout.DistanceInMeters) || 0
    : !isRun ? parseFloat(workout.PlannedDistanceInMeters) || 0 : 0
  const nonRunDistKm = nonRunDistanceM > 0 ? `${Math.round(nonRunDistanceM / 100) / 10} km` : ''

  const duration = completed
    ? formatActualDuration(parseFloat(workout.TimeTotalInHours) || 0)
    : formatPlannedDuration(parseFloat(workout.PlannedDuration) || 0)

  const nonRunSubtitle = [nonRunDistKm, duration].filter(Boolean).join(' \u00B7 ')
  const runSubtitle = duration || ''

  return (
    <div
      className="flex-1 min-w-[140px] bg-[#161D2A] rounded-xl border border-white/[0.07] overflow-hidden flex cursor-pointer hover:bg-[#1a2332] active:bg-[#1e2840] transition-colors"
      onClick={onClick}
    >
      <div className="w-1 flex-shrink-0" style={{ backgroundColor: color }} />
      <div className="flex-1 px-3 py-2.5 flex items-center justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-white font-semibold text-[12px] leading-tight truncate">
            {workout.Title}
            {isRun && runDist.text && ` | ${runDist.text}`}
          </p>
          {(isRun ? runSubtitle : nonRunSubtitle) && (
            <p className="text-white/40 text-[11px] mt-0.5">{isRun ? runSubtitle : nonRunSubtitle}</p>
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

function DayRow({ dayName, dateNum, workouts, isToday, onSelectWorkout }) {
  const hasWorkouts = workouts.length > 0

  return (
    <div className="flex items-start gap-3 py-3.5 border-b border-white/[0.04] last:border-b-0">
      <div className="w-11 flex-shrink-0 text-center pt-0.5">
        <p className={`text-[10px] font-semibold tracking-wider ${isToday ? 'text-run' : 'text-white/30'}`}>
          {dayName}
        </p>
        <p className={`text-lg font-bold leading-tight ${isToday ? 'text-white' : 'text-white/45'}`}>
          {dateNum}
        </p>
      </div>

      {hasWorkouts ? (
        <div className="flex-1 flex flex-wrap gap-2">
          {workouts.map((w, i) => (
            <WorkoutCard key={i} workout={w} onClick={() => onSelectWorkout(w)} />
          ))}
        </div>
      ) : (
        <div className="flex-1 flex items-center pt-2.5">
          <span className="text-white/20 text-xs font-medium">Rest Day</span>
        </div>
      )}
    </div>
  )
}

function WorkoutDetailModal({ workout, onClose }) {
  if (!workout) return null

  const completed = isWorkoutCompleted(workout)
  const color = getTypeColor(workout.WorkoutType)
  const isRun = (workout.WorkoutType || '').toLowerCase() === 'run'

  const actualDist = parseFloat(workout.DistanceInMeters) || 0
  const plannedDist = parseFloat(workout.PlannedDistanceInMeters) || 0
  const actualDuration = parseFloat(workout.TimeTotalInHours) || 0
  const plannedDuration = parseFloat(workout.PlannedDuration) || 0

  const velocity = parseFloat(workout.VelocityAverage) || 0
  const pace = velocity > 0 ? (1000 / velocity) / 60 : null
  const avgHR = parseFloat(workout.HeartRateAverage) || null
  const maxHR = parseFloat(workout.HeartRateMax) || null
  const cadence = parseFloat(workout.CadenceAverage) || null
  const rpe = parseFloat(workout.Rpe) || null
  const feeling = parseFloat(workout.Feeling) || null

  const description = workout.WorkoutDescription || ''
  const coachComments = workout.CoachComments || ''
  const athleteComments = workout.AthleteComments || ''

  const distDisplay = completed && actualDist > 0
    ? `${Math.round(actualDist / 100) / 10} km`
    : plannedDist > 0
      ? `${Math.round(plannedDist / 100) / 10} km`
      : isRun && plannedDuration > 0
        ? `~${estimateDistance(plannedDuration)} km`
        : null

  const durationDisplay = completed && actualDuration > 0
    ? formatActualDuration(actualDuration)
    : plannedDuration > 0
      ? formatPlannedDuration(plannedDuration)
      : null

  const feelingLabels = { 1: 'Terrible', 2: 'Poor', 3: 'Normal', 4: 'Good', 5: 'Great', 6: 'Superb', 7: 'Peak' }

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      />

        <motion.div
          className="relative w-full max-w-lg max-h-[85vh] overflow-y-auto bg-[#131922] rounded-t-3xl sm:rounded-3xl border border-white/[0.08] shadow-2xl"
          initial={{ y: '100%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        >
          <div className="w-1 h-1 rounded-full bg-white/15 mx-auto mt-2 sm:hidden" />

          <div className="h-0.5 rounded-full mx-5 mt-2" style={{ backgroundColor: color }} />

          <div className="px-5 pt-3 pb-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1 min-w-0">
                <p className="text-white/30 text-[11px] font-medium mb-0.5">
                  {formatWorkoutDate(workout.date)}
                </p>
                <h2 className="text-white font-bold text-lg tracking-tight leading-tight">
                  {workout.Title}
                </h2>
                <div className="flex items-center gap-1.5 mt-1">
                  <span
                    className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                    style={{ backgroundColor: color + '20', color }}
                  >
                    {workout.WorkoutType}
                  </span>
                  {completed && (
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400">
                      Completed
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-7 h-7 rounded-full bg-white/[0.06] flex items-center justify-center text-white/40 hover:text-white/70 hover:bg-white/[0.1] transition-colors flex-shrink-0 ml-2"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            {(distDisplay || durationDisplay) && (
              <div className="flex gap-2 mb-3">
                {distDisplay && (
                  <div className="flex-1 bg-white/[0.04] rounded-lg p-2 text-center">
                    <p className="text-white font-bold text-base">{distDisplay}</p>
                    <p className="text-white/30 text-[10px] font-medium">Distance</p>
                  </div>
                )}
                {durationDisplay && (
                  <div className="flex-1 bg-white/[0.04] rounded-lg p-2 text-center">
                    <p className="text-white font-bold text-base">{durationDisplay}</p>
                    <p className="text-white/30 text-[10px] font-medium">Duration</p>
                  </div>
                )}
              </div>
            )}

            {completed && isRun && (pace || avgHR || cadence || rpe) && (
              <div className="grid grid-cols-2 gap-1.5 mb-3">
                {pace && (
                  <div className="bg-white/[0.04] rounded-lg p-2">
                    <p className="text-white font-bold text-sm">{formatPace(pace)}</p>
                    <p className="text-white/30 text-[10px] font-medium">Avg Pace</p>
                  </div>
                )}
                {avgHR && (
                  <div className="bg-white/[0.04] rounded-lg p-2">
                    <p className="text-white font-bold text-sm">{Math.round(avgHR)}{maxHR ? <span className="text-white/25 font-normal text-[11px]"> / {Math.round(maxHR)}</span> : ''}</p>
                    <p className="text-white/30 text-[10px] font-medium">Avg / Max HR</p>
                  </div>
                )}
                {cadence && (
                  <div className="bg-white/[0.04] rounded-lg p-2">
                    <p className="text-white font-bold text-sm">{Math.round(cadence)}</p>
                    <p className="text-white/30 text-[10px] font-medium">Cadence</p>
                  </div>
                )}
                {rpe && (
                  <div className="bg-white/[0.04] rounded-lg p-2">
                    <p className="text-white font-bold text-sm">{rpe}/10</p>
                    <p className="text-white/30 text-[10px] font-medium">RPE{feeling ? ` · ${feelingLabels[feeling] || feeling}` : ''}</p>
                  </div>
                )}
              </div>
            )}

            {description && (
              <div className="mb-3" dir="rtl">
                <p className="text-white/25 text-[10px] uppercase tracking-wider mb-1 font-semibold text-right">פרטי אימון</p>
                <p className="text-white/45 text-xs leading-relaxed whitespace-pre-line text-right">{description}</p>
              </div>
            )}

            {coachComments && (
              <div className="mb-3" dir="rtl">
                <p className="text-white/25 text-[10px] uppercase tracking-wider mb-1 font-semibold text-right">הערות מאמן</p>
                <p className="text-white/45 text-xs leading-relaxed whitespace-pre-line text-right">{coachComments}</p>
              </div>
            )}

            {completed && athleteComments && (
              <div className="mb-2" dir="rtl">
                <p className="text-white/25 text-[10px] uppercase tracking-wider mb-1 font-semibold text-right">סיכום אישי</p>
                <p className="text-white/45 text-xs leading-relaxed whitespace-pre-line text-right">{athleteComments}</p>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
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
  const [selectedWorkout, setSelectedWorkout] = useState(null)

  useEffect(() => {
    document.body.style.overflow = selectedWorkout ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [selectedWorkout])

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
  const maxForwardSunday = getWeekSunday(new Date())
  maxForwardSunday.setDate(maxForwardSunday.getDate() + 3 * 7)
  const canGoForward = currentSunday && currentSunday < maxForwardSunday && lastDate && currentSunday < getWeekSunday(lastDate)

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
          className="mb-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.05, duration: 0.6 }}
        >
          <div className="flex items-center justify-between mb-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Aviel Bitton
            </h1>
            <SocialIcons />
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
          <p className="text-run/80 text-xs font-medium">
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
                onSelectWorkout={setSelectedWorkout}
              />
            ))}
          </motion.div>
        </AnimatePresence>

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
