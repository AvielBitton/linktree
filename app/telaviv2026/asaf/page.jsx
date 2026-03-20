import { loadWorkoutsFromDisk } from '@/lib/workouts'
import TraineeApp from '@/src/TraineeApp'

export default function AsafPage() {
  const workouts = loadWorkoutsFromDisk('telaviv2026/asaf')
  return <TraineeApp initialWorkouts={workouts} traineeId="asaf" dataPath="telaviv2026/asaf" />
}
