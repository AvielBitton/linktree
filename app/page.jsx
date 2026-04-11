import { loadWorkoutsFromDisk } from '@/lib/workouts'
import { loadStravaPRs, loadStravaActivities } from '@/lib/strava'
import supabase from '@/lib/supabase'
import { WORKOUT_TEMPLATES } from '@/lib/gym-data'
import App from '@/src/App'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const workouts = loadWorkoutsFromDisk()
  const stravaPRs = loadStravaPRs()
  const stravaActivities = loadStravaActivities()
  const archiveWorkouts = loadWorkoutsFromDisk('telaviv2026/aviel')

  let gymTemplates = WORKOUT_TEMPLATES
  let gymSessions = []
  let gymWeights = []

  try {
    const [templatesRes, sessionsRes, weightsRes] = await Promise.all([
      supabase.from('workout_templates').select('*').order('sort_order'),
      supabase.from('workout_sessions').select('*, exercise_logs(*)').order('started_at', { ascending: false }),
      supabase.from('weight_logs').select('*').order('date', { ascending: false }),
    ])
    if (templatesRes.data?.length > 0) gymTemplates = templatesRes.data
    if (sessionsRes.data) gymSessions = sessionsRes.data
    if (weightsRes.data) gymWeights = weightsRes.data
  } catch {
    // Falls back to hardcoded templates and empty sessions/weights
  }

  return (
    <App
      initialWorkouts={workouts}
      stravaPRs={stravaPRs}
      stravaActivities={stravaActivities}
      archiveWorkouts={archiveWorkouts}
      gymTemplates={gymTemplates}
      gymSessions={gymSessions}
      gymWeights={gymWeights}
    />
  )
}
