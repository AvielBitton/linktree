'use server'

import { revalidatePath } from 'next/cache'
import supabase from '@/lib/supabase'
import { validateToken } from '@/lib/auth'

export async function toggleMealCompletion(token, planId, mealId, date) {
  if (!await validateToken(token)) {
    return { error: 'Unauthorized' }
  }
  if (!planId || !mealId) {
    return { error: 'Missing plan or meal ID' }
  }
  const dateStr = date || new Date().toISOString().slice(0, 10)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return { error: 'Invalid date format' }
  }

  const { data: existing } = await supabase
    .from('meal_completions')
    .select('id')
    .eq('plan_id', planId)
    .eq('meal_id', mealId)
    .eq('date', dateStr)
    .maybeSingle()

  if (existing) {
    const { error } = await supabase
      .from('meal_completions')
      .delete()
      .eq('id', existing.id)
    if (error) return { error: error.message }
  } else {
    const { error } = await supabase
      .from('meal_completions')
      .insert({
        plan_id: planId,
        meal_id: mealId,
        date: dateStr,
        completed_at: new Date().toISOString(),
      })
    if (error) return { error: error.message }
  }

  revalidatePath('/')
  return { success: true, completed: !existing }
}

export async function completeDayMeals(token, planId, mealIds, date) {
  if (!await validateToken(token)) {
    return { error: 'Unauthorized' }
  }
  if (!planId || !Array.isArray(mealIds) || mealIds.length === 0) {
    return { error: 'Missing plan ID or meal IDs' }
  }
  const dateStr = date || new Date().toISOString().slice(0, 10)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return { error: 'Invalid date format' }
  }

  const { data: existing } = await supabase
    .from('meal_completions')
    .select('meal_id')
    .eq('plan_id', planId)
    .eq('date', dateStr)

  const alreadyCompleted = new Set((existing || []).map(r => r.meal_id))
  const toInsert = mealIds
    .filter(id => !alreadyCompleted.has(id))
    .map(mealId => ({
      plan_id: planId,
      meal_id: mealId,
      date: dateStr,
      completed_at: new Date().toISOString(),
    }))

  if (toInsert.length > 0) {
    const { error } = await supabase
      .from('meal_completions')
      .insert(toInsert)
    if (error) return { error: error.message }
  }

  revalidatePath('/')
  return { success: true }
}
