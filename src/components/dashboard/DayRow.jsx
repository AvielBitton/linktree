'use client'

import WorkoutCard from './WorkoutCard'

export default function DayRow({ dayName, dateNum, workouts, isToday, onSelectWorkout }) {
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
        <div className="flex-1 flex flex-wrap gap-2">
          {workouts.map((w, i) => (
            <WorkoutCard key={i} workout={w} onClick={() => onSelectWorkout(w)} />
          ))}
        </div>
      ) : (
        <div className="flex-1 flex items-center pt-2.5">
          <span className="text-white/20 text-xs font-medium">Rest Day</span>
        </div>
      )}
    </div>
  )
}
