'use server'

import { revalidatePath } from 'next/cache'
import supabase from '@/lib/supabase'
import { validateToken } from '@/lib/auth'

export async function saveWorkoutSession(token, sessionData, exerciseLogs) {
  if (!validateToken(token)) {
    return { error: 'Unauthorized' }
  }
  if (!sessionData?.templateId || !sessionData?.id) {
    return { error: 'Missing session data' }
  }
  if (!Array.isArray(exerciseLogs)) {
    return { error: 'Invalid exercise logs' }
  }

  const { error: sessionError } = await supabase
    .from('workout_sessions')
    .insert({
      id: sessionData.id,
      template_id: sessionData.templateId,
      started_at: sessionData.startedAt,
      finished_at: sessionData.finishedAt,
      duration_sec: sessionData.durationSeconds,
      notes: sessionData.notes || null,
    })

  if (sessionError) return { error: sessionError.message }

  if (exerciseLogs.length > 0) {
    const { error: logsError } = await supabase
      .from('exercise_logs')
      .insert(exerciseLogs.map(log => ({
        session_id: sessionData.id,
        exercise_key: log.exerciseKey,
        set_number: log.setNumber,
        weight_kg: log.weightKg || 0,
        reps: log.reps || 0,
        completed: true,
      })))
    if (logsError) return { error: logsError.message }
  }

  revalidatePath('/')
  return { success: true }
}

export async function logWeight(token, weightKg, date) {
  if (!validateToken(token)) {
    return { error: 'Unauthorized' }
  }
  const w = parseFloat(weightKg)
  if (!w || w <= 0 || w > 500) {
    return { error: 'Invalid weight' }
  }
  const dateStr = date || new Date().toISOString().slice(0, 10)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return { error: 'Invalid date format' }
  }

  const { error } = await supabase
    .from('weight_logs')
    .upsert({ date: dateStr, weight_kg: w }, { onConflict: 'date' })

  if (error) return { error: error.message }

  revalidatePath('/')
  return { success: true }
}

export async function saveTemplates(token, templates) {
  if (!validateToken(token)) {
    return { error: 'Unauthorized' }
  }
  if (!Array.isArray(templates)) {
    return { error: 'Invalid templates' }
  }

  const rows = templates.map(t => ({
    id: t.id,
    name: t.name,
    name_he: t.name_he || null,
    color: t.color || null,
    muscles: t.muscles || [],
    sort_order: t.sort_order ?? 0,
    exercises: t.exercises || [],
  }))

  const { error } = await supabase
    .from('workout_templates')
    .upsert(rows, { onConflict: 'id' })

  if (error) return { error: error.message }

  revalidatePath('/')
  return { success: true }
}
