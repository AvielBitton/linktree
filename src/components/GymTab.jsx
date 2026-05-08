'use client'

import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import WorkoutTemplates from './gym/WorkoutTemplates'
import WorkoutSession from './gym/WorkoutSession'
import EditMode from './gym/EditMode'
import RecentWorkoutsCard from './gym/RecentWorkoutsCard'
import { useEditMode } from '../contexts/EditModeContext'
import { isCompletedRun } from '@/src/utils/workouts'
import { getActiveProgram, saveActiveProgram } from '@/lib/gym-store'

const PROGRAMS = [
  { id: 'abc_recomp', label: 'ABC Recomp' },
  { id: 'classic', label: 'Classic' },
]

function ProgramSwitcher({ activeProgram, onChange }) {
  return (
    <div className="flex gap-1 p-1 mb-4 rounded-xl bg-white/[0.04] border border-white/[0.06]">
      {PROGRAMS.map(p => (
        <button
          key={p.id}
          onClick={() => onChange(p.id)}
          className={[
            'flex-1 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all',
            activeProgram === p.id
              ? 'bg-white/10 text-white'
              : 'text-white/30 hover:text-white/50',
          ].join(' ')}
        >
          {p.label}
        </button>
      ))}
    </div>
  )
}

function GymTab({ templates = [], sessions = [], workouts = [], customExercises = [], onNavigateHome }) {
  const { editMode } = useEditMode()
  const [activeSession, setActiveSession] = useState(null)
  const [showEdit, setShowEdit] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const [activeProgram, setActiveProgram] = useState('abc_recomp')

  useEffect(() => {
    setActiveProgram(getActiveProgram())
  }, [])

  const runWorkouts = useMemo(() => (workouts || []).filter(isCompletedRun), [workouts])

  const filteredTemplates = useMemo(() => {
    // If templates have no program field yet (before DB column is added), show all
    const hasProgramField = templates.some(t => t.program != null)
    if (!hasProgramField) return templates
    return templates.filter(t => t.program === activeProgram)
  }, [templates, activeProgram])

  function handleProgramChange(programId) {
    setActiveProgram(programId)
    saveActiveProgram(programId)
  }

  function handleStartWorkout(template) {
    setActiveSession(template)
  }

  function handleFinishWorkout() {
    setActiveSession(null)
    onNavigateHome?.()
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
            allTemplates={filteredTemplates}
            customExercises={customExercises}
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
            <RecentWorkoutsCard templates={templates} sessions={sessions} runWorkouts={runWorkouts} count={5} />
            <ProgramSwitcher activeProgram={activeProgram} onChange={handleProgramChange} />
            <WorkoutTemplates
              templates={filteredTemplates}
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
