import STRENGTH_MAP from './strength-map'

export function hydrateWorkouts(workouts) {
  return workouts.map(w => ({
    ...w,
    date: w.WorkoutDay ? new Date(w.WorkoutDay) : null,
  })).filter(w => w.date && !isNaN(w.date.getTime()))
}

const STRAVA_TYPE_MAP = {
  WeightTraining: 'Strength',
  Yoga: 'Custom',
  Swim: 'Swim',
  Ride: 'Bike',
  Walk: 'Walk',
}

function mapStravaSportType(activity) {
  if (activity.sport_type === 'Pilates') return 'Custom'
  return STRAVA_TYPE_MAP[activity.type] || null
}

export function mergeStravaActivities(workouts, stravaActivities) {
  if (!stravaActivities || stravaActivities.length === 0) return workouts

  const existingKeys = new Set()
  for (const w of workouts) {
    if (!w.WorkoutDay) continue
    const day = w.WorkoutDay.slice(0, 10)
    const type = (w.WorkoutType || '').toLowerCase()
    existingKeys.add(`${day}|${type}`)
  }

  const synthetic = []
  for (const a of stravaActivities) {
    if (a.type === 'Run') continue

    const workoutType = mapStravaSportType(a)
    if (!workoutType) continue

    const key = `${a.date}|${workoutType.toLowerCase()}`
    if (existingKeys.has(key)) continue
    existingKeys.add(key)

    synthetic.push({
      Title: a.name || workoutType,
      WorkoutType: workoutType,
      WorkoutDay: a.date,
      WorkoutDescription: '',
      TimeTotalInHours: a.moving_time ? String(a.moving_time / 3600) : '',
      DistanceInMeters: a.distance ? String(a.distance) : '',
      HeartRateAverage: a.average_heartrate ? String(a.average_heartrate) : '',
      HeartRateMax: a.max_heartrate ? String(a.max_heartrate) : '',
      PlannedDuration: '',
      PlannedDistanceInMeters: '',
      _stravaId: a.id,
      _stravaCalories: a.calories || 0,
      _stravaSufferScore: a.suffer_score || null,
      _stravaSportType: a.sport_type || a.type,
      _source: 'strava',
      date: new Date(a.date),
    })
  }

  return [...workouts, ...synthetic]
}

export function assignGymTemplates(workouts, gymTemplates, gymSessions = []) {
  if (!gymTemplates || gymTemplates.length === 0) return workouts

  const templateById = {}
  for (const t of gymTemplates) {
    templateById[t.id] = t
  }

  // Build date -> sessions lookup from actual gym sessions (DB)
  const sessionsByDate = new Map()
  for (const s of gymSessions) {
    if (!s.started_at || !s.template_id) continue
    const day = new Date(s.started_at).toISOString().slice(0, 10)
    if (!sessionsByDate.has(day)) sessionsByDate.set(day, [])
    sessionsByDate.get(day).push(s)
  }

  // Ordinal map for future/planned workouts (static fallback)
  const today = new Date().toISOString().slice(0, 10)

  const plannedStrength = workouts
    .filter(w =>
      (w.WorkoutType || '').toLowerCase() === 'strength' &&
      w._source !== 'strava' &&
      w.WorkoutDay?.slice(0, 10) >= today
    )
    .sort((a, b) => (a.WorkoutDay || '').localeCompare(b.WorkoutDay || ''))

  const ordinalMap = new Map()
  plannedStrength.forEach((w, i) => {
    const key = `${w.WorkoutDay?.slice(0, 10)}|${w.Title || ''}`
    ordinalMap.set(key, i + 1)
  })

  const usedSessionIds = new Set()

  return workouts.map(w => {
    const wType = (w.WorkoutType || '').toLowerCase()
    if (wType !== 'strength') return w

    const day = w.WorkoutDay?.slice(0, 10)
    if (!day) return w

    // 1) Completed: check actual gym session from DB (pick first unused for this day)
    const daySessions = sessionsByDate.get(day) || []
    const session = daySessions.find(s => !usedSessionIds.has(s.id) && templateById[s.template_id])
    if (session) {
      usedSessionIds.add(session.id)
      const tmpl = templateById[session.template_id]
      return {
        ...w,
        _gymTemplate: tmpl,
        _gymSessionLogs: session.exercise_logs || [],
        _originalTitle: w.Title,
        Title: tmpl.name,
      }
    }

    // 2) Planned: use ordinal map (skip Strava-sourced workouts)
    if (w._source === 'strava') return w

    const key = `${day}|${w.Title || ''}`
    const ordinal = ordinalMap.get(key)
    if (!ordinal) return w

    const templateId = STRENGTH_MAP[ordinal]
    if (!templateId || !templateById[templateId]) return w

    const tmpl = templateById[templateId]
    return {
      ...w,
      _gymTemplate: tmpl,
      _originalTitle: w.Title,
      Title: tmpl.name,
    }
  })
}

