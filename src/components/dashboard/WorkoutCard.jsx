'use client'

import {
  isWorkoutCompleted,
  getTypeColor,
  getRunDistance,
  formatActualDuration,
  formatPlannedDuration,
} from '../../utils/dashboard'

export default function WorkoutCard({ workout, onClick, isPast }) {
  const completed = isWorkoutCompleted(workout)
  const missed = isPast && !completed
  const color = getTypeColor(workout.WorkoutType)
  const isRun = (workout.WorkoutType || '').toLowerCase() === 'run'

  const runDist = getRunDistance(workout, completed)

  const nonRunDistanceM = !isRun && completed
    ? parseFloat(workout.DistanceInMeters) || 0
    : !isRun ? parseFloat(workout.PlannedDistanceInMeters) || 0 : 0
  const nonRunDistKm = nonRunDistanceM > 0 ? `${Math.round(nonRunDistanceM / 100) / 10} km` : ''

  const duration = completed
    ? formatActualDuration(parseFloat(workout.TimeTotalInHours) || 0)
    : formatPlannedDuration(parseFloat(workout.PlannedDuration) || 0)

  const nonRunSubtitle = [nonRunDistKm, duration].filter(Boolean).join(' \u00B7 ')
  const runSubtitle = duration || ''

  return (
    <div
      className={`flex-1 min-w-[140px] bg-[#161D2A] rounded-xl border overflow-hidden flex cursor-pointer hover:bg-[#1a2332] active:bg-[#1e2840] transition-colors ${missed ? 'border-red-500/20 opacity-60' : 'border-white/[0.07]'}`}
      onClick={onClick}
    >
      <div className="w-1 flex-shrink-0" style={{ backgroundColor: missed ? '#EF4444' : color }} />
      <div className="flex-1 px-3 py-2.5 flex items-center justify-between gap-2 min-w-0">
        <div className="min-w-0 flex-1">
          <p className="text-white font-semibold text-[12px] leading-tight truncate">
            {workout.Title}
            {isRun && runDist.text && ` | ${runDist.text}`}
          </p>
          {(isRun ? runSubtitle : nonRunSubtitle) && (
            <p className="text-white/40 text-[11px] mt-0.5 truncate">{isRun ? runSubtitle : nonRunSubtitle}</p>
          )}
        </div>
        {completed ? (
          <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
            <svg className="w-3 h-3 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        ) : missed ? (
          <div className="w-6 h-6 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0">
            <svg className="w-3 h-3 text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </div>
        ) : (
          <div className="w-6 h-6 rounded-full bg-white/[0.06] flex items-center justify-center flex-shrink-0">
            <svg className="w-3 h-3 text-white/25" viewBox="0 0 24 24" fill="currentColor">
              <path d="M13 9h-2V7h2m0 10h-2v-6h2m-1-9A10 10 0 002 12a10 10 0 0010 10 10 10 0 0010-10A10 10 0 0012 2z" opacity="0.6" />
            </svg>
          </div>
        )}
      </div>
    </div>
  )
}
