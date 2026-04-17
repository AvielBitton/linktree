'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import YouTubeModal from './YouTubeModal'

function formatRest(seconds) {
  if (!seconds) return ''
  if (seconds >= 60) {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return s > 0 ? `${m}m${s}s` : `${m}m`
  }
  return `${seconds}s`
}

function parseRepRange(reps) {
  if (!reps) return null
  const str = String(reps)
  const match = str.match(/^(\d+)\s*-\s*(\d+)$/)
  if (match) return { min: parseInt(match[1]), max: parseInt(match[2]) }
  const single = parseInt(str)
  return isNaN(single) ? null : { min: single, max: single }
}

function ExerciseCard({ exercise, exerciseIndex, onSetComplete, onSetUncomplete, completedSets = {}, supersetLabel, isLastInSuperset, templateColor = '#10B981', pr = 0, lastWeights = {}, extraSets = 0, onAddSet, onSwap }) {
  const setCount = (exercise.sets || 3) + extraSets
  const sets = Array.from({ length: setCount }, (_, i) => i + 1)
  const [showVideo, setShowVideo] = useState(false)

  const allCompleted = sets.every(s => completedSets[`${exercise.key}_${s}`])
  const borderColor = supersetLabel ? 'border-l-2 border-l-purple-500/30' : ''

  return (
    <div
      className={`rounded-xl overflow-hidden border ${borderColor}`}
      style={{
        backgroundColor: allCompleted ? templateColor + '0A' : 'rgba(255,255,255,0.03)',
        borderColor: allCompleted ? templateColor + '30' : 'rgba(255,255,255,0.05)',
      }}
    >
      {showVideo && exercise.videoId && (
        <YouTubeModal
          videoId={exercise.videoId}
          title={exercise.name_en || exercise.key.replace(/_/g, ' ')}
          onClose={() => setShowVideo(false)}
        />
      )}

      <div className="px-4 pt-3 pb-2">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className={`font-semibold text-[13px] leading-tight ${allCompleted ? 'text-white/50' : 'text-white'}`}>
                {exercise.name_en || exercise.key.replace(/_/g, ' ')}
              </p>
              {allCompleted && (
                <span className="flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-md" style={{ backgroundColor: templateColor + '20', color: templateColor }}>
                  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Done
                </span>
              )}
              {exercise.videoId && (
                <button
                  onClick={() => setShowVideo(true)}
                  className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center bg-red-500/15 text-red-400 hover:bg-red-500/25 transition-colors"
                  title="Watch tutorial"
                >
                  <svg className="w-2.5 h-2.5 ml-[1px]" viewBox="0 0 24 24" fill="currentColor">
                    <polygon points="5 3 19 12 5 21 5 3" />
                  </svg>
                </button>
              )}
              {onSwap && (
                <button
                  onClick={onSwap}
                  className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center bg-white/[0.06] text-white/25 hover:bg-white/[0.12] hover:text-white/50 transition-colors"
                  title="Swap exercise"
                >
                  <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="17 1 21 5 17 9" />
                    <path d="M3 11V9a4 4 0 0 1 4-4h14" />
                    <polyline points="7 23 3 19 7 15" />
                    <path d="M21 13v2a4 4 0 0 1-4 4H3" />
                  </svg>
                </button>
              )}
            </div>
            <p className="text-white/25 text-[11px] mt-0.5 leading-tight">
              {exercise.name}
            </p>
            <div className="flex items-center gap-1.5 mt-2 flex-wrap">
              <span
                className="text-[10px] font-semibold tabular-nums px-1.5 py-0.5 rounded-md"
                style={{ backgroundColor: templateColor + '12', color: templateColor + 'CC' }}
              >
                {exercise.sets}×{exercise.reps}
              </span>
              {exercise.rest && (!supersetLabel || isLastInSuperset) && (
                <span className="text-[10px] text-white/20 bg-white/[0.04] px-1.5 py-0.5 rounded-md">
                  {supersetLabel ? 'SS ' : ''}{formatRest(exercise.rest)} rest
                </span>
              )}
              {exercise.tempo && (
                <span className="text-[10px] bg-white/[0.04] text-white/25 px-1.5 py-0.5 rounded-md font-mono">
                  {exercise.tempo}
                </span>
              )}
              {supersetLabel && (
                <span className="text-[10px] font-bold text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded-md">
                  SS {supersetLabel}
                </span>
              )}
              {pr > 0 && (
                <span className="text-[10px] font-medium text-amber-400/60 bg-amber-500/[0.08] px-1.5 py-0.5 rounded-md">
                  PR {pr}kg
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 pb-3">
        <div className="grid grid-cols-[24px_1fr_1fr_1fr_36px] gap-x-1.5 mb-1 px-0.5">
          <span className="text-[10px] text-white/15 uppercase font-medium">Set</span>
          <span className="text-[10px] text-white/15 uppercase font-medium text-center">Prev</span>
          <span className="text-[10px] text-white/15 uppercase font-medium text-center">kg</span>
          <span className="text-[10px] text-white/15 uppercase font-medium text-center">Reps</span>
          <span />
        </div>

        {sets.map(setNum => {
          const setKey = `${exercise.key}_${setNum}`
          const completed = completedSets[setKey]
          const lastWeight = lastWeights[setNum] || null

          return (
            <SetRow
              key={setNum}
              setNum={setNum}
              lastWeight={lastWeight}
              pr={pr}
              targetReps={exercise.reps}
              completed={completed}
              templateColor={templateColor}
              onComplete={(w, r) => onSetComplete(exercise.key, setNum, w, r)}
              onUncomplete={() => onSetUncomplete(exercise.key, setNum)}
            />
          )
        })}

        {onAddSet && (
          <button
            onClick={() => onAddSet(exercise.key)}
            className="w-full mt-1 py-1.5 rounded-lg border border-dashed border-white/[0.08] text-white/20 text-[11px] font-medium flex items-center justify-center gap-1 hover:bg-white/[0.03] hover:text-white/30 active:scale-[0.98] transition-all"
          >
            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Add Set
          </button>
        )}
      </div>
    </div>
  )
}

function SetRow({ setNum, lastWeight, pr, targetReps, completed, templateColor, onComplete, onUncomplete }) {
  const [weight, setWeight] = useState(completed?.weightKg?.toString() || '')
  const [reps, setReps] = useState(completed?.reps?.toString() || '')
  const [showPR, setShowPR] = useState(false)
  const [editing, setEditing] = useState(false)

  useEffect(() => {
    if (completed && !editing) {
      setWeight(completed.weightKg?.toString() || '')
      setReps(completed.reps?.toString() || '')
    }
  }, [completed, editing])

  function handleCheck() {
    if (completed && !editing) {
      setEditing(true)
      onUncomplete()
      return
    }
    const w = parseFloat(weight) || 0
    const r = parseInt(reps) || 0
    const range = parseRepRange(targetReps)
    const inRange = !range || (r >= range.min && r <= range.max)
    if (pr && w > pr && inRange) setShowPR(true)
    setEditing(false)
    onComplete(w, r)
  }

  const isLocked = !!completed && !editing

  return (
    <motion.div
      className={`grid grid-cols-[24px_1fr_1fr_1fr_36px] gap-x-1.5 items-center py-1 px-0.5 rounded-lg transition-colors relative`}
      initial={false}
      animate={completed ? { scale: [1, 1.02, 1] } : {}}
      transition={{ duration: 0.15 }}
      style={completed ? { backgroundColor: templateColor + '14' } : undefined}
    >
      {completed && (
        <div className="absolute left-0 top-1 bottom-1 w-[3px] rounded-full" style={{ backgroundColor: templateColor + '90' }} />
      )}

      <span className={`text-xs font-bold text-center tabular-nums ${completed ? 'text-white/40' : 'text-white/20'}`}
        style={completed ? { color: templateColor + '80' } : undefined}
      >
        {setNum}
      </span>

      <div className="text-center">
        <span className="text-[10px] text-white/15 tabular-nums">
          {lastWeight ? `${lastWeight.weight}×${lastWeight.reps}` : '—'}
        </span>
      </div>

      {isLocked ? (
        <div className="w-full rounded-lg px-2 py-2 text-sm text-center font-semibold tabular-nums" style={{ backgroundColor: templateColor + '12', color: templateColor }}>
          {weight || '0'}
        </div>
      ) : (
        <input
          type="number"
          inputMode="decimal"
          value={weight}
          onChange={e => setWeight(e.target.value)}
          placeholder={lastWeight ? String(lastWeight.weight) : '—'}
          className="w-full bg-white/[0.06] rounded-lg px-2 py-2 text-sm text-white text-center font-medium tabular-nums placeholder:text-white/10 focus:outline-none focus:ring-1 focus:ring-white/20 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />
      )}

      {isLocked ? (
        <div className="w-full rounded-lg px-2 py-2 text-sm text-center font-semibold tabular-nums" style={{ backgroundColor: templateColor + '12', color: templateColor }}>
          {reps || '0'}
        </div>
      ) : (
        <input
          type="number"
          inputMode="numeric"
          value={reps}
          onChange={e => setReps(e.target.value)}
          placeholder={targetReps || '—'}
          className="w-full bg-white/[0.06] rounded-lg px-2 py-2 text-sm text-white text-center font-medium tabular-nums placeholder:text-white/10 focus:outline-none focus:ring-1 focus:ring-white/20 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />
      )}

      <button
        onClick={handleCheck}
        className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
          editing
            ? 'bg-white/[0.06] text-white/20 hover:bg-white/[0.1] hover:text-white/40 active:scale-90 ring-1 ring-amber-500/40'
            : completed
              ? 'scale-105'
              : 'bg-white/[0.06] text-white/20 hover:bg-white/[0.1] hover:text-white/40 active:scale-90'
        }`}
        style={completed && !editing ? { backgroundColor: templateColor + '35', color: templateColor } : undefined}
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </button>

      <AnimatePresence>
        {showPR && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.5 }}
            onAnimationComplete={() => setTimeout(() => setShowPR(false), 2000)}
            className="absolute -top-3 right-8 bg-amber-500/20 border border-amber-500/30 text-amber-400 text-[10px] font-bold px-2 py-0.5 rounded-full"
          >
            NEW PR
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default ExerciseCard
