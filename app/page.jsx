import { loadWorkoutsFromDisk } from '@/lib/workouts'
import { loadStravaPRs } from '@/lib/strava'
import App from '@/src/App'

export default function HomePage() {
  const workouts = loadWorkoutsFromDisk()
  const stravaPRs = loadStravaPRs()
  const archiveWorkouts = loadWorkoutsFromDisk('telaviv2026/aviel')
  return <App initialWorkouts={workouts} stravaPRs={stravaPRs} archiveWorkouts={archiveWorkouts} />
}
