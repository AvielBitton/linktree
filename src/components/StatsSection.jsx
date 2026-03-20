'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip, BarChart, Bar } from 'recharts'
import { getAllWeeksStats, formatPace, isCompletedRun } from '../utils/workouts'
import WeekCard from './WeekCard'
import AllWorkoutsView from './AllWorkoutsView'

function ProgressRing({ progress, size = 80, strokeWidth = 5, color = '#0A84FF' }) {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const offset = circumference - (progress / 100) * circumference
  
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={strokeWidth}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          style={{ strokeDasharray: circumference }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-white font-semibold text-base">{Math.round(progress)}%</span>
      </div>
    </div>
  )
}

function CustomTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#1c1c1e] border border-white/10 rounded-xl px-3 py-2">
        <p className="text-white/40 text-[10px] mb-0.5">W{label}</p>
        <p className="text-white font-semibold text-sm">{payload[0].value} km</p>
      </div>
    )
  }
  return null
}

const colorThemes = {
  default: {
    primary: '#0A84FF',
    secondary: '#5E5CE6',
    spinnerColor: 'border-accent'
  },
  asaf: {
    primary: '#30D158',
    secondary: '#14b8a6',
    spinnerColor: 'border-accent-emerald'
  }
}

function StatsSection({ traineeId = null, workouts: inputWorkouts = [] }) {
  const [selectedView, setSelectedView] = useState('distance')
  const [workoutsTab, setWorkoutsTab] = useState('weeks')

  const theme = traineeId && colorThemes[traineeId] ? colorThemes[traineeId] : colorThemes.default

  const { weeks, allWorkouts, allTimeStats } = useMemo(() => {
    const stats = getAllWeeksStats(inputWorkouts)
    const completedRuns = inputWorkouts.filter(isCompletedRun)
    const processedWorkouts = completedRuns.map(w => {
      const distance = parseFloat(w.DistanceInMeters) || 0
      const velocity = parseFloat(w.VelocityAverage) || 0
      const pace = velocity > 0 ? (1000 / velocity) / 60 : null
      return {
        ...w,
        distanceKm: Math.round(distance / 100) / 10,
        pace,
        paceFormatted: formatPace(pace),
        hr: parseFloat(w.HeartRateAverage) || null,
        durationHours: parseFloat(w.TimeTotalInHours) || 0,
        cadence: parseFloat(w.CadenceAverage) || null,
        rpe: parseFloat(w.Rpe) || null,
      }
    }).sort((a, b) => new Date(b.WorkoutDay) - new Date(a.WorkoutDay))

    let totalDist = 0
    for (const run of completedRuns) {
      totalDist += parseFloat(run.DistanceInMeters) || 0
    }

    return {
      weeks: stats.slice(0, 12),
      allWorkouts: processedWorkouts,
      allTimeStats: {
        distance: Math.round(totalDist / 1000),
        runs: completedRuns.length,
      },
    }
  }, [inputWorkouts])

  if (weeks.length === 0) {
    return (
      <div className="text-center text-white/30 text-sm py-8">
        No stats available yet.
      </div>
    )
  }

  const chartData = [...weeks].reverse().map(week => ({
    week: week.weekKey.split('-')[1],
    distance: week.distanceKm,
    pace: week.avgPace ? parseFloat(week.avgPace.toFixed(2)) : 0,
    hr: week.avgHR || 0,
    runs: week.workoutCount
  }))
  
  const bestWeek = Math.max(...weeks.map(w => w.distanceKm))
  
  const marathonDate = new Date(2026, 1, 28)
  const now = new Date()
  const weeksUntilMarathon = Math.max(0, Math.ceil((marathonDate - now) / (7 * 24 * 60 * 60 * 1000)))
  const weeklyTarget = 40
  const marathonGoalKm = allTimeStats.distance + (weeklyTarget * weeksUntilMarathon)
  const marathonProgress = Math.min((allTimeStats.distance / marathonGoalKm) * 100, 100)
  
  const currentWeek = weeks[0]
  const lastWeek = weeks[1]
  const weekOverWeekChange = lastWeek 
    ? ((currentWeek.distanceKm - lastWeek.distanceKm) / lastWeek.distanceKm * 100)
    : 0

  return (
    <div className="space-y-3">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-2.5">
        {/* Marathon Progress */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="col-span-2 bg-white/[0.03] rounded-2xl p-4 border border-white/[0.06]"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/30 text-[11px] font-medium uppercase tracking-wider mb-1">Marathon Training</p>
              <p className="text-white font-semibold text-2xl tracking-tight">{allTimeStats.distance} km</p>
              <p className="text-white/25 text-xs mt-0.5">of {marathonGoalKm} km goal</p>
            </div>
            <ProgressRing progress={marathonProgress} size={64} color={theme.primary} />
          </div>
        </motion.div>
        
        {/* This Week */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.05 }}
          className="bg-white/[0.03] rounded-2xl p-4 border border-white/[0.06]"
        >
          <p className="text-white/30 text-[11px] font-medium mb-2">This Week</p>
          <p className="text-white font-semibold text-xl tracking-tight">{currentWeek.distanceKm} km</p>
          <div className={`flex items-center gap-1 mt-1 text-[11px] font-medium ${weekOverWeekChange >= 0 ? 'text-[#30D158]' : 'text-white/30'}`}>
            <span>{weekOverWeekChange >= 0 ? '↑' : '↓'}</span>
            <span>{Math.abs(weekOverWeekChange).toFixed(0)}% vs last</span>
          </div>
        </motion.div>
        
        {/* Best Week */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-white/[0.03] rounded-2xl p-4 border border-white/[0.06]"
        >
          <p className="text-white/30 text-[11px] font-medium mb-2">Best Week</p>
          <p className="text-white font-semibold text-xl tracking-tight">{bestWeek} km</p>
          <p className="text-white/20 text-[11px] mt-1 font-medium">🏆 PR</p>
        </motion.div>
        
        {/* Avg Pace */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="bg-white/[0.03] rounded-2xl p-4 border border-white/[0.06]"
        >
          <p className="text-white/30 text-[11px] font-medium mb-2">Avg Pace</p>
          <p className="text-white font-semibold text-xl tracking-tight">{formatPace(currentWeek.avgPace)}</p>
          <p className="text-white/20 text-[11px] mt-1 font-medium">min/km</p>
        </motion.div>
        
        {/* Total Runs */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white/[0.03] rounded-2xl p-4 border border-white/[0.06]"
        >
          <p className="text-white/30 text-[11px] font-medium mb-2">Total Runs</p>
          <p className="text-white font-semibold text-xl tracking-tight">{allTimeStats.runs}</p>
          <p className="text-white/20 text-[11px] mt-1 font-medium">all time</p>
        </motion.div>
      </div>
      
      {/* Chart */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.25 }}
        className="bg-white/[0.03] rounded-2xl p-4 border border-white/[0.06]"
      >
        <div className="flex items-center justify-between mb-4">
          <p className="text-white/50 text-[13px] font-medium">Weekly Distance</p>
          <div className="flex bg-white/[0.04] rounded-lg p-0.5">
            <button
              onClick={() => setSelectedView('distance')}
              className={`px-2.5 py-1 text-[11px] rounded-md font-medium transition-all ${
                selectedView === 'distance' ? 'bg-white/[0.08] text-white' : 'text-white/30 hover:text-white/50'
              }`}
            >
              Distance
            </button>
            <button
              onClick={() => setSelectedView('runs')}
              className={`px-2.5 py-1 text-[11px] rounded-md font-medium transition-all ${
                selectedView === 'runs' ? 'bg-white/[0.08] text-white' : 'text-white/30 hover:text-white/50'
              }`}
            >
              Runs
            </button>
          </div>
        </div>
        
        <div className="h-36">
          <ResponsiveContainer width="100%" height="100%">
            {selectedView === 'distance' ? (
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id={`distGrad-${traineeId || 'default'}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={theme.primary} stopOpacity={0.2} />
                    <stop offset="100%" stopColor={theme.primary} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="week" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: 'rgba(255,255,255,0.2)', fontSize: 10 }}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: 'rgba(255,255,255,0.2)', fontSize: 10 }}
                  width={28}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="distance"
                  stroke={theme.primary}
                  strokeWidth={1.5}
                  fill={`url(#distGrad-${traineeId || 'default'})`}
                />
              </AreaChart>
            ) : (
              <BarChart data={chartData}>
                <XAxis 
                  dataKey="week" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: 'rgba(255,255,255,0.2)', fontSize: 10 }}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: 'rgba(255,255,255,0.2)', fontSize: 10 }}
                  width={28}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1c1c1e', 
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '12px'
                  }}
                  labelStyle={{ color: 'rgba(255,255,255,0.4)' }}
                />
                <Bar 
                  dataKey="runs" 
                  fill={theme.primary} 
                  radius={[4, 4, 0, 0]}
                  opacity={0.7}
                />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </motion.div>
      
      {/* Workouts */}
      <div className="space-y-3">
        <div className="flex border-b border-white/[0.06]">
          <button
            onClick={() => setWorkoutsTab('weeks')}
            className={`flex-1 py-2.5 text-xs font-medium transition-all border-b-2 -mb-px ${
              workoutsTab === 'weeks' ? 'text-white/80 border-white/40' : 'text-white/25 border-transparent hover:text-white/40'
            }`}
          >
            Recent Weeks
          </button>
          <button
            onClick={() => setWorkoutsTab('all')}
            className={`flex-1 py-2.5 text-xs font-medium transition-all border-b-2 -mb-px ${
              workoutsTab === 'all' ? 'text-white/80 border-white/40' : 'text-white/25 border-transparent hover:text-white/40'
            }`}
          >
            All Workouts
          </button>
        </div>
        
        <AnimatePresence mode="wait">
          {workoutsTab === 'weeks' ? (
            <motion.div
              key="weeks"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="space-y-2"
            >
              {weeks.slice(0, 4).map((week, index) => (
                <WeekCard
                  key={week.weekKey}
                  week={week}
                  index={index}
                  colors={{ primary: theme.primary.replace('#', ''), hex: theme.primary }}
                />
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="all"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <AllWorkoutsView 
                allWorkouts={allWorkouts}
                colors={{ primary: theme.primary.replace('#', ''), hex: theme.primary }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

export default StatsSection
