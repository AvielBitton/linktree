import fs from 'fs'
import path from 'path'

export function loadStravaPRs() {
  const filePath = path.join(process.cwd(), 'public', 'data', 'aviel', 'strava-prs.json')

  try {
    const raw = fs.readFileSync(filePath, 'utf-8')
    const data = JSON.parse(raw)
    return data.records || []
  } catch {
    return []
  }
}
