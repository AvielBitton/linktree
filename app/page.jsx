import { loadWorkoutsFromDisk } from '@/lib/workouts'
import { loadStravaPRs, loadStravaActivities } from '@/lib/strava'
import App from '@/src/App'

export default function HomePage() {
  const workouts = loadWorkoutsFromDisk()
  const stravaPRs = loadStravaPRs()
  const stravaActivities = loadStravaActivities()
  const archiveWorkouts = loadWorkoutsFromDisk('telaviv2026/aviel')
  return <App initialWorkouts={workouts} stravaPRs={stravaPRs} stravaActivities={stravaActivities} archiveWorkouts={archiveWorkouts} />
}
