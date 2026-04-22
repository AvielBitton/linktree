'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import ExerciseCard from './ExerciseCard'
import ExerciseSwapModal from './ExerciseSwapModal'
import RestTimer from './RestTimer'
import SessionSummary from './SessionSummary'
import { saveActiveSession, clearActiveSession, getActiveSession, generateId } from '@/lib/gym-store'
import { getSessionToken } from '@/lib/auth-client'
import { saveWorkoutSession } from '@/lib/actions/gym'

function parseRepRange(reps) {
  if (!reps) return null
  const str = String(reps)
  const match = str.match(/^(\d+)\s*-\s*(\d+)$/)
  if (match) return { min: parseInt(match[1]), max: parseInt(match[2]) }
  const single = parseInt(str)
  return isNaN(single) ? null : { min: single, max: single }
}

function WorkoutSession({ template, allTemplates = [], customExercises = [], sessions = [], onFinish }) {
  const [startTime] = useState(() => Date.now())
  const [elapsed, setElapsed] = useState(0)
  const [completedSets, setCompletedSets] = useState({})
  const [extraSets, setExtraSets] = useState({})
  const [restTimer, setRestTimer] = useState(null)
  const [showSummary, setShowSummary] = useState(false)
  const [showFinishConfirm, setShowFinishConfirm] = useState(false)
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
  const [sessionId] = useState(() => generateId())
  const [swappedExercises, setSwappedExercises] = useState({})
  const [swapTarget, setSwapTarget] = useState(null)
  const [saveError, setSaveError] = useState(null)
  const scrollRef = useRef(null)

  const sessionExercises = useMemo(() =>
    template.exercises.map((ex, i) => swappedExercises[i] || ex),
    [template.exercises, swappedExercises]
  )

  const exercisePool = useMemo(() => {
    const map = new Map()
    for (const t of allTemplates) {
      for (const ex of (t.exercises || [])) {
        if (!map.has(ex.key)) map.set(ex.key, ex)
      }
    }
    for (const ex of customExercises) {
      if (!map.has(ex.key)) map.set(ex.key, { ...ex, sets: 3, reps: '8-12', rest: 60, superset: null })
    }
    return Array.from(map.values())
  }, [allTemplates, customExercises])

  const exerciseDataMap = useMemo(() => {
    const repRangeMap = {}
    for (const ex of sessionExercises) {
      repRangeMap[ex.key] = parseRepRange(ex.reps)
    }

    const map = {}
    for (const session of sessions) {
      const logs = session.exercise_logs || session.exerciseLogs || []
      for (const log of logs) {
        const key = log.exercise_key || log.exerciseKey
        if (!key) continue
        if (!map[key]) map[key] = { pr: 0, lastWeights: {} }
        const w = log.weight_kg || log.weightKg || 0
        const r = log.reps || 0
        const range = repRangeMap[key]
        const inRange = !range || (r >= range.min && r <= range.max)
        if (w > map[key].pr && inRange) map[key].pr = w
      }
    }
    const latestSession = sessions[0]
    if (latestSession) {
      const logs = latestSession.exercise_logs || latestSession.exerciseLogs || []
      for (const log of logs) {
        const key = log.exercise_key || log.exerciseKey
        const setNum = log.set_number || log.setNumber
        if (!key || !setNum) continue
        if (!map[key]) map[key] = { pr: 0, lastWeights: {} }
        map[key].lastWeights[setNum] = {
          weight: log.weight_kg || log.weightKg || 0,
          reps: log.reps || 0,
        }
      }
    }
    return map
  }, [sessions, sessionExercises])

  useEffect(() => {
    const saved = getActiveSession()
    if (saved && saved.templateId === template.id) {
      setCompletedSets(saved.completedSets || {})
      setExtraSets(saved.extraSets || {})
      if (saved.swappedExercises) setSwappedExercises(saved.swappedExercises)
    }
  }, [template.id])

  useEffect(() => {
    const timer = setInterval(() => setElapsed(Date.now() - startTime), 1000)
    return () => clearInterval(timer)
  }, [startTime])

  useEffect(() => {
    if (Object.keys(completedSets).length > 0 || Object.keys(extraSets).length > 0 || Object.keys(swappedExercises).length > 0) {
      saveActiveSession({ templateId: template.id, completedSets, extraSets, swappedExercises, startTime })
    }
  }, [completedSets, extraSets, swappedExercises, template.id, startTime])

  const handleSetComplete = useCallback((exerciseKey, setNum, weightKg, reps) => {
    const key = `${exerciseKey}_${setNum}`

    setCompletedSets(prev => {
      const wasAlreadyCompleted = !!prev[key]
      const next = { ...prev, [key]: { weightKg, reps, completedAt: Date.now() } }

      if (!wasAlreadyCompleted) {
        try { navigator.vibrate?.(50) } catch {}

        const exercise = sessionExercises.find(e => e.key === exerciseKey)
        if (exercise) {
          if (exercise.superset) {
            const ssGroup = sessionExercises.filter(e => e.superset === exercise.superset)
            const isLast = ssGroup.indexOf(exercise) === ssGroup.length - 1
            if (isLast && exercise.rest) setRestTimer(exercise.rest)
          } else if (exercise.rest) {
            setRestTimer(exercise.rest)
          }
        }
      }

      return next
    })
  }, [sessionExercises])

  const handleSetUncomplete = useCallback((exerciseKey, setNum) => {
    const key = `${exerciseKey}_${setNum}`
    setCompletedSets(prev => {
      const next = { ...prev }
      delete next[key]
      return next
    })
  }, [])

  const handleAddSet = useCallback((exerciseKey) => {
    setExtraSets(prev => ({
      ...prev,
      [exerciseKey]: (prev[exerciseKey] || 0) + 1,
    }))
  }, [])

  const handleSwapExercise = useCallback((originalIndex, newExercise) => {
    const oldKey = sessionExercises[originalIndex]?.key
    if (oldKey) {
      setCompletedSets(prev => {
        const next = {}
        for (const [k, v] of Object.entries(prev)) {
          if (!k.startsWith(oldKey + '_')) next[k] = v
        }
        return next
      })
      setExtraSets(prev => {
        const next = { ...prev }
        delete next[oldKey]
        return next
      })
    }
    setSwappedExercises(prev => ({ ...prev, [originalIndex]: newExercise }))
    setSwapTarget(null)
  }, [sessionExercises])

  const handleFinish = useCallback(async () => {
    const exerciseLogs = []
    for (const [key, data] of Object.entries(completedSets)) {
      const parts = key.split('_')
      const setNum = parseInt(parts.pop())
      const exerciseKey = parts.join('_')
      exerciseLogs.push({
        exerciseKey,
        setNumber: setNum,
        weightKg: data.weightKg,
        reps: data.reps,
      })
    }

    const sessionData = {
      id: sessionId,
      templateId: template.id,
      startedAt: new Date(startTime).toISOString(),
      finishedAt: new Date().toISOString(),
      durationSeconds: Math.floor((Date.now() - startTime) / 1000),
    }

    const token = getSessionToken()
    let saved = false
    if (token) {
      try {
        const result = await saveWorkoutSession(token, sessionData, exerciseLogs)
        if (result?.error) {
          setSaveError(result.error === 'Unauthorized'
            ? 'Session expired – please log in again and retry.'
            : `Save failed: ${result.error}`)
          return
        }
        saved = true
      } catch {
        setSaveError('Network error – check your connection and retry.')
        return
      }
    } else {
      setSaveError('Not logged in – please log in and retry.')
      return
    }

    if (saved) {
      clearActiveSession()
      setShowSummary({
        ...sessionData,
        templateName: template.name,
        exerciseLogs: exerciseLogs.map(l => ({
          ...l,
          exerciseName: sessionExercises.find(e => e.key === l.exerciseKey)?.name_en
            || sessionExercises.find(e => e.key === l.exerciseKey)?.name
            || l.exerciseKey,
        })),
      })
    }
  }, [completedSets, template, sessionExercises, sessionId, startTime])

  const totalSets = sessionExercises.reduce((sum, e) => sum + (e.sets || 3) + (extraSets[e.key] || 0), 0)
  const doneSets = Object.keys(completedSets).length
  const totalVolume = Object.values(completedSets).reduce(
    (sum, s) => sum + (s.weightKg || 0) * (s.reps || 0), 0
  )
  const mins = Math.floor(elapsed / 60000)
  const secs = Math.floor((elapsed % 60000) / 1000)
  const pct = totalSets > 0 ? (doneSets / totalSets) * 100 : 0

  const exercisesWithSupersets = groupExercises(sessionExercises)

  if (showSummary) {
    return (
      <AnimatePresence>
        <SessionSummary
          session={showSummary}
          templateColor={template.color}
          onClose={() => { setShowSummary(false); onFinish() }}
        />
      </AnimatePresence>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="min-h-screen"
    >
      <div className="sticky top-0 z-30 backdrop-blur-xl border-b border-white/[0.06] pb-3 pt-2 px-4 mb-4"
        style={{ backgroundColor: 'rgba(13,17,23,0.92)' }}
      >
        <div className="h-[2px] absolute top-0 left-0 right-0" style={{ backgroundColor: template.color + '40' }} />

        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setShowCancelConfirm(true)}
              className="w-7 h-7 -ml-1 rounded-lg flex items-center justify-center text-white/25 hover:text-white/50 hover:bg-white/[0.06] active:scale-90 transition-all"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
            <div className="w-2.5 h-2.5 rounded-full animate-pulse" style={{ backgroundColor: template.color }} />
            <span className="text-white font-bold text-sm tracking-tight">{template.name}</span>
          </div>
          <button
            onClick={() => setShowFinishConfirm(true)}
            className="px-4 py-1.5 rounded-lg text-xs font-bold active:scale-95 transition-all"
            style={{ backgroundColor: template.color + '20', color: template.color }}
          >
            Finish
          </button>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-5">
            <div className="text-center">
              <p className="text-white font-bold text-sm tabular-nums">{mins}:{secs.toString().padStart(2, '0')}</p>
              <p className="text-[10px] text-white/25 uppercase font-medium tracking-wider">Time</p>
            </div>
            <div className="w-px h-6 bg-white/[0.06]" />
            <div className="text-center">
              <p className="text-white font-bold text-sm tabular-nums">{doneSets}<span className="text-white/25">/{totalSets}</span></p>
              <p className="text-[10px] text-white/25 uppercase font-medium tracking-wider">Sets</p>
            </div>
            <div className="w-px h-6 bg-white/[0.06]" />
            <div className="text-center">
              <p className="text-white font-bold text-sm tabular-nums">{totalVolume.toLocaleString()}</p>
              <p className="text-[10px] text-white/25 uppercase font-medium tracking-wider">Vol</p>
            </div>
          </div>

          <div className="w-14 h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: template.color }}
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>
      </div>

      <div ref={scrollRef} className="space-y-2 pb-28 px-1">
        {exercisesWithSupersets.map((group, gi) => {
          if (group.isSuperset) {
            return (
              <div key={gi} className="relative rounded-2xl border border-purple-500/20 bg-purple-500/[0.03] p-1.5 space-y-1">
                <div className="absolute -top-2.5 left-3 px-2 py-0.5 rounded-md bg-purple-500/15 border border-purple-500/20">
                  <span className="text-[9px] font-bold text-purple-400 tracking-wider uppercase">Superset {group.label}</span>
                </div>
                {group.exercises.map((item, ei) => (
                  <ExerciseCard
                    key={item.exercise.key + '_' + ei}
                    exercise={item.exercise}
                    exerciseIndex={item.originalIndex}
                    completedSets={completedSets}
                    onSetComplete={handleSetComplete}
                    onSetUncomplete={handleSetUncomplete}
                    supersetLabel={`${group.label}${ei + 1}`}
                    isLastInSuperset={ei === group.exercises.length - 1}
                    templateColor={template.color}
                    pr={exerciseDataMap[item.exercise.key]?.pr || 0}
                    lastWeights={exerciseDataMap[item.exercise.key]?.lastWeights || {}}
                    extraSets={extraSets[item.exercise.key] || 0}
                    onAddSet={handleAddSet}
                    onSwap={() => setSwapTarget(item.originalIndex)}
                  />
                ))}
              </div>
            )
          }
          return (
            <ExerciseCard
              key={group.exercise.key + '_' + gi}
              exercise={group.exercise}
              exerciseIndex={group.originalIndex}
              completedSets={completedSets}
              onSetComplete={handleSetComplete}
              onSetUncomplete={handleSetUncomplete}
              templateColor={template.color}
              pr={exerciseDataMap[group.exercise.key]?.pr || 0}
              lastWeights={exerciseDataMap[group.exercise.key]?.lastWeights || {}}
              extraSets={extraSets[group.exercise.key] || 0}
              onAddSet={handleAddSet}
              onSwap={() => setSwapTarget(group.originalIndex)}
            />
          )
        })}
      </div>

      <AnimatePresence>
        {restTimer && (
          <RestTimer
            seconds={restTimer}
            templateColor={template.color}
            onDismiss={() => setRestTimer(null)}
            onFinish={() => setRestTimer(null)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {swapTarget !== null && (
          <ExerciseSwapModal
            exercisePool={exercisePool}
            allTemplates={allTemplates}
            currentExercise={sessionExercises[swapTarget]}
            templateColor={template.color}
            onSelect={ex => handleSwapExercise(swapTarget, ex)}
            onClose={() => setSwapTarget(null)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {saveError && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm flex items-center justify-center p-8"
            onClick={() => setSaveError(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-[#161B22] border border-red-500/20 rounded-2xl p-5 w-full max-w-xs shadow-2xl"
            >
              <div className="w-10 h-10 rounded-full bg-red-500/15 flex items-center justify-center mb-3">
                <svg className="w-5 h-5 text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              </div>
              <h3 className="text-white font-bold text-sm mb-1">Workout not saved</h3>
              <p className="text-white/40 text-xs mb-4">{saveError}</p>
              <p className="text-white/25 text-[10px] mb-4">Your workout data is still here. Log in and tap Finish again.</p>
              <button
                onClick={() => setSaveError(null)}
                className="w-full py-2.5 rounded-xl bg-white/[0.06] text-white/50 text-xs font-medium active:scale-[0.98] transition-all"
              >
                OK
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showFinishConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[65] bg-black/60 backdrop-blur-sm flex items-center justify-center p-8"
            onClick={() => setShowFinishConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-[#161B22] border border-white/[0.08] rounded-2xl p-5 w-full max-w-xs shadow-2xl"
            >
              <h3 className="text-white font-bold text-sm mb-1">Finish workout?</h3>
              <p className="text-white/30 text-xs mb-5">{doneSets}/{totalSets} sets completed · {totalVolume.toLocaleString()} kg</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowFinishConfirm(false)}
                  className="flex-1 py-2.5 rounded-xl bg-white/[0.06] text-white/50 text-xs font-medium active:scale-[0.98] transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={() => { setShowFinishConfirm(false); handleFinish() }}
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold active:scale-[0.98] transition-all"
                  style={{ backgroundColor: template.color + '25', color: template.color }}
                >
                  Finish
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showCancelConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[65] bg-black/60 backdrop-blur-sm flex items-center justify-center p-8"
            onClick={() => setShowCancelConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-[#161B22] border border-white/[0.08] rounded-2xl p-5 w-full max-w-xs shadow-2xl"
            >
              <h3 className="text-white font-bold text-sm mb-1">Cancel workout?</h3>
              <p className="text-white/30 text-xs mb-5">All progress will be lost. This cannot be undone.</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowCancelConfirm(false)}
                  className="flex-1 py-2.5 rounded-xl bg-white/[0.06] text-white/50 text-xs font-medium active:scale-[0.98] transition-all"
                >
                  Keep Training
                </button>
                <button
                  onClick={() => { setShowCancelConfirm(false); clearActiveSession(); onFinish() }}
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-red-500/15 text-red-400 border border-red-500/20 active:scale-[0.98] transition-all"
                >
                  Cancel Workout
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

function groupExercises(exercises) {
  const groups = []
  let i = 0
  while (i < exercises.length) {
    const ex = exercises[i]
    if (ex.superset) {
      const label = ex.superset
      const ssExercises = []
      while (i < exercises.length && exercises[i].superset === label) {
        ssExercises.push({ exercise: exercises[i], originalIndex: i })
        i++
      }
      groups.push({ isSuperset: true, label, exercises: ssExercises })
    } else {
      groups.push({ isSuperset: false, exercise: ex, originalIndex: i })
      i++
    }
  }
  return groups
}

export default WorkoutSession
