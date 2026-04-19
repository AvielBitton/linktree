import { loadWorkoutsFromDisk } from '@/lib/workouts'
import { loadStravaPRs, loadStravaActivities } from '@/lib/strava'
import { loadGarminHealth } from '@/lib/garmin'
import supabase from '@/lib/supabase'
import { WORKOUT_TEMPLATES } from '@/lib/gym-data'
import { MEAL_PLANS } from '@/lib/nutrition-data'
import App from '@/src/App'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const workouts = loadWorkoutsFromDisk()
  const stravaPRs = loadStravaPRs()
  const stravaActivities = loadStravaActivities()
  const garminHealth = loadGarminHealth()
  const archiveWorkouts = loadWorkoutsFromDisk('telaviv2026/aviel')

  let gymTemplates = WORKOUT_TEMPLATES
  let gymSessions = []
  let gymWeights = []
  let customExercises = []
  let mealPlans = MEAL_PLANS
  let mealCompletions = []

  try {
    const [templatesRes, sessionsRes, weightsRes, customExRes, mealPlansRes, mealCompletionsRes] = await Promise.all([
      supabase.from('workout_templates').select('*').order('sort_order'),
      supabase.from('workout_sessions').select('*, exercise_logs(*)').order('started_at', { ascending: false }),
      supabase.from('weight_logs').select('*').order('date', { ascending: false }),
      supabase.from('custom_exercises').select('*').order('created_at', { ascending: false }),
      supabase.from('meal_plans').select('*').order('created_at', { ascending: false }),
      supabase.from('meal_completions').select('*').order('date', { ascending: false }).limit(200),
    ])
    if (templatesRes.data?.length > 0) gymTemplates = templatesRes.data
    if (sessionsRes.data) gymSessions = sessionsRes.data
    if (weightsRes.data) gymWeights = weightsRes.data
    if (customExRes.data) customExercises = customExRes.data
    if (mealPlansRes.data?.length > 0) mealPlans = mealPlansRes.data
    if (mealCompletionsRes.data) mealCompletions = mealCompletionsRes.data
  } catch {
    // Falls back to hardcoded templates and empty sessions/weights
  }

  const now = new Date()
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  const scheduledPlan = mealPlans.find(
    p => p.start_date && p.end_date && today >= p.start_date && today <= p.end_date
  )
  if (scheduledPlan) {
    mealPlans = mealPlans.map(p => ({ ...p, active: p.id === scheduledPlan.id }))
  }

  return (
    <App
      initialWorkouts={workouts}
      stravaPRs={stravaPRs}
      stravaActivities={stravaActivities}
      garminHealth={garminHealth}
      archiveWorkouts={archiveWorkouts}
      gymTemplates={gymTemplates}
      gymSessions={gymSessions}
      gymWeights={gymWeights}
      customExercises={customExercises}
      mealPlans={mealPlans}
      mealCompletions={mealCompletions}
    />
  )
}
