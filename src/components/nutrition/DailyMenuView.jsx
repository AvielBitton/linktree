'use client'

import { useState, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import MacroRing from './MacroRing'
import MealCard from './MealCard'
import { useEditMode } from '../../contexts/EditModeContext'
import { getSessionToken } from '@/lib/auth-client'
import { toggleMealCompletion as toggleMealAction, completeDayMeals as completeDayAction } from '@/lib/actions/nutrition'

function formatDate(date) {
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

function toDateStr(date) {
  return date.toISOString().slice(0, 10)
}

function DailyMenuView({ plan, completions = [] }) {
  const { editMode } = useEditMode()
  const [currentDate, setCurrentDate] = useState(() => new Date())
  const [slideDir, setSlideDir] = useState(0)
  const [optimisticCompletions, setOptimisticCompletions] = useState(new Set())
  const [pendingRemovals, setPendingRemovals] = useState(new Set())

  const dateStr = toDateStr(currentDate)
  const isToday = dateStr === toDateStr(new Date())

  const serverCompleted = useMemo(() => {
    return new Set(
      completions
        .filter(c => c.date === dateStr && c.plan_id === plan.id)
        .map(c => c.meal_id)
    )
  }, [completions, dateStr, plan.id])

  const completedMeals = useMemo(() => {
    const set = new Set(serverCompleted)
    optimisticCompletions.forEach(id => set.add(id))
    pendingRemovals.forEach(id => set.delete(id))
    return set
  }, [serverCompleted, optimisticCompletions, pendingRemovals])

  const meals = plan.meals || []
  const completedCount = meals.filter(m => completedMeals.has(m.id)).length
  const allCompleted = completedCount === meals.length

  const totals = useMemo(() => {
    return meals.reduce(
      (acc, m) => ({
        kcal: acc.kcal + m.target_kcal,
        protein: acc.protein + m.target_protein,
        carbs: acc.carbs + m.target_carbs,
        fat: acc.fat + m.target_fat,
      }),
      { kcal: 0, protein: 0, carbs: 0, fat: 0 }
    )
  }, [meals])

  const navigateDay = useCallback((offset) => {
    setSlideDir(offset)
    setOptimisticCompletions(new Set())
    setPendingRemovals(new Set())
    setCurrentDate(prev => {
      const next = new Date(prev)
      next.setDate(prev.getDate() + offset)
      return next
    })
  }, [])

  const handleToggle = useCallback(async (mealId) => {
    const token = getSessionToken()
    if (!token) {
      toast.error('Unlock edit mode first')
      return
    }

    const wasCompleted = completedMeals.has(mealId)
    if (wasCompleted) {
      setPendingRemovals(prev => new Set(prev).add(mealId))
    } else {
      setOptimisticCompletions(prev => new Set(prev).add(mealId))
    }

    const result = await toggleMealAction(token, plan.id, mealId, dateStr)
    if (result.error) {
      toast.error(result.error)
      if (wasCompleted) {
        setPendingRemovals(prev => { const s = new Set(prev); s.delete(mealId); return s })
      } else {
        setOptimisticCompletions(prev => { const s = new Set(prev); s.delete(mealId); return s })
      }
    }
  }, [completedMeals, plan.id, dateStr])

  const handleCompleteDay = useCallback(async () => {
    const token = getSessionToken()
    if (!token) {
      toast.error('Unlock edit mode first')
      return
    }

    const remaining = meals.filter(m => !completedMeals.has(m.id)).map(m => m.id)
    if (remaining.length === 0) return

    setOptimisticCompletions(prev => {
      const s = new Set(prev)
      remaining.forEach(id => s.add(id))
      return s
    })

    const result = await completeDayAction(token, plan.id, remaining, dateStr)
    if (result.error) {
      toast.error(result.error)
      setOptimisticCompletions(prev => {
        const s = new Set(prev)
        remaining.forEach(id => s.delete(id))
        return s
      })
    } else {
      toast.success('All meals completed!')
    }
  }, [meals, completedMeals, plan.id, dateStr])

  return (
    <div className="space-y-4">
      {/* Date Navigator */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigateDay(-1)}
          className="w-8 h-8 rounded-full flex items-center justify-center text-white/30 hover:text-white hover:bg-white/[0.06] transition-colors"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>

        <div className="text-center">
          <h2 className="text-white font-bold text-base">{formatDate(currentDate)}</h2>
          {isToday && (
            <span className="text-[10px] text-white/30 uppercase tracking-wider font-medium">Today</span>
          )}
        </div>

        <button
          onClick={() => navigateDay(1)}
          className="w-8 h-8 rounded-full flex items-center justify-center text-white/30 hover:text-white hover:bg-white/[0.06] transition-colors"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>

      {/* Macro Summary Ring */}
      <motion.div
        className="flex justify-center py-2"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
      >
        <MacroRing targets={totals} />
      </motion.div>

      {/* Compliance Bar (edit mode) */}
      {editMode && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="flex items-center gap-3"
        >
          <div className="flex-1 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-emerald-500"
              initial={{ width: 0 }}
              animate={{ width: `${meals.length > 0 ? (completedCount / meals.length) * 100 : 0}%` }}
              transition={{ duration: 0.4 }}
            />
          </div>
          <span className="text-xs text-white/40 font-medium flex-shrink-0">
            {completedCount}/{meals.length}
          </span>
        </motion.div>
      )}

      {/* Meal Cards */}
      <AnimatePresence mode="wait">
        <motion.div
          key={dateStr}
          initial={{ opacity: 0, x: slideDir * 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: slideDir * -30 }}
          transition={{ duration: 0.2 }}
          className="space-y-2"
        >
          {meals.map((meal) => (
            <MealCard
              key={meal.id}
              meal={meal}
              isCompleted={completedMeals.has(meal.id)}
              editMode={editMode}
              onToggleComplete={handleToggle}
            />
          ))}
        </motion.div>
      </AnimatePresence>

      {/* Complete Day Button (edit mode) */}
      {editMode && !allCompleted && (
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={handleCompleteDay}
          className="w-full py-3 rounded-xl bg-emerald-500 text-white font-semibold text-sm hover:bg-emerald-400 active:bg-emerald-600 transition-colors"
        >
          Complete Day
        </motion.button>
      )}

      {editMode && allCompleted && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-4"
        >
          <div className="text-emerald-400 text-sm font-semibold">All meals completed</div>
          <div className="text-white/20 text-xs mt-0.5">Great job staying on track!</div>
        </motion.div>
      )}
    </div>
  )
}

export default DailyMenuView
