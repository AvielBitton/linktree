'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import MacroBar from './MacroBar'

const MEAL_COLORS = {
  'breakfast': '#3B82F6',
  'snack': '#14B8A6',
  'lunch': '#EAB308',
  'dinner': '#F97316',
  'free': '#A855F7',
}

function getMealColor(mealId) {
  if (mealId.startsWith('breakfast')) return MEAL_COLORS.breakfast
  if (mealId.startsWith('snack')) return MEAL_COLORS.snack
  if (mealId.startsWith('lunch')) return MEAL_COLORS.lunch
  if (mealId.startsWith('dinner')) return MEAL_COLORS.dinner
  if (mealId.startsWith('free')) return MEAL_COLORS.free
  return MEAL_COLORS.snack
}

function MealCard({ meal, isCompleted, editMode, onToggleComplete, activeAlt = null, onAltChange }) {
  const [expanded, setExpanded] = useState(false)
  const color = getMealColor(meal.id)

  const hasAlts = meal.alternatives?.length > 0
  const currentAlt = hasAlts ? meal.alternatives.find(a => a.id === activeAlt) : null
  const activeFoods = currentAlt ? currentAlt.foods : meal.foods
  const activeMacros = currentAlt
    ? { kcal: currentAlt.target_kcal, protein: currentAlt.target_protein, carbs: currentAlt.target_carbs, fat: currentAlt.target_fat }
    : { kcal: meal.target_kcal, protein: meal.target_protein, carbs: meal.target_carbs, fat: meal.target_fat }

  const variants = hasAlts
    ? [{ id: null, name: meal.name }, ...meal.alternatives.map(a => ({ id: a.id, name: a.name }))]
    : []

  return (
    <motion.div
      layout
      className={`rounded-xl border transition-colors duration-300 ${
        isCompleted
          ? 'bg-emerald-500/[0.04] border-emerald-500/20'
          : 'bg-white/[0.02] border-white/[0.06]'
      }`}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left px-4 py-3 flex items-center gap-3"
      >
        {editMode && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={(e) => {
              e.stopPropagation()
              onToggleComplete?.(meal.id)
            }}
            className="flex-shrink-0"
          >
            <div
              className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
                isCompleted
                  ? 'bg-emerald-500 border-emerald-500'
                  : 'border-white/20 hover:border-white/40'
              }`}
            >
              {isCompleted && (
                <motion.svg
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="w-3.5 h-3.5 text-white"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </motion.svg>
              )}
            </div>
          </motion.button>
        )}

        <div
          className="w-1 h-8 rounded-full flex-shrink-0"
          style={{ backgroundColor: color }}
        />

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <h3 className={`text-sm font-semibold transition-all ${
                isCompleted ? 'text-white/40 line-through' : 'text-white'
              }`}>
                {meal.name}
              </h3>
              {hasAlts && (
                <svg className="w-3 h-3 text-white/20 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="17 1 21 5 17 9" />
                  <path d="M3 11V9a4 4 0 0 1 4-4h14" />
                  <polyline points="7 23 3 19 7 15" />
                  <path d="M21 13v2a4 4 0 0 1-4 4H3" />
                </svg>
              )}
            </div>
            <MacroBar macros={activeMacros} />
          </div>
        </div>

        <svg
          className={`w-4 h-4 text-white/20 flex-shrink-0 transition-transform duration-200 ${
            expanded ? 'rotate-180' : ''
          }`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-3 border-t border-white/[0.04]">
              {hasAlts && (
                <div className="flex gap-1 mt-2 mb-1 overflow-x-auto no-scrollbar">
                  {variants.map(v => (
                    <button
                      key={v.id ?? 'default'}
                      onClick={(e) => { e.stopPropagation(); onAltChange?.(meal.id, v.id) }}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold tracking-wide transition-all whitespace-nowrap ${
                        activeAlt === v.id
                          ? 'bg-white/[0.1] text-white'
                          : 'text-white/30 hover:text-white/50'
                      }`}
                    >
                      {v.name}
                    </button>
                  ))}
                </div>
              )}
              <table className="w-full mt-2">
                <thead>
                  <tr className="text-[10px] text-white/25 uppercase tracking-wider">
                    <th className="text-left font-medium pb-1.5">Food</th>
                    <th className="text-right font-medium pb-1.5 w-14">Kcal</th>
                    <th className="text-right font-medium pb-1.5 w-10">P</th>
                    <th className="text-right font-medium pb-1.5 w-10">C</th>
                    <th className="text-right font-medium pb-1.5 w-10">F</th>
                  </tr>
                </thead>
                <tbody>
                  {activeFoods.map((food, i) => (
                    <tr key={i} className="text-xs">
                      <td className="py-1 text-white/70 pr-2">
                        <div className="break-words">{food.name}</div>
                        <span className="text-white/25 text-[10px]">
                          {food.qty} {food.unit}
                        </span>
                      </td>
                      <td className="py-1 text-right text-white/50 font-medium">{food.kcal}</td>
                      <td className="py-1 text-right text-white/40">{food.protein}g</td>
                      <td className="py-1 text-right text-white/40">{food.carbs}g</td>
                      <td className="py-1 text-right text-white/40">{food.fat}g</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default MealCard
