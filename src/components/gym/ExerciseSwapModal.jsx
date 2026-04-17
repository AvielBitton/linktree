'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { getSessionToken } from '@/lib/auth-client'
import { addCustomExercise } from '@/lib/actions/gym'

function ExerciseSwapModal({ exercisePool = [], allTemplates = [], currentExercise, templateColor = '#10B981', onSelect, onClose }) {
  const [search, setSearch] = useState('')
  const [templateFilter, setTemplateFilter] = useState(null)
  const [addMode, setAddMode] = useState(false)
  const [newName, setNewName] = useState('')
  const [saving, setSaving] = useState(false)
  const searchRef = useRef(null)
  const newNameRef = useRef(null)

  useEffect(() => {
    if (addMode && newNameRef.current) {
      newNameRef.current.focus()
    } else if (!addMode && searchRef.current) {
      searchRef.current.focus()
    }
  }, [addMode])

  const { templateFilters, exerciseTemplateMap } = useMemo(() => {
    const filters = []
    const exMap = {}
    for (const t of allTemplates) {
      if (t.exercises?.length > 0) {
        filters.push({ id: t.id, name: t.name, color: t.color })
      }
      for (const ex of (t.exercises || [])) {
        if (!exMap[ex.key]) exMap[ex.key] = new Set()
        exMap[ex.key].add(t.id)
      }
    }
    return { templateFilters: filters, exerciseTemplateMap: exMap }
  }, [allTemplates])

  const filtered = useMemo(() => {
    return exercisePool.filter(ex => {
      if (ex.key === currentExercise?.key) return false
      if (templateFilter && !exerciseTemplateMap[ex.key]?.has(templateFilter)) return false
      if (search.trim()) {
        const q = search.toLowerCase()
        return (ex.name_en || '').toLowerCase().includes(q) ||
          (ex.name || '').toLowerCase().includes(q) ||
          (ex.key || '').toLowerCase().includes(q)
      }
      return true
    })
  }, [exercisePool, search, templateFilter, currentExercise?.key, exerciseTemplateMap])

  async function handleAddCustom() {
    const trimmed = newName.trim()
    if (!trimmed || saving) return
    setSaving(true)

    const isHebrew = /[\u0590-\u05FF]/.test(trimmed)
    const payload = isHebrew
      ? { name: trimmed, name_en: '' }
      : { name: trimmed, name_en: trimmed }

    const token = getSessionToken()
    if (token) {
      const result = await addCustomExercise(token, payload)
      if (result.exercise) {
        onSelect({ ...result.exercise, sets: 3, reps: '8-12', rest: 60, superset: null })
        setSaving(false)
        return
      }
    }

    const key = trimmed.toLowerCase().replace(/[^a-z0-9\u0590-\u05FF]+/g, '_').replace(/^_|_$/g, '') || 'custom_' + Date.now()
    onSelect({
      key,
      name: payload.name,
      name_en: payload.name_en || null,
      sets: 3,
      reps: '8-12',
      rest: 60,
      superset: null,
    })
    setSaving(false)
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[70] bg-black/70 backdrop-blur-sm flex flex-col"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        onClick={e => e.stopPropagation()}
        className="mt-auto bg-[#161B22] border-t border-white/[0.08] rounded-t-2xl max-h-[85vh] flex flex-col"
      >
        <div className="px-4 pt-4 pb-2 border-b border-white/[0.06] flex-shrink-0">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-white/40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="17 1 21 5 17 9" />
                <path d="M3 11V9a4 4 0 0 1 4-4h14" />
                <polyline points="7 23 3 19 7 15" />
                <path d="M21 13v2a4 4 0 0 1-4 4H3" />
              </svg>
              <h3 className="text-white font-bold text-sm">Swap Exercise</h3>
            </div>
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-full flex items-center justify-center text-white/30 hover:text-white/60 hover:bg-white/[0.06] transition-colors"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {currentExercise && (
            <p className="text-white/20 text-[11px] mb-2">
              Replacing: <span className="text-white/40">{currentExercise.name_en || currentExercise.key?.replace(/_/g, ' ')}</span>
            </p>
          )}

          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              ref={searchRef}
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search exercises..."
              className="w-full bg-white/[0.06] rounded-lg pl-9 pr-3 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:ring-1 focus:ring-white/20"
            />
          </div>

          {templateFilters.length > 0 && (
            <div className="flex gap-1.5 mt-2.5 overflow-x-auto pb-0.5 scrollbar-none">
              {templateFilters.map(t => (
                <button
                  key={t.id}
                  onClick={() => setTemplateFilter(prev => prev === t.id ? null : t.id)}
                  className={`flex-shrink-0 px-2.5 py-1 rounded-full text-[11px] font-medium transition-all active:scale-95 flex items-center gap-1.5 ${
                    templateFilter === t.id
                      ? ''
                      : 'bg-white/[0.05] text-white/30 hover:text-white/50'
                  }`}
                  style={templateFilter === t.id ? { backgroundColor: (t.color || templateColor) + '25', color: t.color || templateColor } : undefined}
                >
                  <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: t.color || '#888' }} />
                  {t.name}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain min-h-0">
          {filtered.length === 0 && (search.trim() || templateFilter) && (
            <div className="px-4 py-8 text-center">
              <p className="text-white/20 text-xs mb-1">No exercises found</p>
              <p className="text-white/15 text-[11px]">Try adding a custom exercise below</p>
            </div>
          )}

          {filtered.map(ex => (
            <button
              key={ex.key}
              onClick={() => onSelect({ ...ex, superset: currentExercise?.superset || null })}
              className="w-full px-4 py-3 flex items-center gap-3 hover:bg-white/[0.04] active:bg-white/[0.06] transition-colors border-b border-white/[0.03] text-left"
            >
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: templateColor + '15' }}
              >
                <svg className="w-4 h-4" style={{ color: templateColor }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6.5 6.5a2 2 0 0 1 2-2h0a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2h0a2 2 0 0 1-2-2z" />
                  <path d="M13.5 6.5a2 2 0 0 1 2-2h0a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2h0a2 2 0 0 1-2-2z" />
                  <path d="M4 12h2.5" /><path d="M17.5 12H20" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-[13px] font-medium truncate">
                  {ex.name_en || ex.key?.replace(/_/g, ' ')}
                </p>
                {ex.name && ex.name !== ex.name_en && (
                  <p className="text-white/20 text-[11px] truncate">{ex.name}</p>
                )}
              </div>
              {ex.sets && (
                <span className="text-[10px] text-white/15 flex-shrink-0">{ex.sets}×{ex.reps}</span>
              )}
            </button>
          ))}
        </div>

        <div className="px-4 py-3 border-t border-white/[0.06] flex-shrink-0">
          <AnimatePresence mode="wait">
            {addMode ? (
              <motion.div
                key="add-form"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <p className="text-white/30 text-[11px] mb-2">Type exercise name (Hebrew or English)</p>
                <div className="flex gap-2">
                  <input
                    ref={newNameRef}
                    type="text"
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAddCustom()}
                    placeholder="e.g. Physiotherapy Legs"
                    className="flex-1 bg-white/[0.06] rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-white/15 focus:outline-none focus:ring-1 focus:ring-white/20"
                    dir="auto"
                  />
                  <button
                    onClick={handleAddCustom}
                    disabled={!newName.trim() || saving}
                    className="px-4 py-2.5 rounded-lg text-xs font-bold transition-all active:scale-95 disabled:opacity-30"
                    style={{ backgroundColor: templateColor + '25', color: templateColor }}
                  >
                    {saving ? '...' : 'Add'}
                  </button>
                </div>
                <button
                  onClick={() => { setAddMode(false); setNewName('') }}
                  className="mt-2 text-white/20 text-[11px] hover:text-white/40 transition-colors"
                >
                  Cancel
                </button>
              </motion.div>
            ) : (
              <motion.button
                key="add-btn"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setAddMode(true)}
                className="w-full py-2.5 rounded-xl border border-dashed border-white/[0.1] text-white/25 text-xs font-medium hover:text-white/40 hover:border-white/[0.15] active:scale-[0.98] transition-all flex items-center justify-center gap-1.5"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Add Custom Exercise
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default ExerciseSwapModal
