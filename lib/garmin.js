import fs from 'fs'
import path from 'path'

export function loadGarminHealth() {
  const filePath = path.join(process.cwd(), 'public', 'data', 'aviel', 'garmin-health.json')

  try {
    const raw = fs.readFileSync(filePath, 'utf-8')
    const data = JSON.parse(raw)
    return data.days || []
  } catch {
    return []
  }
}