function isRunType(workout) {
  const type = (workout.WorkoutType || '').toLowerCase()
  
  // Must contain "run"
  if (!type.includes('run')) return false
  
  // Exclude non-running types
  const excludeTypes = ['strength', 'custom', 'day off', 'rest', 'walk', 'recovery', 'yoga', 'stretch']
  for (const exclude of excludeTypes) {
    if (type.includes(exclude)) return false
  }
  
  return true
}

// Check if a workout is a COMPLETED run (has actual data)
export function isCompletedRun(workout) {
  // First check if it's a run type
  if (!isRunType(workout)) return false
  
  // Must have actual completed data (distance > 0 OR duration > 0)
  const distance = parseFloat(workout.DistanceInMeters) || 0
  const duration = parseFloat(workout.TimeTotalInHours) || 0
  
  return distance > 0 || duration > 0
}

// Check if a workout is a PLANNED run (future, no data yet)
export function isPlannedRun(workout) {
  if (!isRunType(workout)) return false
  
  const distance = parseFloat(workout.DistanceInMeters) || 0
  const duration = parseFloat(workout.TimeTotalInHours) || 0
  
  // No completed data means it's planned
  return distance === 0 && duration === 0
}

// Get year and week number from a date (ISO week: Monday-Sunday)
export function getISOYearWeek(date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  
  // ISO week: Monday (1) to Sunday (7)
  // Find Thursday of this week to determine which year/week it belongs to
  const dayOfWeek = d.getDay() || 7 // Convert Sunday from 0 to 7
  d.setDate(d.getDate() + 4 - dayOfWeek) // Go to Thursday
  
  const yearStart = new Date(d.getFullYear(), 0, 1)
  const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7)
  
  return { year: d.getFullYear(), week: weekNo }
}

// Format week key (e.g., "2025-49")
function getWeekKey(date) {
  const { year, week } = getISOYearWeek(date)
  return `${year}-${week.toString().padStart(2, '0')}`
}

// Convert velocity (m/s) to pace (min/km)
function velocityToPace(velocityMs) {
  if (!velocityMs || velocityMs <= 0) return null
  const kmPerSecond = velocityMs / 1000
  const secondsPerKm = 1 / kmPerSecond
  const minutesPerKm = secondsPerKm / 60
  return minutesPerKm
}

