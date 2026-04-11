'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import DailyMenuView from './nutrition/DailyMenuView'
import PlanTimeline from './nutrition/PlanTimeline'

function NutritionTab({ plans = [], completions = [] }) {
  const activePlan = useMemo(() => plans.find(p => p.active) || plans[0], [plans])
  const [selectedPlanId, setSelectedPlanId] = useState(activePlan?.id)
  const [showPlanPicker, setShowPlanPicker] = useState(false)

  const currentPlan = useMemo(
    () => plans.find(p => p.id === selectedPlanId) || activePlan,
    [plans, selectedPlanId, activePlan]
  )

  if (!currentPlan) {
    return (
      <div className="text-center py-16">
        <div className="text-white/20 text-sm">No meal plans available</div>
      </div>
    )
  }

  return (
    <div>
      {/* Plan Switcher */}
      {plans.length > 1 && (
        <div className="mb-4 space-y-1">
          <div className="flex justify-center">
            <button
              onClick={() => setShowPlanPicker(!showPlanPicker)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.06] border border-white/[0.08] text-white text-xs font-semibold hover:bg-white/[0.1] transition-colors"
            >
              {currentPlan.name}
              <svg
                className={`w-3 h-3 text-white/40 transition-transform duration-200 ${showPlanPicker ? 'rotate-180' : ''}`}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
          </div>

          <AnimatePresence>
            {showPlanPicker && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.15 }}
                className="overflow-hidden"
              >
                <div className="mx-auto max-w-[200px] bg-[#1C2128] border border-white/[0.12] rounded-xl shadow-2xl overflow-hidden">
                  {plans.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => {
                        setSelectedPlanId(p.id)
                        setShowPlanPicker(false)
                      }}
                      className={`w-full px-4 py-2.5 text-left text-xs font-medium transition-colors ${
                        p.id === selectedPlanId
                          ? 'text-white bg-white/[0.06]'
                          : 'text-white/50 hover:text-white hover:bg-white/[0.04]'
                      }`}
                    >
                      <span>{p.name}</span>
                      {p.active && (
                        <span className="ml-2 text-emerald-400 text-[10px]">active</span>
                      )}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Single plan badge */}
      {plans.length === 1 && (
        <div className="flex justify-center mb-4">
          <span className="px-3 py-1 rounded-full bg-white/[0.06] text-white/60 text-xs font-semibold">
            {currentPlan.name}
          </span>
        </div>
      )}

      {plans.length > 1 && plans.some(p => p.start_date) && (
        <PlanTimeline plans={plans} activePlanId={currentPlan.id} />
      )}

      <DailyMenuView plan={currentPlan} completions={completions} />
    </div>
  )
}

export default NutritionTab
