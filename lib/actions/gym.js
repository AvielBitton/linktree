'use server'

import { revalidatePath } from 'next/cache'
import supabase from '@/lib/supabase'
import { validateToken } from '@/lib/auth'

export async function saveWorkoutSession(token, sessionData, exerciseLogs) {
  if (!await validateToken(token)) {
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

export async function deleteWorkoutSession(token, sessionId) {
  if (!await validateToken(token)) {
    return { error: 'Unauthorized' }
  }
  if (!sessionId) {
    return { error: 'Missing session ID' }
  }

  const { error: logsError } = await supabase
    .from('exercise_logs')
    .delete()
    .eq('session_id', sessionId)

  if (logsError) return { error: logsError.message }

  const { error: sessionError } = await supabase
    .from('workout_sessions')
    .delete()
    .eq('id', sessionId)

  if (sessionError) return { error: sessionError.message }

  revalidatePath('/')
  return { success: true }
}

export async function logWeight(token, weightKg, date) {
  if (!await validateToken(token)) {
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

export async function addCustomExercise(token, { name, name_en }) {
  if (!await validateToken(token)) {
    return { error: 'Unauthorized' }
  }
  const label = name_en || name
  if (!label || !label.trim()) {
    return { error: 'Exercise name is required' }
  }
  const key = label.trim().toLowerCase().replace(/[^a-z0-9\u0590-\u05FF]+/g, '_').replace(/^_|_$/g, '') || 'custom_' + Date.now()

  const row = { key, name: name || label, name_en: name_en || null }
  const { data, error } = await supabase
    .from('custom_exercises')
    .upsert(row, { onConflict: 'key' })
    .select()
    .single()

  if (error) return { error: error.message }

  revalidatePath('/')
  return { success: true, exercise: data }
}

export async function saveTemplates(token, templates) {
  if (!await validateToken(token)) {
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
