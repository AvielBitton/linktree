'use client'

import WorkoutCard from './WorkoutCard'

const DAY_OFF_PATTERN = /^day\s*off$/i

export default function DayRow({ dayName, dateNum, dateStr, workouts, onSelectWorkout }) {
  const todayStr = new Date().toDateString()
  const isToday = dateStr === todayStr
  const isPast = new Date(dateStr) < new Date(todayStr)
  const hasWorkouts = workouts.length > 0

  return (
    <div className="flex items-start gap-3 py-3.5 border-b border-white/[0.04] last:border-b-0">
      <div className="w-11 flex-shrink-0 text-center pt-0.5">
        <p className={`text-[10px] font-semibold tracking-wider ${isToday ? 'text-run' : 'text-white/30'}`}>
          {dayName}
        </p>
        <p className={`text-lg font-bold leading-tight ${isToday ? 'text-white' : 'text-white/45'}`}>
          {dateNum}
        </p>
      </div>

      {hasWorkouts ? (
        <div className="flex-1 flex flex-wrap gap-2 min-w-0">
          {workouts.map((w, i) => {
            if (DAY_OFF_PATTERN.test((w.Title || '').trim())) {
              return (
                <div key={i} className="w-full rounded-xl border border-dashed border-white/[0.06] px-3 py-2.5">
                  <span className="text-white/20 text-xs font-medium">Day Off</span>
                </div>
              )
            }
            return (
              <WorkoutCard key={i} workout={w} onClick={() => onSelectWorkout(w)} isPast={isPast} />
            )
          })}
        </div>
      ) : (
        <div className="flex-1 min-w-0">
          <div className="w-full rounded-xl border border-dashed border-white/[0.06] px-3 py-2.5">
            <span className="text-white/20 text-xs font-medium">Rest Day</span>
          </div>
        </div>
      )}
    </div>
  )
}
