import { loadWorkoutsFromDisk } from '@/lib/workouts'
import App from '@/src/App'

export default function HomePage() {
  const workouts = loadWorkoutsFromDisk()
  return <App initialWorkouts={workouts} />
}
