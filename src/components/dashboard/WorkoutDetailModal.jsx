'use client'

import { motion } from 'framer-motion'
import { formatPace, formatWorkoutDate } from '../../utils/workouts'
import {
  isWorkoutCompleted,
  getTypeColor,
  calcStructureDistance,
  estimateDistance,
  formatActualDuration,
  formatPlannedDuration,
} from '../../utils/dashboard'

export default function WorkoutDetailModal({ workout, onClose }) {
  if (!workout) return null

  const completed = isWorkoutCompleted(workout)
  const color = getTypeColor(workout.WorkoutType)
  const isRun = (workout.WorkoutType || '').toLowerCase() === 'run'

  const actualDist = parseFloat(workout.DistanceInMeters) || 0
  const plannedDist = parseFloat(workout.PlannedDistanceInMeters) || 0
  const actualDuration = parseFloat(workout.TimeTotalInHours) || 0
  const plannedDuration = parseFloat(workout.PlannedDuration) || 0

  const velocity = parseFloat(workout.VelocityAverage) || 0
  const pace = velocity > 0 ? (1000 / velocity) / 60 : null
  const avgHR = parseFloat(workout.HeartRateAverage) || null
  const maxHR = parseFloat(workout.HeartRateMax) || null
  const cadence = parseFloat(workout.CadenceAverage) || null
  const rpe = parseFloat(workout.Rpe) || null
  const feeling = parseFloat(workout.Feeling) || null

  const description = workout.WorkoutDescription || ''
  const coachComments = workout.CoachComments || ''
  const athleteComments = workout.AthleteComments || ''
  const structure = workout.structure || null
  const compliance = workout.compliance || null
  const thresholdSpeed = workout.thresholdSpeed || null
  const tssActual = parseFloat(workout.TSS) || null
  const tssPlanned = workout.tssPlanned || null
  const ifActual = parseFloat(workout.IF) || null
  const ifPlanned = workout.ifPlanned || null

  function pctToPace(pct) {
    if (!thresholdSpeed || !pct) return null
    const speed = thresholdSpeed * (pct / 100)
    const paceMin = 1000 / speed / 60
    const m = Math.floor(paceMin)
    const s = Math.round((paceMin - m) * 60)
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  function formatDur(value, unit) {
    if (unit === 'second') {
      if (value >= 3600) { const h = Math.floor(value / 3600); const m = Math.round((value % 3600) / 60); return m > 0 ? `${h}h${m}min` : `${h}h` }
      if (value >= 60) { const m = Math.floor(value / 60); const s = value % 60; return s > 0 ? `${m}:${s.toString().padStart(2, '0')}` : `${m}min` }
      return `${value}s`
    }
    if (unit === 'meter') return value >= 1000 ? `${(value / 1000).toFixed(value % 1000 === 0 ? 0 : 1)}km` : `${value}m`
    return `${value}`
  }

  function targetLabel(targetMin, targetMax, metric) {
    if (targetMin == null) return ''
    if (metric === 'percentOfThresholdPace' && thresholdSpeed) {
      const pMin = pctToPace(targetMax)
      const pMax = pctToPace(targetMin)
      if (pMin && pMax) return pMin === pMax ? `${pMin} /km` : `${pMin}–${pMax} /km`
    }
    if (targetMax != null && targetMax !== targetMin) return `${targetMin}–${targetMax}%`
    return `${targetMin}%`
  }

  const structDist = calcStructureDistance(structure, thresholdSpeed)
  const distDisplay = completed && actualDist > 0
    ? `${Math.round(actualDist / 100) / 10} km`
    : plannedDist > 0
      ? `${Math.round(plannedDist / 100) / 10} km`
      : structDist
        ? `~${structDist} km`
        : isRun && plannedDuration > 0
          ? `~${estimateDistance(plannedDuration)} km`
          : null

  const durationDisplay = completed && actualDuration > 0
    ? formatActualDuration(actualDuration)
    : plannedDuration > 0
      ? formatPlannedDuration(plannedDuration)
      : null

  const feelingLabels = { 1: 'Terrible', 2: 'Poor', 3: 'Normal', 4: 'Good', 5: 'Great', 6: 'Superb', 7: 'Peak' }

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      />

        <motion.div
          className="relative w-full max-w-lg max-h-[85vh] overflow-y-auto bg-[#131922] rounded-t-3xl sm:rounded-3xl border border-white/[0.08] shadow-2xl"
          initial={{ y: '100%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        >
          <div className="w-1 h-1 rounded-full bg-white/15 mx-auto mt-2 sm:hidden" />

          <div className="h-0.5 rounded-full mx-5 mt-2" style={{ backgroundColor: color }} />

          <div className="px-5 pt-3 pb-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1 min-w-0">
                <p className="text-white/30 text-[11px] font-medium mb-0.5">
                  {formatWorkoutDate(workout.date)}
                </p>
                <h2 className="text-white font-bold text-lg tracking-tight leading-tight">
                  {workout.Title}
                </h2>
                <div className="flex items-center gap-1.5 mt-1">
                  <span
                    className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                    style={{ backgroundColor: color + '20', color }}
                  >
                    {workout.WorkoutType}
                  </span>
                  {completed && (
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400">
                      Completed
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-7 h-7 rounded-full bg-white/[0.06] flex items-center justify-center text-white/40 hover:text-white/70 hover:bg-white/[0.1] transition-colors flex-shrink-0 ml-2"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            {(distDisplay || durationDisplay) && (
              <div className="flex gap-2 mb-3">
                {distDisplay && (
                  <div className="flex-1 bg-white/[0.04] rounded-lg p-2 text-center">
                    <p className="text-white font-bold text-base">{distDisplay}</p>
                    <p className="text-white/30 text-[10px] font-medium">Distance</p>
                    {completed && actualDist > 0 && plannedDist > 0 && (
                      <p className="text-white/20 text-[10px] mt-0.5">plan: {Math.round(plannedDist / 100) / 10} km</p>
                    )}
                  </div>
                )}
                {durationDisplay && (
                  <div className="flex-1 bg-white/[0.04] rounded-lg p-2 text-center">
                    <p className="text-white font-bold text-base">{durationDisplay}</p>
                    <p className="text-white/30 text-[10px] font-medium">Duration</p>
                    {completed && actualDuration > 0 && plannedDuration > 0 && (
                      <p className="text-white/20 text-[10px] mt-0.5">plan: {formatPlannedDuration(plannedDuration)}</p>
                    )}
                  </div>
                )}
              </div>
            )}

            {completed && isRun && (pace || avgHR || cadence || rpe || tssActual) && (
              <div className="grid grid-cols-2 gap-1.5 mb-3">
                {pace && (
                  <div className="bg-white/[0.04] rounded-lg p-2">
                    <p className="text-white font-bold text-sm">{formatPace(pace)}</p>
                    <p className="text-white/30 text-[10px] font-medium">Avg Pace</p>
                  </div>
                )}
                {avgHR && (
                  <div className="bg-white/[0.04] rounded-lg p-2">
                    <p className="text-white font-bold text-sm">{Math.round(avgHR)}{maxHR ? <span className="text-white/25 font-normal text-[11px]"> / {Math.round(maxHR)}</span> : ''}</p>
                    <p className="text-white/30 text-[10px] font-medium">Avg / Max HR</p>
                  </div>
                )}
                {tssActual && (
                  <div className="bg-white/[0.04] rounded-lg p-2">
                    <p className="text-white font-bold text-sm">{Math.round(tssActual)}{tssPlanned ? <span className="text-white/25 font-normal text-[11px]"> / {Math.round(tssPlanned)}</span> : ''}</p>
                    <p className="text-white/30 text-[10px] font-medium">TSS{tssPlanned ? ' actual / plan' : ''}</p>
                  </div>
                )}
                {ifActual && (
                  <div className="bg-white/[0.04] rounded-lg p-2">
                    <p className="text-white font-bold text-sm">{ifActual.toFixed(2)}{ifPlanned ? <span className="text-white/25 font-normal text-[11px]"> / {ifPlanned.toFixed(2)}</span> : ''}</p>
                    <p className="text-white/30 text-[10px] font-medium">IF{ifPlanned ? ' actual / plan' : ''}</p>
                  </div>
                )}
                {cadence && (
                  <div className="bg-white/[0.04] rounded-lg p-2">
                    <p className="text-white font-bold text-sm">{Math.round(cadence)}</p>
                    <p className="text-white/30 text-[10px] font-medium">Cadence</p>
                  </div>
                )}
                {rpe && (
                  <div className="bg-white/[0.04] rounded-lg p-2">
                    <p className="text-white font-bold text-sm">{rpe}/10</p>
                    <p className="text-white/30 text-[10px] font-medium">RPE{feeling ? ` · ${feelingLabels[feeling] || feeling}` : ''}</p>
                  </div>
                )}
              </div>
            )}

            {structure && structure.blocks && structure.blocks.length > 0 && (() => {
              const renderStep = (step, metric, idx, dimmed) => {
                const isWarmCool = step.intensityClass === 'warmUp' || step.intensityClass === 'coolDown'
                const dim = dimmed || isWarmCool
                return (
                  <div key={idx} className={`flex items-center gap-2 px-3 py-1.5 ${dim ? 'opacity-50' : ''}`}>
                    <div className="w-1 h-5 rounded-full flex-shrink-0" style={{
                      backgroundColor: isWarmCool ? '#60A5FA' : color,
                      opacity: isWarmCool ? 0.5 : step.intensityClass === 'rest' ? 0.3 : 0.9
                    }} />
                    <span className="text-white/80 text-xs font-medium truncate flex-1">{step.name}</span>
                    <span className="text-white/40 text-[11px] font-mono flex-shrink-0">{formatDur(step.value, step.unit)}</span>
                    {step.targetMin != null && (
                      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-white/[0.05] flex-shrink-0" style={{ color }}>
                        {targetLabel(step.targetMin, step.targetMax, metric)}
                      </span>
                    )}
                  </div>
                )
              }

              const allSteps = []
              structure.blocks.forEach(b => {
                if (b.type === 'repeat') {
                  for (let r = 0; r < b.reps; r++) b.steps.forEach(s => allSteps.push(s))
                } else allSteps.push(b)
              })
              const totalDur = allSteps.reduce((sum, s) => sum + (s.value || 0), 0) || 1

              return (
                <div className="mb-3">
                  <p className="text-white/25 text-[10px] uppercase tracking-wider mb-1.5 font-semibold">Workout Plan</p>
                  <div className="flex h-2 rounded-full overflow-hidden mb-2 gap-px">
                    {allSteps.map((s, i) => {
                      const isWC = s.intensityClass === 'warmUp' || s.intensityClass === 'coolDown'
                      const isRest = s.intensityClass === 'rest'
                      const bg = isWC ? '#60A5FA' : color
                      const pct = Math.max(((s.value || 0) / totalDur) * 100, 2)
                      return <div key={i} className="rounded-full" style={{ width: `${pct}%`, backgroundColor: bg, opacity: isWC ? 0.5 : isRest ? 0.3 : 0.9 }} />
                    })}
                  </div>
                  <div className="bg-white/[0.03] rounded-lg overflow-hidden divide-y divide-white/[0.04]">
                    {structure.blocks.map((block, i) => {
                      if (block.type === 'repeat') {
                        return (
                          <div key={i}>
                            <div className="px-3 py-1.5 flex items-center gap-2">
                              <div className="w-1 h-5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                              <span className="text-white/60 text-[11px] font-semibold uppercase tracking-wide">Repeat {block.reps} times</span>
                            </div>
                            <div className="pl-4 divide-y divide-white/[0.03]">
                              {block.steps.map((step, j) => renderStep(step, structure.metric, `${i}-${j}`, false))}
                            </div>
                          </div>
                        )
                      }
                      return renderStep(block, structure.metric, i, false)
                    })}
                  </div>
                </div>
              )
            })()}

            {compliance && (
              <div className="flex gap-2 mb-3">
                {compliance.duration != null && (
                  <div className="flex-1 bg-white/[0.04] rounded-lg p-2 text-center">
                    <p className={`font-bold text-sm ${compliance.duration >= 90 ? 'text-emerald-400' : compliance.duration >= 70 ? 'text-amber-400' : 'text-red-400'}`}>
                      {Math.round(compliance.duration)}%
                    </p>
                    <p className="text-white/30 text-[10px] font-medium">Duration</p>
                  </div>
                )}
                {compliance.tss != null && (
                  <div className="flex-1 bg-white/[0.04] rounded-lg p-2 text-center">
                    <p className={`font-bold text-sm ${compliance.tss >= 90 ? 'text-emerald-400' : compliance.tss >= 70 ? 'text-amber-400' : 'text-red-400'}`}>
                      {Math.round(compliance.tss)}%
                    </p>
                    <p className="text-white/30 text-[10px] font-medium">TSS</p>
                  </div>
                )}
                {compliance.distance != null && (
                  <div className="flex-1 bg-white/[0.04] rounded-lg p-2 text-center">
                    <p className={`font-bold text-sm ${compliance.distance >= 90 ? 'text-emerald-400' : compliance.distance >= 70 ? 'text-amber-400' : 'text-red-400'}`}>
                      {Math.round(compliance.distance)}%
                    </p>
                    <p className="text-white/30 text-[10px] font-medium">Distance</p>
                  </div>
                )}
              </div>
            )}

            {description && (
              <div className="mb-3" dir="rtl">
                <p className="text-white/25 text-[10px] uppercase tracking-wider mb-1 font-semibold text-right">פרטי אימון</p>
                <p className="text-white/45 text-xs leading-relaxed whitespace-pre-line text-right">{description}</p>
              </div>
            )}

            {coachComments && (
              <div className="mb-3" dir="rtl">
                <p className="text-white/25 text-[10px] uppercase tracking-wider mb-1 font-semibold text-right">הערות מאמן</p>
                <p className="text-white/45 text-xs leading-relaxed whitespace-pre-line text-right">{coachComments}</p>
              </div>
            )}

            {completed && athleteComments && (
              <div className="mb-2" dir="rtl">
                <p className="text-white/25 text-[10px] uppercase tracking-wider mb-1 font-semibold text-right">סיכום אישי</p>
                <p className="text-white/45 text-xs leading-relaxed whitespace-pre-line text-right">{athleteComments}</p>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
  )
}
