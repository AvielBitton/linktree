'use client'

import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import WorkoutTemplates from './gym/WorkoutTemplates'
import WorkoutSession from './gym/WorkoutSession'
import EditMode from './gym/EditMode'
import { useEditMode } from '../contexts/EditModeContext'

function GymTab({ templates = [], sessions = [] }) {
  const { editMode } = useEditMode()
  const [activeSession, setActiveSession] = useState(null)
  const [showEdit, setShowEdit] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  function handleStartWorkout(template) {
    setActiveSession(template)
  }

  function handleFinishWorkout() {
    setActiveSession(null)
  }

  function handleEditClose() {
    setShowEdit(false)
    setRefreshKey(k => k + 1)
  }

  return (
    <div>
      <AnimatePresence mode="wait">
        {activeSession ? (
          <WorkoutSession
            key="session"
            template={activeSession}
            sessions={sessions}
            onFinish={handleFinishWorkout}
          />
        ) : (
          <motion.div
            key={`templates-${refreshKey}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <WorkoutTemplates
              templates={templates}
              sessions={sessions}
              onStartWorkout={editMode ? handleStartWorkout : undefined}
              editMode={editMode}
            />

            {editMode && (
              <button
                onClick={() => setShowEdit(true)}
                className="mt-6 w-full py-2.5 rounded-xl border border-dashed border-white/[0.06] text-white/15 text-xs hover:text-white/30 hover:border-white/[0.1] transition-all"
              >
                Edit Templates
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showEdit && <EditMode templates={templates} onClose={handleEditClose} />}
      </AnimatePresence>
    </div>
  )
}

export default GymTab
