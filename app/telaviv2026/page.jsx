import { loadWorkoutsFromDisk } from '@/lib/workouts'
import TelAviv2026App from '@/src/TelAviv2026App'

export default function TelAviv2026Page() {
  const workouts = loadWorkoutsFromDisk('telaviv2026/aviel')
  return <TelAviv2026App initialWorkouts={workouts} dataPath="telaviv2026/aviel" />
}
