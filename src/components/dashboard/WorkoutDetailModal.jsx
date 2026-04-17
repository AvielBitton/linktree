'use client'

import { useMemo } from 'react'
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

function findMatchingStravaActivity(workout, stravaActivities) {
  if (!workout || !stravaActivities || stravaActivities.length === 0) return null

  if (workout._stravaId) {
    return stravaActivities.find(a => a.id === workout._stravaId) || null
  }

  if (!workout.date) return null

  const wDate = workout.date
  const dateStr = `${wDate.getFullYear()}-${String(wDate.getMonth() + 1).padStart(2, '0')}-${String(wDate.getDate()).padStart(2, '0')}`
  const wType = (workout.WorkoutType || '').toLowerCase()

  const typeMap = { run: 'Run', bike: 'Ride', swim: 'Swim', strength: 'WeightTraining' }
  const stravaType = typeMap[wType]

  return stravaActivities.find(a => {
    if (a.date !== dateStr) return false
    if (stravaType && a.type !== stravaType) return false
    if (!stravaType && a.type === 'Run' && wType !== 'run') return false
    return true
  }) || null
}

export default function WorkoutDetailModal({ workout, stravaActivities = [], onClose }) {
  const completed = workout ? isWorkoutCompleted(workout) : false
  const matchedStrava = useMemo(
    () => (workout && (completed || workout._stravaId)) ? findMatchingStravaActivity(workout, stravaActivities) : null,
    [workout, stravaActivities, completed]
  )

  if (!workout) return null

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

  const stravaSplits = matchedStrava?.splits_metric || []
  const tssActual = parseFloat(workout.TSS) || null
  const tssPlanned = workout.tssPlanned || null
  const ifActual = parseFloat(workout.IF) || null
  const ifPlanned = parseFloat(workout.ifPlanned) || null

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
      const pMax = pctToPace(targetMin)
      const pMin = targetMax ? pctToPace(targetMax) : null
      if (pMin && pMax) return pMin === pMax ? `${pMin} /km` : `${pMin}–${pMax} /km`
      if (pMax) return `${pMax} /km`
    }
    if (targetMax != null && targetMax !== targetMin) return `${targetMin}–${targetMax}%`
    return `${targetMin}%`
  }

  function speedToPace(speed) {
    if (!speed || speed <= 0) return null
    const secsPerKm = 1000 / speed
    const m = Math.floor(secsPerKm / 60)
    const s = Math.round(secsPerKm % 60)
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  function paceLabel(step) {
    if (step.targetMin != null) return targetLabel(step.targetMin, step.targetMax, structure?.metric)
    if (step.targetSpeed) return `${speedToPace(step.targetSpeed)} /km`
    if (step.targetSpeedMin && step.targetSpeedMax) return `${speedToPace(step.targetSpeedMax)}–${speedToPace(step.targetSpeedMin)} /km`
    if (step.paceLabel) return step.paceLabel
    return null
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
                {workout._originalTitle && (
                  <p className="text-white/25 text-[11px] mt-0.5">
                    Runna: {workout._originalTitle}
                  </p>
                )}
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
                {matchedStrava?.id && (
                  <a
                    href={`https://www.strava.com/activities/${matchedStrava.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-[#FC4C02]/10 rounded-lg p-2 flex items-center justify-center gap-1.5 hover:bg-[#FC4C02]/20 transition-colors"
                  >
                    <svg className="w-3.5 h-3.5 text-[#FC4C02]" viewBox="0 0 24 24" fill="currentColor"><path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169" /></svg>
                    <span className="text-[#FC4C02] text-[11px] font-semibold">View on Strava</span>
                  </a>
                )}
              </div>
            )}

            {completed && !isRun && (avgHR || workout._stravaCalories > 0 || matchedStrava) && (() => {
              const hr = avgHR || (matchedStrava?.average_heartrate ? matchedStrava.average_heartrate : null)
              const hrMax2 = maxHR || (matchedStrava?.max_heartrate ? matchedStrava.max_heartrate : null)
              const cal = workout._stravaCalories || matchedStrava?.calories || 0
              const suffer = workout._stravaSufferScore || matchedStrava?.suffer_score || null
              const stravaId = workout._stravaId || matchedStrava?.id
              if (!hr && !cal && !suffer) return null
              return (
                <div className="grid grid-cols-2 gap-1.5 mb-3">
                  {hr && (
                    <div className="bg-white/[0.04] rounded-lg p-2">
                      <p className="text-white font-bold text-sm">{Math.round(hr)}{hrMax2 ? <span className="text-white/25 font-normal text-[11px]"> / {Math.round(hrMax2)}</span> : ''}</p>
                      <p className="text-white/30 text-[10px] font-medium">Avg / Max HR</p>
                    </div>
                  )}
                  {cal > 0 && (
                    <div className="bg-white/[0.04] rounded-lg p-2">
                      <p className="text-white font-bold text-sm">{Math.round(cal)}</p>
                      <p className="text-white/30 text-[10px] font-medium">Calories</p>
                    </div>
                  )}
                  {suffer && (
                    <div className="bg-white/[0.04] rounded-lg p-2">
                      <p className="text-white font-bold text-sm">{suffer}</p>
                      <p className="text-white/30 text-[10px] font-medium">Suffer Score</p>
                    </div>
                  )}
                  {stravaId && (
                    <a
                      href={`https://www.strava.com/activities/${stravaId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-[#FC4C02]/10 rounded-lg p-2 flex items-center justify-center gap-1.5 hover:bg-[#FC4C02]/20 transition-colors"
                    >
                      <svg className="w-3.5 h-3.5 text-[#FC4C02]" viewBox="0 0 24 24" fill="currentColor"><path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169" /></svg>
                      <span className="text-[#FC4C02] text-[11px] font-semibold">View on Strava</span>
                    </a>
                  )}
                </div>
              )
            })()}

            {workout._gymTemplate && workout._gymTemplate.exercises && workout._gymTemplate.exercises.length > 0 && (() => {
              const logs = workout._gymSessionLogs || []
              const logsByKey = {}
              for (const l of logs) {
                const k = l.exercise_key || l.exerciseKey
                if (!k) continue
                if (!logsByKey[k]) logsByKey[k] = []
                logsByKey[k].push(l)
              }
              for (const k of Object.keys(logsByKey)) {
                logsByKey[k].sort((a, b) => a.set_number - b.set_number)
              }
              const hasLogs = logs.length > 0

              return (
                <div className="mb-3">
                  <p className="text-white/25 text-[10px] uppercase tracking-wider mb-1.5 font-semibold">
                    {workout._gymTemplate.name} — {hasLogs ? 'Actual' : 'Exercises'}
                  </p>
                  <div className="bg-white/[0.03] rounded-xl overflow-hidden divide-y divide-white/[0.04]">
                    {workout._gymTemplate.exercises.map((ex, i) => {
                      const isSupersetStart = ex.superset && (!workout._gymTemplate.exercises[i - 1] || workout._gymTemplate.exercises[i - 1].superset !== ex.superset)
                      const exLogs = logsByKey[ex.key] || []

                      return (
                        <div key={ex.key || i}>
                          {isSupersetStart && (
                            <div className="px-3 pt-2 pb-0.5">
                              <span className="text-white/20 text-[9px] font-semibold uppercase tracking-wide">Superset</span>
                            </div>
                          )}
                          <div className={`px-3 py-1.5 ${ex.superset ? 'pl-5' : ''}`}>
                            <div className="flex items-center gap-2">
                              <div className="w-1 h-5 rounded-full flex-shrink-0" style={{ backgroundColor: workout._gymTemplate.color || color, opacity: 0.7 }} />
                              <span className="text-white/80 text-xs font-medium truncate flex-1">
                                {ex.name_en || ex.name}
                              </span>
                              {!hasLogs && (
                                <span className="text-white/40 text-[11px] font-mono flex-shrink-0">
                                  {ex.sets}×{ex.reps}
                                </span>
                              )}
                            </div>
                            {hasLogs && exLogs.length > 0 && (
                              <div className="flex gap-1.5 mt-1 ml-3 flex-wrap">
                                {exLogs.map((l, j) => (
                                  <span key={j} className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/[0.05] text-white/50">
                                    {l.weight_kg}<span className="text-white/25">kg</span>×{l.reps}
                                  </span>
                                ))}
                              </div>
                            )}
                            {hasLogs && exLogs.length === 0 && (
                              <p className="text-white/20 text-[10px] mt-0.5 ml-3">skipped</p>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })()}

            {(() => {
              const hasStructure = structure && structure.blocks && structure.blocks.length > 0
              const hasActualSplits = completed && stravaSplits.length > 0

              if (!hasStructure && !hasActualSplits) return null

              const allSteps = []
              if (hasStructure) {
                structure.blocks.forEach(b => {
                  if (b.type === 'repeat') {
                    for (let r = 0; r < (b.reps || 1); r++) b.steps.forEach(s => allSteps.push(s))
                  } else allSteps.push(b)
                })
              }
              const totalDur = allSteps.reduce((sum, s) => sum + (s.value || 0), 0) || 1

              const isDistanceBased = allSteps.length > 0 && allSteps[0].unit === 'meter'

              const blockTimeline = []
              let cumValue = 0
              for (const step of allSteps) {
                const stepVal = step.value || 0
                const isWarmCool = step.intensityClass === 'warmUp' || step.intensityClass === 'coolDown'
                const isRest = step.intensityClass === 'rest'
                let targetFast = null
                let targetSlow = null
                if (step.targetMin != null && thresholdSpeed && structure.metric === 'percentOfThresholdPace') {
                  const maxPct = step.targetMax || step.targetMin
                  targetFast = 1000 / (thresholdSpeed * (maxPct / 100)) / 60
                  targetSlow = 1000 / (thresholdSpeed * (step.targetMin / 100)) / 60
                } else if (step.targetSpeed) {
                  targetFast = 1000 / step.targetSpeed / 60
                  targetSlow = targetFast
                }
                blockTimeline.push({
                  start: cumValue,
                  end: cumValue + stepVal,
                  name: step.name,
                  intensityClass: step.intensityClass,
                  isWarmCool,
                  isRest,
                  targetFast,
                  targetSlow,
                  barColor: isWarmCool ? '#60A5FA' : isRest ? color : color,
                  barOpacity: isWarmCool ? 0.5 : isRest ? 0.3 : 0.9,
                  targetLabel: step.targetMin != null ? targetLabel(step.targetMin, step.targetMax, structure?.metric) : null,
                })
                cumValue += stepVal
              }

              function getBlockForValue(val) {
                for (const b of blockTimeline) {
                  if (val >= b.start && val < b.end) return b
                }
                return blockTimeline[blockTimeline.length - 1] || null
              }

              const splitBlocks = []
              if (hasActualSplits && blockTimeline.length > 0) {
                if (isDistanceBased) {
                  let cumDist = 0
                  for (const split of stravaSplits) {
                    const midDist = cumDist + (split.distance || 1000) / 2
                    splitBlocks.push(getBlockForValue(midDist))
                    cumDist += (split.distance || 1000)
                  }
                } else {
                  let cumTime = 0
                  for (const split of stravaSplits) {
                    const midTime = cumTime + (split.elapsed_time || 0) / 2
                    splitBlocks.push(getBlockForValue(midTime))
                    cumTime += (split.elapsed_time || 0)
                  }
                }
              }

              const paces = hasActualSplits ? stravaSplits.map(s => {
                if (!s.average_speed || s.average_speed <= 0) return null
                return 1000 / s.average_speed / 60
              }).filter(Boolean) : []
              const minPace = paces.length > 0 ? Math.min(...paces) : 0
              const maxPace = paces.length > 0 ? Math.max(...paces) : 0
              const paceRange = maxPace - minPace || 1

              const blockAvgPaces = {}
              if (hasActualSplits && blockTimeline.length > 0) {
                const blockPaces = {}
                stravaSplits.forEach((split, i) => {
                  const block = splitBlocks[i]
                  if (!block || !split.average_speed || split.average_speed <= 0) return
                  if (!blockPaces[block.name]) blockPaces[block.name] = []
                  blockPaces[block.name].push(1000 / split.average_speed / 60)
                })
                for (const [name, paceArr] of Object.entries(blockPaces)) {
                  blockAvgPaces[name] = paceArr.reduce((a, b) => a + b, 0) / paceArr.length
                }
              }

              const showUnified = hasStructure && hasActualSplits && blockTimeline.length > 0

              return (
                <div className="mb-3">
                  <p className="text-white/25 text-[10px] uppercase tracking-wider mb-1.5 font-semibold">
                    {showUnified ? 'Plan vs Actual' : hasActualSplits ? 'Actual Splits' : 'Workout Plan'}
                  </p>

                  {hasStructure && (
                    <div className="flex h-2 rounded-full overflow-hidden mb-2 gap-px">
                      {allSteps.map((s, i) => {
                        const isWC = s.intensityClass === 'warmUp' || s.intensityClass === 'coolDown'
                        const isRest = s.intensityClass === 'rest'
                        const bg = isWC ? '#60A5FA' : color
                        const pct = Math.max(((s.value || 0) / totalDur) * 100, 2)
                        return <div key={i} className="rounded-full" style={{ width: `${pct}%`, backgroundColor: bg, opacity: isWC ? 0.5 : isRest ? 0.3 : 0.9 }} />
                      })}
                    </div>
                  )}

                  {showUnified ? (
                    <div className="bg-white/[0.03] rounded-xl overflow-hidden">
                      {stravaSplits.map((split, i) => {
                        if (!split.average_speed || split.average_speed <= 0) return null
                        const paceMin = 1000 / split.average_speed / 60
                        const barWidth = Math.max(25, ((paceMin - minPace + paceRange * 0.3) / (paceRange * 1.3)) * 100)
                        const opacity = 0.25 + (1 - (paceMin - minPace) / paceRange) * 0.55

                        const block = splitBlocks[i]
                        const blockColor = block?.barColor || color
                        const inTarget = block?.targetFast != null
                          ? paceMin >= block.targetFast - 0.05 && paceMin <= block.targetSlow + 0.05
                          : null

                        const prevBlock = i > 0 ? splitBlocks[i - 1] : null
                        const blockChanged = block && (!prevBlock || block.name !== prevBlock.name)

                        return (
                          <div key={i}>
                            {blockChanged && (() => {
                              const avgPace = blockAvgPaces[block.name]
                              const hitTarget = avgPace && block.targetFast != null
                                ? avgPace >= block.targetFast - 0.05 && avgPace <= block.targetSlow + 0.05
                                : null
                              return (
                                <div className="flex items-center gap-2 px-3 pt-2.5 pb-0.5">
                                  <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: blockColor, opacity: block.barOpacity }} />
                                  <span className="text-white/30 text-[10px] font-semibold uppercase tracking-wide">{block.name}</span>
                                  <div className="flex items-center gap-2 ml-auto">
                                    {avgPace && (
                                      <div className="flex items-center gap-1">
                                        <span className="text-white/25 text-[8px] uppercase">avg</span>
                                        <span className={`text-[10px] font-bold tabular-nums ${hitTarget === true ? 'text-emerald-400' : hitTarget === false ? 'text-amber-400' : 'text-white/50'}`}>
                                          {formatPace(avgPace)}
                                        </span>
                                      </div>
                                    )}
                                    {block.targetLabel && (
                                      <div className="flex items-center gap-1">
                                        <span className="text-white/25 text-[8px] uppercase">plan</span>
                                        <span className="text-[10px] font-medium tabular-nums" style={{ color: blockColor }}>
                                          {block.targetLabel}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )
                            })()}
                            <div className="flex items-center gap-2 px-3 py-1 relative">
                              <span className="text-white/20 text-[10px] w-4 text-right tabular-nums font-medium flex-shrink-0">{split.split || i + 1}</span>
                              <div className="flex-1 h-6 relative rounded-lg overflow-hidden">
                                <motion.div
                                  className="absolute inset-y-0 left-0 rounded-lg"
                                  style={{ backgroundColor: blockColor, opacity: opacity * 0.2 }}
                                  initial={{ width: 0 }}
                                  animate={{ width: `${barWidth}%` }}
                                  transition={{ duration: 0.4, delay: i * 0.03, ease: 'easeOut' }}
                                />
                                <div className="absolute inset-0 flex items-center px-2">
                                  <span className="font-bold text-[12px] tabular-nums tracking-tight" style={{ color: blockColor, opacity }}>
                                    {split.pace || formatPace(paceMin)}
                                  </span>
                                </div>
                              </div>
                              {split.average_heartrate > 0 && (
                                <span className="text-white/20 text-[10px] tabular-nums w-7 text-right flex-shrink-0">
                                  {Math.round(split.average_heartrate)}
                                </span>
                              )}
                              {inTarget !== null && (
                                <span className={`text-[8px] flex-shrink-0 ${inTarget ? 'text-emerald-400/60' : 'text-amber-400/60'}`}>
                                  {inTarget ? '●' : '○'}
                                </span>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ) : hasActualSplits ? (
                    <div className="bg-white/[0.03] rounded-xl overflow-hidden">
                      {stravaSplits.map((split, i) => {
                        if (!split.average_speed || split.average_speed <= 0) return null
                        const paceMin = 1000 / split.average_speed / 60
                        const barWidth = Math.max(25, ((paceMin - minPace + paceRange * 0.3) / (paceRange * 1.3)) * 100)
                        const opacity = 0.25 + (1 - (paceMin - minPace) / paceRange) * 0.55
                        return (
                          <div key={i} className="flex items-center gap-2 px-3 py-1 relative">
                            <span className="text-white/20 text-[10px] w-4 text-right tabular-nums font-medium flex-shrink-0">{split.split || i + 1}</span>
                            <div className="flex-1 h-6 relative rounded-lg overflow-hidden">
                              <motion.div
                                className="absolute inset-y-0 left-0 rounded-lg"
                                style={{ backgroundColor: color, opacity: opacity * 0.2 }}
                                initial={{ width: 0 }}
                                animate={{ width: `${barWidth}%` }}
                                transition={{ duration: 0.4, delay: i * 0.03, ease: 'easeOut' }}
                              />
                              <div className="absolute inset-0 flex items-center px-2">
                                <span className="font-bold text-[12px] tabular-nums tracking-tight" style={{ color, opacity }}>
                                  {split.pace || formatPace(paceMin)}
                                </span>
                              </div>
                            </div>
                            {split.average_heartrate > 0 && (
                              <span className="text-white/20 text-[10px] tabular-nums w-7 text-right flex-shrink-0">
                                {Math.round(split.average_heartrate)}
                              </span>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  ) : (
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
                                {block.steps.map((step, j) => {
                                  const isWC = step.intensityClass === 'warmUp' || step.intensityClass === 'coolDown'
                                  return (
                                    <div key={`${i}-${j}`} className={`flex items-center gap-2 px-3 py-1.5 ${isWC ? 'opacity-50' : ''}`}>
                                      <div className="w-1 h-5 rounded-full flex-shrink-0" style={{
                                        backgroundColor: isWC ? '#60A5FA' : color,
                                        opacity: isWC ? 0.5 : step.intensityClass === 'rest' ? 0.3 : 0.9
                                      }} />
                                      <span className="text-white/80 text-xs font-medium truncate flex-1">{step.name}</span>
                                      <span className="text-white/40 text-[11px] font-mono flex-shrink-0">{formatDur(step.value, step.unit)}</span>
                                      {paceLabel(step) && (
                                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-white/[0.05] flex-shrink-0" style={{ color }}>
                                          {paceLabel(step)}
                                        </span>
                                      )}
                                    </div>
                                  )
                                })}
                              </div>
                            </div>
                          )
                        }
                        const isWC = block.intensityClass === 'warmUp' || block.intensityClass === 'coolDown'
                        return (
                          <div key={i} className={`flex items-center gap-2 px-3 py-1.5 ${isWC ? 'opacity-50' : ''}`}>
                            <div className="w-1 h-5 rounded-full flex-shrink-0" style={{
                              backgroundColor: isWC ? '#60A5FA' : color,
                              opacity: isWC ? 0.5 : block.intensityClass === 'rest' ? 0.3 : 0.9
                            }} />
                            <span className="text-white/80 text-xs font-medium truncate flex-1">{block.name}</span>
                            <span className="text-white/40 text-[11px] font-mono flex-shrink-0">{formatDur(block.value, block.unit)}</span>
                            {paceLabel(block) && (
                              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-white/[0.05] flex-shrink-0" style={{ color }}>
                                {paceLabel(block)}
                              </span>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}

                  {showUnified && (
                    <div className="flex items-center gap-3 mt-2 px-1">
                      <div className="flex items-center gap-1">
                        <span className="text-emerald-400/60 text-[8px]">●</span>
                        <span className="text-white/20 text-[9px]">In zone</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-amber-400/60 text-[8px]">○</span>
                        <span className="text-white/20 text-[9px]">Off target</span>
                      </div>
                    </div>
                  )}
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

            {description && !workout._gymTemplate && (
              <div className="mb-3">
                <p className="text-white/25 text-[10px] uppercase tracking-wider mb-1 font-semibold">Description</p>
                <p className="text-white/45 text-xs leading-relaxed whitespace-pre-line">{description}</p>
              </div>
            )}

            {coachComments && !workout._gymTemplate && (
              <div className="mb-3">
                <p className="text-white/25 text-[10px] uppercase tracking-wider mb-1 font-semibold">Coach Notes</p>
                <p className="text-white/45 text-xs leading-relaxed whitespace-pre-line">{coachComments}</p>
              </div>
            )}

            {completed && athleteComments && (
              <div className="mb-2">
                <p className="text-white/25 text-[10px] uppercase tracking-wider mb-1 font-semibold">Personal Notes</p>
                <p className="text-white/45 text-xs leading-relaxed whitespace-pre-line">{athleteComments}</p>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
  )
}
