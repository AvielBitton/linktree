'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import YouTubeModal from './YouTubeModal'
import { getSessionToken } from '@/lib/auth-client'
import { deleteWorkoutSession } from '@/lib/actions/gym'

function estimateDuration(template) {
  let totalSeconds = 0
  const exercises = template.exercises
  for (let i = 0; i < exercises.length; i++) {
    const ex = exercises[i]
    const sets = ex.sets || 3
    const setExecution = sets * 50
    const restBetweenSets = (ex.rest || 0) * (sets - 1)
    totalSeconds += setExecution + restBetweenSets

    if (i < exercises.length - 1) {
      const next = exercises[i + 1]
      const sameSuperset = ex.superset && next.superset === ex.superset
      totalSeconds += sameSuperset ? 15 : 120
    }
  }
  return Math.round(totalSeconds / 60)
}

function getLastSessionVolume(session) {
  const logs = session?.exercise_logs || session?.exerciseLogs
  if (!logs) return 0
  return logs.reduce((s, l) => s + (l.weight_kg || l.weightKg || 0) * (l.reps || 0), 0)
}

function formatDuration(sec) {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return s > 0 ? `${m}m${s}s` : `${m}m`
}

function WorkoutTemplates({ templates = [], sessions = [], onStartWorkout, editMode = false }) {
  const [expandedId, setExpandedId] = useState(null)
  const [activeVideo, setActiveVideo] = useState(null)
  const [showHistory, setShowHistory] = useState({})
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const sessionsByTemplate = useMemo(() => {
    const map = {}
    for (const s of sessions) {
      const tid = s.template_id || s.templateId
      if (!tid || !s.finished_at && !s.finishedAt) continue
      if (!map[tid]) map[tid] = []
      map[tid].push(s)
    }
    return map
  }, [sessions])

  return (
    <div className="space-y-3">
      {activeVideo && (
        <YouTubeModal
          videoId={activeVideo.videoId}
          title={activeVideo.title}
          onClose={() => setActiveVideo(null)}
        />
      )}

      <div className="flex items-center justify-between mb-2">
        <h2 className="text-white font-bold text-base tracking-tight">Workout Templates</h2>
        <span className="text-[10px] text-white/25 font-medium">{templates.length} programs</span>
      </div>

      {templates.map((template, i) => {
        const templateSessions = sessionsByTemplate[template.id] || []
        const lastSession = templateSessions[0] || null
        const sessionCount = templateSessions.length
        const isExpanded = expandedId === template.id
        const totalSets = template.exercises.reduce((sum, e) => sum + (e.sets || 3), 0)
        const ssGroups = new Set(template.exercises.filter(e => e.superset).map(e => e.superset)).size
        const estMins = estimateDuration(template)
        const lastVolume = getLastSessionVolume(lastSession)

        return (
          <motion.div
            key={template.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className="rounded-xl overflow-hidden border border-white/[0.06] bg-white/[0.03]"
          >
            <div className="h-[3px] w-full" style={{ background: `linear-gradient(90deg, ${template.color}40, ${template.color}10)` }} />

            <button
              onClick={() => setExpandedId(isExpanded ? null : template.id)}
              className="w-full text-left px-4 pt-3.5 pb-3"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center text-base font-bold shadow-lg"
                    style={{ backgroundColor: template.color + '20', color: template.color, boxShadow: `0 4px 12px ${template.color}15` }}
                  >
                    {template.name[0]}
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-sm tracking-tight">{template.name}</h3>
                    <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                      {(template.muscles || []).slice(0, 3).map(m => (
                        <span
                          key={m}
                          className="text-[10px] px-1.5 py-0.5 rounded-md font-medium"
                          style={{ backgroundColor: template.color + '12', color: template.color + 'CC' }}
                        >
                          {m}
                        </span>
                      ))}
                      {(template.muscles || []).length > 3 && (
                        <span className="text-[10px] text-white/20">+{template.muscles.length - 3}</span>
                      )}
                    </div>
                  </div>
                </div>

                <motion.svg
                  animate={{ rotate: isExpanded ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                  className="w-4 h-4 text-white/20 mt-1.5"
                  viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                >
                  <polyline points="6 9 12 15 18 9" />
                </motion.svg>
              </div>

              <div className="flex items-center gap-3 mt-2.5 text-[10px] text-white/25">
                <span>{template.exercises.length} exercises</span>
                <span className="text-white/10">·</span>
                <span>{totalSets} sets</span>
                {ssGroups > 0 && (
                  <>
                    <span className="text-white/10">·</span>
                    <span className="text-purple-400/60">{ssGroups} SS</span>
                  </>
                )}
                <span className="text-white/10">·</span>
                <span>~{estMins} min</span>
              </div>

              {(lastSession || sessionCount > 0) && (
                <div className="flex items-center gap-3 mt-1.5 text-[10px]">
                  {lastSession && (
                    <span className="text-white/20">
                      Last: {new Date(lastSession.finished_at || lastSession.finishedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                      {lastVolume > 0 && <span className="text-white/15"> · {lastVolume.toLocaleString()} kg</span>}
                    </span>
                  )}
                  {sessionCount > 0 && (
                    <span className="text-white/15">{sessionCount}x completed</span>
                  )}
                </div>
              )}
            </button>

            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="overflow-hidden"
                >
                  <div className="px-3 pb-4 border-t border-white/[0.04]">
                    <div className="pt-3 space-y-1">
                      {template.exercises.map((ex, ei) => {
                        const isSuperset = !!ex.superset
                        const nextIsSameSuperset = isSuperset && template.exercises[ei + 1]?.superset === ex.superset
                        const prevIsSameSuperset = isSuperset && template.exercises[ei - 1]?.superset === ex.superset
                        const isFirstInSS = isSuperset && !prevIsSameSuperset
                        const isLastInSS = isSuperset && !nextIsSameSuperset

                        return (
                          <div key={ei} className="relative">
                            {isSuperset && (
                              <div
                                className="absolute left-[13px] w-[2px]"
                                style={{
                                  backgroundColor: '#A78BFA40',
                                  top: isFirstInSS ? '50%' : 0,
                                  bottom: isLastInSS ? '50%' : 0,
                                }}
                              />
                            )}
                            <div className={`flex items-center gap-2 py-1.5 px-1.5 rounded-lg ${isSuperset ? 'bg-purple-500/[0.03]' : 'hover:bg-white/[0.02]'} transition-colors`}>
                              <div
                                className="w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold flex-shrink-0 relative z-10"
                                style={isSuperset
                                  ? { backgroundColor: '#A78BFA18', color: '#A78BFA' }
                                  : { backgroundColor: template.color + '10', color: template.color + '80' }
                                }
                              >
                                {isSuperset ? ex.superset : String.fromCharCode(65 + ei)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <p className="text-[12px] text-white/55 truncate leading-tight">{ex.name_en || ex.key.replace(/_/g, ' ')}</p>
                                  {ex.videoId && (
                                    <button
                                      onClick={(e) => { e.stopPropagation(); setActiveVideo({ videoId: ex.videoId, title: ex.name_en || ex.key.replace(/_/g, ' ') }) }}
                                      className="flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center bg-red-500/15 text-red-400 hover:bg-red-500/25 transition-colors"
                                      title="Watch tutorial"
                                    >
                                      <svg className="w-2 h-2 ml-[0.5px]" viewBox="0 0 24 24" fill="currentColor">
                                        <polygon points="5 3 19 12 5 21 5 3" />
                                      </svg>
                                    </button>
                                  )}
                                </div>
                                <p className="text-[10px] text-white/20 truncate leading-tight mt-0.5">{ex.name}</p>
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <span
                                  className="text-[10px] font-semibold tabular-nums px-1.5 py-0.5 rounded-md"
                                  style={{ backgroundColor: template.color + '0C', color: template.color + '90' }}
                                >
                                  {ex.sets}×{ex.reps}
                                </span>
                                {ex.tempo && (
                                  <span className="text-[10px] text-white/20 font-mono bg-white/[0.03] px-1.5 py-0.5 rounded-md">
                                    {ex.tempo}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    {templateSessions.length > 0 && (
                      <div className="mt-3 border-t border-white/[0.04] pt-3">
                        <button
                          onClick={(e) => { e.stopPropagation(); setShowHistory(prev => ({ ...prev, [template.id]: !prev[template.id] })) }}
                          className="flex items-center gap-1.5 text-[10px] text-white/25 font-medium hover:text-white/40 transition-colors"
                        >
                          <motion.svg
                            animate={{ rotate: showHistory[template.id] ? 90 : 0 }}
                            transition={{ duration: 0.15 }}
                            className="w-3 h-3"
                            viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                          >
                            <polyline points="9 18 15 12 9 6" />
                          </motion.svg>
                          History ({templateSessions.length})
                        </button>

                        <AnimatePresence>
                          {showHistory[template.id] && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="overflow-hidden"
                            >
                              <div className="mt-2 space-y-1">
                                {templateSessions.map(session => {
                                  const vol = getLastSessionVolume(session)
                                  const dur = session.duration_sec || session.durationSeconds || 0
                                  const date = new Date(session.finished_at || session.finishedAt)
                                  return (
                                    <div key={session.id} className="flex items-center justify-between py-1.5 px-2 rounded-lg bg-white/[0.02] group">
                                      <div className="flex items-center gap-3 text-[10px]">
                                        <span className="text-white/30 tabular-nums">
                                          {date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' })}
                                        </span>
                                        {dur > 0 && (
                                          <span className="text-white/15 tabular-nums">{formatDuration(dur)}</span>
                                        )}
                                        {vol > 0 && (
                                          <span className="text-white/15 tabular-nums">{vol.toLocaleString()} kg</span>
                                        )}
                                      </div>
                                      {editMode && (
                                        <button
                                          onClick={(e) => { e.stopPropagation(); setDeleteConfirm(session.id) }}
                                          className="w-6 h-6 rounded-md flex items-center justify-center text-white/15 hover:text-red-400 hover:bg-red-500/10 transition-all active:scale-90"
                                        >
                                          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <polyline points="3 6 5 6 21 6" />
                                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                          </svg>
                                        </button>
                                      )}
                                    </div>
                                  )
                                })}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )}

                    {onStartWorkout ? (
                      <button
                        onClick={(e) => { e.stopPropagation(); onStartWorkout(template) }}
                        className="w-full mt-4 py-3.5 rounded-xl text-sm font-bold transition-all active:scale-[0.97]"
                        style={{
                          background: `linear-gradient(135deg, ${template.color}30, ${template.color}18)`,
                          color: template.color,
                          border: `1px solid ${template.color}25`,
                        }}
                      >
                        Start Workout
                      </button>
                    ) : (
                      <div className="mt-4 py-2.5 rounded-xl text-xs text-center text-white/15 border border-white/[0.04]">
                        Unlock to start workout
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )
      })}

      <AnimatePresence>
        {deleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[65] bg-black/60 backdrop-blur-sm flex items-center justify-center p-8"
            onClick={() => setDeleteConfirm(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-[#161B22] border border-white/[0.08] rounded-2xl p-5 w-full max-w-xs shadow-2xl"
            >
              <h3 className="text-white font-bold text-sm mb-1">Delete session?</h3>
              <p className="text-white/30 text-xs mb-5">This workout session will be permanently deleted.</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  disabled={deleting}
                  className="flex-1 py-2.5 rounded-xl bg-white/[0.06] text-white/50 text-xs font-medium active:scale-[0.98] transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    setDeleting(true)
                    const token = getSessionToken()
                    if (token) {
                      await deleteWorkoutSession(token, deleteConfirm)
                    }
                    setDeleting(false)
                    setDeleteConfirm(null)
                  }}
                  disabled={deleting}
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-red-500/15 text-red-400 border border-red-500/20 active:scale-[0.98] transition-all disabled:opacity-50"
                >
                  {deleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default WorkoutTemplates
