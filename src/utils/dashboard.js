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

export function getTypeColor(type) {
  return TYPE_COLORS[type] || '#A78BFA'
}

export function getWeekSunday(date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() - d.getDay())
  return d
}

export function formatDateRange(sunday) {
  const saturday = new Date(sunday)
  saturday.setDate(sunday.getDate() + 6)
  const sMonth = MONTH_NAMES[sunday.getMonth()]
  const eMonth = MONTH_NAMES[saturday.getMonth()]
  if (sMonth === eMonth) {
    return `${sMonth} ${sunday.getDate()} - ${saturday.getDate()}`
  }
  return `${sMonth} ${sunday.getDate()} - ${eMonth} ${saturday.getDate()}`
}

export function calcWeekNumber(sunday, firstWorkoutDate) {
  const firstSunday = getWeekSunday(firstWorkoutDate)
  const diffWeeks = Math.round((sunday - firstSunday) / (7 * 24 * 60 * 60 * 1000))
  return Math.max(1, diffWeeks + 1)
}

export function isWorkoutCompleted(w) {
  return (parseFloat(w.DistanceInMeters) || 0) > 0 || (parseFloat(w.TimeTotalInHours) || 0) > 0
}

export function isDisplayableWorkout(w) {
  const title = (w.Title || '').trim()
  if (/\|\s*Week/i.test(title)) return false
  if (/^(Race Week|Off Season)$/i.test(title)) return false
  if (/^Transition\s/i.test(title)) return false
  if (/^Build\s.*Week\s/i.test(title)) return false
  return true
}

export function formatActualDuration(hours) {
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

export function formatPlannedDuration(hours) {
  if (!hours || hours <= 0) return ''
  const totalMin = Math.round(hours * 60)
  const h = Math.floor(totalMin / 60)
  const m = totalMin % 60
  if (h > 0 && m > 0) return `${h}h ${m}m`
  if (h > 0) return `${h}h`
  return `${m}m`
}

export function calcStructureDistance(structure, thresholdSpeed) {
  if (!structure || !structure.blocks || !thresholdSpeed) return null
  if (structure.metric === 'rpe') return null
  let totalMeters = 0
  const processStep = (step) => {
    if (step.unit === 'meter') {
      totalMeters += (step.value || 0)
    } else if (step.unit === 'second' && step.targetMin != null) {
      const avgPct = step.targetMax != null ? (step.targetMin + step.targetMax) / 2 : step.targetMin
      const speed = thresholdSpeed * (avgPct / 100)
      totalMeters += speed * (step.value || 0)
    }
  }
  for (const block of structure.blocks) {
    if (block.type === 'repeat') {
      for (const step of block.steps) {
        const reps = block.reps || 1
        const saved = totalMeters
        processStep(step)
        totalMeters = saved + (totalMeters - saved) * reps
      }
    } else {
      processStep(block)
    }
  }
  return totalMeters > 0 ? Math.round(totalMeters / 100) / 10 : null
}

const AVG_PACE_MIN_PER_KM = 6 + 10 / 60

export function estimateDistance(durationHours) {
  if (!durationHours || durationHours <= 0) return null
  const km = (durationHours * 60) / AVG_PACE_MIN_PER_KM
  return Math.floor(km * 2) / 2
}

export function getRunDistance(workout, completed) {
  const isRun = (workout.WorkoutType || '').toLowerCase() === 'run'
  if (!isRun) return { text: '', estimated: false }

  if (completed) {
    const actual = parseFloat(workout.DistanceInMeters) || 0
    if (actual > 0) return { text: `${Math.round(actual / 100) / 10} km`, estimated: false }
  }

  const planned = parseFloat(workout.PlannedDistanceInMeters) || 0
  if (planned > 0) return { text: `${Math.round(planned / 100) / 10} km`, estimated: false }

  const structDist = calcStructureDistance(workout.structure, workout.thresholdSpeed)
  if (structDist) return { text: `~${structDist} km`, estimated: true }

  const duration = parseFloat(workout.PlannedDuration) || 0
  const est = estimateDistance(duration)
  if (est) return { text: `~${est} km`, estimated: true }

  return { text: '', estimated: false }
}

export function buildWeekData(workouts, sunday, firstDate) {
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
      dateStr: dayDate.toDateString(),
      workouts: dayWorkouts,
    }
  })

  const runWorkouts = weekWorkouts.filter(w => (w.WorkoutType || '').toLowerCase() === 'run')
  const totalActual = runWorkouts.reduce((s, w) => s + ((parseFloat(w.DistanceInMeters) || 0) / 1000), 0)

  let totalPlanned = 0
  let hasEstimate = false
  for (const w of runWorkouts) {
    const planned = parseFloat(w.PlannedDistanceInMeters) || 0
    if (planned > 0) {
      totalPlanned += planned / 1000
    } else {
      const structDist = calcStructureDistance(w.structure, w.thresholdSpeed)
      if (structDist) {
        totalPlanned += structDist
        hasEstimate = true
      } else {
        const duration = parseFloat(w.PlannedDuration) || 0
        const est = estimateDistance(duration)
        if (est) {
          totalPlanned += est
          hasEstimate = true
        }
      }
    }
  }

  return {
    sunday,
    dateRange: formatDateRange(sunday),
    weekNum,
    days,
    totalPlannedKm: Math.round(totalPlanned * 10) / 10,
    totalActualKm: Math.round(totalActual * 10) / 10,
    plannedIsEstimate: hasEstimate,
  }
}
