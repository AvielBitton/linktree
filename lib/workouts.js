import fs from 'fs'
import path from 'path'

function parseCSV(csvText) {
  const lines = csvText.trim().split('\n')
  if (lines.length < 2) return []

  const headers = lines[0].split(',').map(h => h.replace(/^"|"$/g, ''))

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

export function loadWorkoutsFromDisk(traineeId = null) {
  const basePath = path.join(process.cwd(), 'public', 'data', traineeId || 'aviel')

  let workouts2025 = []
  let workouts2026 = []
  let extra = {}

  try {
    const csv2025 = fs.readFileSync(path.join(basePath, '2025.csv'), 'utf-8')
    workouts2025 = parseCSV(csv2025)
  } catch { /* file may not exist */ }

  try {
    const csv2026 = fs.readFileSync(path.join(basePath, '2026.csv'), 'utf-8')
    workouts2026 = parseCSV(csv2026)
  } catch { /* file may not exist */ }

  try {
    const extraJson = fs.readFileSync(path.join(basePath, '2026-extra.json'), 'utf-8')
    extra = JSON.parse(extraJson)
  } catch { /* file may not exist */ }

  const allWorkouts = [...workouts2025, ...workouts2026]
  const thresholdSpeed = extra._thresholdSpeed || null

  return allWorkouts
    .map(w => {
      const day = w.WorkoutDay ? w.WorkoutDay.slice(0, 10) : ''
      const key = `${day}_${w.Title || ''}`
      const extraData = extra[key] || {}
      return { ...w, ...extraData, thresholdSpeed }
    })
    .filter(w => w.WorkoutDay && w.WorkoutDay.trim() !== '')
}
