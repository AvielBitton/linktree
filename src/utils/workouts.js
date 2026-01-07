/**
 * Unified workouts data module
 * Loads and processes all workouts from a single CSV file
 */

// Parse CSV string into array of objects
function parseCSV(csvText) {
  const lines = csvText.trim().split('\n')
  if (lines.length < 2) return []
  
  // Parse header row (remove quotes)
  const headers = lines[0].split(',').map(h => h.replace(/^"|"$/g, ''))
  
  // Parse data rows
  const data = []
  for (let i = 1; i < lines.length; i++) {
    const values = []
    let current = ''
    let inQuotes = false
    
    for (const char of lines[i]) {
      if (char === '"') {
        inQuotes = !inQuotes
      } else if (char === ',' && !inQuotes) {
        values.push(current.replace(/^"|"$/g, ''))
        current = ''
      } else {
        current += char
      }
    }
    values.push(current.replace(/^"|"$/g, ''))
    
    const row = {}
    headers.forEach((header, idx) => {
      row[header] = values[idx] || ''
    })
    data.push(row)
  }
  
  return data
}

// Check if a workout is a real run (type check only)
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

// Load workouts from a single CSV file
async function loadCSVFile(filename) {
  const response = await fetch(`./data/${filename}`)
  if (!response.ok) {
    console.warn(`Failed to load ${filename}`)
    return []
  }
  const csvText = await response.text()
  return parseCSV(csvText)
}

// Load all workouts from both year files (2025 + 2026)
export async function loadWorkouts() {
  try {
    // Load both years in parallel
    const [workouts2025, workouts2026] = await Promise.all([
      loadCSVFile('2025.csv'),
      loadCSVFile('2026.csv')
    ])
    
    // Merge all workouts
    const allWorkouts = [...workouts2025, ...workouts2026]
    
    return allWorkouts.map(w => ({
      ...w,
      date: w.WorkoutDay ? new Date(w.WorkoutDay) : null
    })).filter(w => w.date && !isNaN(w.date.getTime()))
  } catch (err) {
    console.error('Error loading workouts:', err)
    return []
  }
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
  }
  
  return {
    weekKey,
    distanceKm: Math.round(totalDistanceMeters / 100) / 10,
    avgPace: paceCount > 0 ? totalPace / paceCount : null,
    avgHR: hrCount > 0 ? Math.round(totalHR / hrCount) : null,
    durationHours: Math.round(totalDurationHours * 10) / 10,
    workoutCount: completedRuns.length
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
  loadWorkouts,
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
