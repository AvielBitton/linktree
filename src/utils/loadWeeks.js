/**
 * Loads weekly running statistics from CSV files
 * Files are stored in /data/weeks/ and listed in index.json
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

// Extract week number from filename (e.g., "2025-49.csv" -> { year: 2025, week: 49 })
function parseFilename(filename) {
  const match = filename.match(/(\d{4})-(\d{1,2})\.csv/)
  if (match) {
    return { year: parseInt(match[1]), week: parseInt(match[2]) }
  }
  return null
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
  if (!paceMinKm || paceMinKm <= 0) return '--:--'
  const minutes = Math.floor(paceMinKm)
  const seconds = Math.round((paceMinKm - minutes) * 60)
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

// Process a single week's CSV data
function processWeekData(csvData, filename) {
  const fileInfo = parseFilename(filename)
  if (!fileInfo) return null
  
  // Filter only running workouts
  const runWorkouts = csvData.filter(row => row.WorkoutType === 'Run')
  
  if (runWorkouts.length === 0) {
    return {
      year: fileInfo.year,
      week: fileInfo.week,
      distanceKm: 0,
      avgPace: null,
      avgHR: null,
      durationHours: 0,
      workoutCount: 0
    }
  }
  
  // Calculate totals
  let totalDistanceMeters = 0
  let totalDurationHours = 0
  let totalHR = 0
  let hrCount = 0
  let totalPace = 0
  let paceCount = 0
  
  for (const workout of runWorkouts) {
    // Distance
    const distance = parseFloat(workout.DistanceInMeters) || 0
    totalDistanceMeters += distance
    
    // Duration
    const duration = parseFloat(workout.TimeTotalInHours) || 0
    totalDurationHours += duration
    
    // Heart Rate (average across workouts)
    const hr = parseFloat(workout.HeartRateAverage) || 0
    if (hr > 0) {
      totalHR += hr
      hrCount++
    }
    
    // Pace (from velocity)
    const velocity = parseFloat(workout.VelocityAverage) || 0
    if (velocity > 0) {
      const pace = velocityToPace(velocity)
      if (pace && pace < 15) { // Sanity check: pace under 15 min/km
        totalPace += pace
        paceCount++
      }
    }
  }
  
  return {
    year: fileInfo.year,
    week: fileInfo.week,
    distanceKm: Math.round(totalDistanceMeters / 100) / 10, // Round to 1 decimal
    avgPace: paceCount > 0 ? totalPace / paceCount : null,
    avgHR: hrCount > 0 ? Math.round(totalHR / hrCount) : null,
    durationHours: Math.round(totalDurationHours * 10) / 10, // Round to 1 decimal
    workoutCount: runWorkouts.length
  }
}

// Main function to load all weeks
export async function loadWeeks() {
  try {
    // Load index.json
    const indexResponse = await fetch('./data/weeks/index.json')
    if (!indexResponse.ok) {
      throw new Error('Failed to load index.json')
    }
    const filenames = await indexResponse.json()
    
    if (!Array.isArray(filenames) || filenames.length === 0) {
      return []
    }
    
    // Load and process each CSV file
    const weeks = []
    for (const filename of filenames) {
      try {
        const csvResponse = await fetch(`./data/weeks/${filename}`)
        if (!csvResponse.ok) continue
        
        const csvText = await csvResponse.text()
        const csvData = parseCSV(csvText)
        const weekData = processWeekData(csvData, filename)
        
        if (weekData) {
          weeks.push(weekData)
        }
      } catch (err) {
        console.error(`Error loading ${filename}:`, err)
      }
    }
    
    // Sort by year and week (newest first)
    weeks.sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year
      return b.week - a.week
    })
    
    return weeks
  } catch (err) {
    console.error('Error loading weeks:', err)
    return []
  }
}

export default loadWeeks