// Format pace as "M:SS"
export function formatPace(paceMinKm) {
  if (!paceMinKm || paceMinKm <= 0 || paceMinKm > 20) return '--:--'
  const minutes = Math.floor(paceMinKm)
  const seconds = Math.round((paceMinKm - minutes) * 60)
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

// Format duration as hours or minutes
export function formatDuration(hours) {
  if (!hours || hours <= 0) return '--'
  if (hours < 1) {
    return `${Math.round(hours * 60)}m`
  }
  return `${Math.round(hours * 10) / 10}h`
}

// Group workouts by ISO week
export function groupByWeek(workouts) {
  const groups = {}
  
  for (const workout of workouts) {
    if (!workout.date) continue
    const key = getWeekKey(workout.date)
    if (!groups[key]) {
      groups[key] = []
    }
    groups[key].push(workout)
  }
  
  return groups
}

// Extract HR zones from a workout (returns array of minutes per zone)
function extractHRZones(workout) {
  const zones = []
  for (let i = 1; i <= 5; i++) {
    const minutes = parseFloat(workout[`HRZone${i}Minutes`]) || 0
    zones.push(minutes)
  }
  return zones
}

// Get stats for a specific week's workouts (only COMPLETED runs)
function computeWeekStats(weekWorkouts, weekKey) {
  // Filter only COMPLETED running workouts (with actual data)
  const completedRuns = weekWorkouts.filter(w => isCompletedRun(w))
  
  // If no completed runs, return null (week will be skipped)
  if (completedRuns.length === 0) {
    return null
  }
  
  let totalDistanceMeters = 0
  let totalDurationHours = 0
  let totalHR = 0
  let hrCount = 0
  let totalPace = 0
  let paceCount = 0
  
  // Aggregate HR zones for the week
  const weekHRZones = [0, 0, 0, 0, 0]
  
  for (const workout of completedRuns) {
    const distance = parseFloat(workout.DistanceInMeters) || 0
    totalDistanceMeters += distance
    
    const duration = parseFloat(workout.TimeTotalInHours) || 0
    totalDurationHours += duration
    
    const hr = parseFloat(workout.HeartRateAverage) || 0
    if (hr > 0) {
      totalHR += hr
      hrCount++
    }
    
    const velocity = parseFloat(workout.VelocityAverage) || 0
    if (velocity > 0) {
      const pace = velocityToPace(velocity)
      if (pace && pace < 15) {
        totalPace += pace
        paceCount++
      }
    }
    
    // Aggregate HR zones
    const workoutZones = extractHRZones(workout)
    for (let i = 0; i < 5; i++) {
      weekHRZones[i] += workoutZones[i]
    }
  }
  
  // Process workouts with additional computed fields
  const workoutsWithDetails = completedRuns.map(w => {
    const distance = parseFloat(w.DistanceInMeters) || 0
    const velocity = parseFloat(w.VelocityAverage) || 0
    const pace = velocity > 0 ? velocityToPace(velocity) : null
    const hrZones = extractHRZones(w)
    const totalZoneMinutes = hrZones.reduce((a, b) => a + b, 0)
    
    return {
      ...w,
      distanceKm: Math.round(distance / 100) / 10,
      pace: pace,
      paceFormatted: formatPace(pace),
      hr: parseFloat(w.HeartRateAverage) || null,
      hrMax: parseFloat(w.HeartRateMax) || null,
      durationHours: parseFloat(w.TimeTotalInHours) || 0,
      cadence: parseFloat(w.CadenceAverage) || null,
      rpe: parseFloat(w.Rpe) || null,
      hrZones: hrZones,
      hrZonesTotal: totalZoneMinutes
    }
  }).sort((a, b) => new Date(b.WorkoutDay) - new Date(a.WorkoutDay))
  
  const totalWeekZoneMinutes = weekHRZones.reduce((a, b) => a + b, 0)
  
  return {
    weekKey,
    distanceKm: Math.round(totalDistanceMeters / 100) / 10,
    avgPace: paceCount > 0 ? totalPace / paceCount : null,
    avgHR: hrCount > 0 ? Math.round(totalHR / hrCount) : null,
    durationHours: Math.round(totalDurationHours * 10) / 10,
    workoutCount: completedRuns.length,
    workouts: workoutsWithDetails,
    hrZones: weekHRZones,
    hrZonesTotal: totalWeekZoneMinutes
  }
}

// Get current week's stats
export function getCurrentWeekStats(workouts) {
  const now = new Date()
  const currentWeekKey = getWeekKey(now)
  const grouped = groupByWeek(workouts)
  const currentWeekWorkouts = grouped[currentWeekKey] || []
  
  return computeWeekStats(currentWeekWorkouts, currentWeekKey)
}

// Get all weeks stats (sorted by week, newest first) - ONLY weeks with COMPLETED runs
export function getAllWeeksStats(workouts) {
  const grouped = groupByWeek(workouts)
  const stats = []
  
  for (const [weekKey, weekWorkouts] of Object.entries(grouped)) {
    const weekStats = computeWeekStats(weekWorkouts, weekKey)
    // Only add if weekStats is not null (has at least one completed run)
    if (weekStats !== null) {
      stats.push(weekStats)
    }
  }
  
  // Sort by week key descending (newest first)
  stats.sort((a, b) => b.weekKey.localeCompare(a.weekKey))
  
  return stats
}

// Get future workouts (WorkoutDay > today) - for Plan tab
export function getFutureWorkouts(workouts) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  return workouts
    .filter(w => w.date && w.date >= today)
    .sort((a, b) => a.date - b.date)
}

// Get past workouts (WorkoutDay < today)
export function getPastWorkouts(workouts) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  return workouts
    .filter(w => w.date && w.date < today)
    .sort((a, b) => b.date - a.date)
}

// Format date for display (e.g., "Mon · Dec 10")
export function formatWorkoutDate(date) {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  
  const dayName = days[date.getDay()]
  const monthName = months[date.getMonth()]
  const dayNum = date.getDate()
  
  return `${dayName} · ${monthName} ${dayNum}`
}

export default {
  hydrateWorkouts,
  mergeStravaActivities,
  groupByWeek,
  getCurrentWeekStats,
  getAllWeeksStats,
  getFutureWorkouts,
  getPastWorkouts,
  formatPace,
  formatDuration,
  formatWorkoutDate,
  getISOYearWeek,
  isCompletedRun,
  isPlannedRun
}
