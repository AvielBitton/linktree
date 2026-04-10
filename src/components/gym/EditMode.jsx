'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { generateId } from '@/lib/gym-store'
import { useEditMode } from '@/src/contexts/EditModeContext'
import { getSessionToken } from '@/lib/auth-client'
import { saveTemplates as saveTemplatesAction } from '@/lib/actions/gym'

function EditMode({ templates: initialTemplates = [], onClose }) {
  const { editMode, lock } = useEditMode()
  const [templates, setTemplatesState] = useState(initialTemplates)

  async function handleSave() {
    const token = getSessionToken()
    if (token) {
      await saveTemplatesAction(token, templates)
    }
    onClose()
  }

  function handleLogout() {
    lock()
    onClose()
  }

  function updateExercise(templateId, exerciseIdx, field, value) {
    setTemplatesState(prev => prev.map(t => {
      if (t.id !== templateId) return t
      const exercises = [...t.exercises]
      exercises[exerciseIdx] = { ...exercises[exerciseIdx], [field]: value }
      return { ...t, exercises }
    }))
  }

  function removeExercise(templateId, exerciseIdx) {
    setTemplatesState(prev => prev.map(t => {
      if (t.id !== templateId) return t
      const exercises = t.exercises.filter((_, i) => i !== exerciseIdx)
      return { ...t, exercises }
    }))
  }

  function addExercise(templateId) {
    setTemplatesState(prev => prev.map(t => {
      if (t.id !== templateId) return t
      return {
        ...t,
        exercises: [...t.exercises, {
          key: 'new_' + generateId(),
          name: 'New Exercise',
          sets: 3,
          reps: '8-12',
          rest: 60,
          superset: null,
        }],
      }
    }))
  }

  function moveExercise(templateId, fromIdx, direction) {
    const toIdx = fromIdx + direction
    setTemplatesState(prev => prev.map(t => {
      if (t.id !== templateId) return t
      if (toIdx < 0 || toIdx >= t.exercises.length) return t
      const exercises = [...t.exercises]
      const temp = exercises[fromIdx]
      exercises[fromIdx] = exercises[toIdx]
      exercises[toIdx] = temp
      return { ...t, exercises }
    }))
  }

  if (!editMode) {
    onClose()
    return null
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[80] bg-[#0D1117] overflow-y-auto"
    >
      <div className="max-w-lg mx-auto px-5 py-6 pb-24">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-white font-bold text-lg">Edit Templates</h2>
          <div className="flex gap-2">
            <button onClick={handleLogout} className="px-3 py-1.5 text-xs text-white/30 hover:text-white/50 transition-colors">
              Logout
            </button>
            <button onClick={handleSave} className="px-4 py-1.5 bg-emerald-500/15 text-emerald-400 rounded-lg text-xs font-bold hover:bg-emerald-500/25 active:scale-95 transition-all">
              Save
            </button>
          </div>
        </div>

        <div className="space-y-6">
          {templates.map(template => (
            <div key={template.id} className="bg-white/[0.03] rounded-xl p-4 border border-white/[0.04]">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-3 h-3 rounded" style={{ backgroundColor: template.color }} />
                <h3 className="text-white font-bold text-sm">{template.name}</h3>
                <span className="text-[10px] text-white/25">{template.exercises.length} exercises</span>
              </div>

              <div className="space-y-2">
                {template.exercises.map((ex, ei) => (
                  <div key={ei} className="bg-white/[0.03] rounded-lg p-2.5 flex items-center gap-2">
                    <div className="flex flex-col gap-0.5">
                      <button
                        onClick={() => moveExercise(template.id, ei, -1)}
                        disabled={ei === 0}
                        className="text-white/15 hover:text-white/40 disabled:opacity-30 transition-colors"
                      >
                        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="18 15 12 9 6 15" /></svg>
                      </button>
                      <button
                        onClick={() => moveExercise(template.id, ei, 1)}
                        disabled={ei === template.exercises.length - 1}
                        className="text-white/15 hover:text-white/40 disabled:opacity-30 transition-colors"
                      >
                        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9" /></svg>
                      </button>
                    </div>

                    <div className="flex-1 min-w-0 space-y-1">
                      <input
                        value={ex.name}
                        onChange={e => updateExercise(template.id, ei, 'name', e.target.value)}
                        className="w-full bg-transparent text-white text-xs font-medium focus:outline-none"
                        dir="rtl"
                      />
                      <div className="flex gap-2">
                        <input
                          value={ex.sets}
                          onChange={e => updateExercise(template.id, ei, 'sets', parseInt(e.target.value) || 0)}
                          className="w-10 bg-white/[0.06] rounded px-1.5 py-0.5 text-[10px] text-white/50 text-center focus:outline-none"
                          placeholder="sets"
                        />
                        <input
                          value={ex.reps}
                          onChange={e => updateExercise(template.id, ei, 'reps', e.target.value)}
                          className="w-14 bg-white/[0.06] rounded px-1.5 py-0.5 text-[10px] text-white/50 text-center focus:outline-none"
                          placeholder="reps"
                        />
                        <input
                          value={ex.rest || ''}
                          onChange={e => updateExercise(template.id, ei, 'rest', parseInt(e.target.value) || 0)}
                          className="w-12 bg-white/[0.06] rounded px-1.5 py-0.5 text-[10px] text-white/50 text-center focus:outline-none"
                          placeholder="rest(s)"
                        />
                        <input
                          value={ex.superset || ''}
                          onChange={e => updateExercise(template.id, ei, 'superset', e.target.value || null)}
                          className="w-8 bg-white/[0.06] rounded px-1.5 py-0.5 text-[10px] text-purple-400/60 text-center focus:outline-none"
                          placeholder="SS"
                        />
                      </div>
                    </div>

                    <button
                      onClick={() => removeExercise(template.id, ei)}
                      className="text-red-400/30 hover:text-red-400/60 transition-colors flex-shrink-0"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                    </button>
                  </div>
                ))}
              </div>

              <button
                onClick={() => addExercise(template.id)}
                className="w-full mt-2 py-2 rounded-lg border border-dashed border-white/[0.08] text-white/20 text-xs hover:text-white/40 hover:border-white/[0.15] transition-all"
              >
                + Add Exercise
              </button>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  )
}

export default EditMode
