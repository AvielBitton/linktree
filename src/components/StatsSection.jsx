import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip, BarChart, Bar } from 'recharts'
import { loadWorkouts, getAllWeeksStats, formatPace, isCompletedRun } from '../utils/workouts'
import WeekCard from './WeekCard'
import AllWorkoutsView from './AllWorkoutsView'

// Progress Ring Component
function ProgressRing({ progress, size = 80, strokeWidth = 6, color = '#8b5cf6' }) {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const offset = circumference - (progress / 100) * circumference
  
  return (
    <div className="relative" style={{ width: size, height: size }}>
      {/* Background circle */}
      <svg className="transform -rotate-90" width={size} height={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.1)"
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
          style={{
            strokeDasharray: circumference,
            filter: `drop-shadow(0 0 6px ${color})`
          }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-white font-bold text-lg">{Math.round(progress)}%</span>
      </div>
    </div>
  )
}

// Custom Tooltip for Charts
function CustomTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-black/80 backdrop-blur-sm border border-white/20 rounded-lg px-3 py-2">
        <p className="text-white/60 text-xs mb-1">{label}</p>
        <p className="text-white font-bold">{payload[0].value} km</p>
      </div>
    )
  }
  return null
}

// Color themes
const colorThemes = {
  default: {
    primary: '#8b5cf6', // violet
    secondary: '#ec4899', // fuchsia
    gradientClass: 'from-violet-500/10 to-fuchsia-500/10',
    buttonActive: 'bg-violet-500',
    spinnerBorder: 'border-violet-500'
  },
  asaf: {
    primary: '#10b981', // emerald
    secondary: '#14b8a6', // teal
    gradientClass: 'from-emerald-500/10 to-teal-500/10',
    buttonActive: 'bg-emerald-500',
    spinnerBorder: 'border-emerald-500'
  }
}

function StatsSection({ traineeId = null }) {
  const [weeks, setWeeks] = useState([])
  const [allWorkouts, setAllWorkouts] = useState([])
  const [allTimeStats, setAllTimeStats] = useState({ distance: 0, runs: 0 })
  const [loading, setLoading] = useState(true)
  const [selectedView, setSelectedView] = useState('distance')
  const [workoutsTab, setWorkoutsTab] = useState('weeks') // 'weeks' or 'all'
  
  // Get color theme based on traineeId
  const theme = traineeId && colorThemes[traineeId] ? colorThemes[traineeId] : colorThemes.default
  
  useEffect(() => {
    async function fetchData() {
      try {
        const workouts = await loadWorkouts(traineeId)
        const stats = getAllWeeksStats(workouts)
        setWeeks(stats.slice(0, 12)) // Last 12 weeks
        
        // Store all workouts for AllWorkoutsView
        // We need to process them with the same data structure as week workouts
        const completedRuns = workouts.filter(isCompletedRun)
        const processedWorkouts = completedRuns.map(w => {
          const distance = parseFloat(w.DistanceInMeters) || 0
          const velocity = parseFloat(w.VelocityAverage) || 0
          const pace = velocity > 0 ? (1000 / velocity) / 60 : null // min/km
          
          return {
            ...w,
            distanceKm: Math.round(distance / 100) / 10,
            pace: pace,
            paceFormatted: formatPace(pace),
            hr: parseFloat(w.HeartRateAverage) || null,
            durationHours: parseFloat(w.TimeTotalInHours) || 0,
            cadence: parseFloat(w.CadenceAverage) || null,
            rpe: parseFloat(w.Rpe) || null,
          }
        }).sort((a, b) => new Date(b.WorkoutDay) - new Date(a.WorkoutDay))
        
        setAllWorkouts(processedWorkouts)
        
        // Calculate all-time stats
        let totalDist = 0
        for (const run of completedRuns) {
          totalDist += parseFloat(run.DistanceInMeters) || 0
        }
        setAllTimeStats({
          distance: Math.round(totalDist / 1000),
          runs: completedRuns.length
        })
      } catch (err) {
        console.error('Error loading stats:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [traineeId])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <motion.div 
          className={`w-8 h-8 border-2 ${theme.spinnerBorder} border-t-transparent rounded-full`}
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
      </div>
    )
  }

  if (weeks.length === 0) {
    return (
      <div className="text-center text-gray-500 text-sm py-8">
        No stats available yet.
      </div>
    )
  }

  // Prepare chart data (reversed for chronological order)
  const chartData = [...weeks].reverse().map(week => ({
    week: week.weekKey.split('-')[1],
    distance: week.distanceKm,
    pace: week.avgPace ? parseFloat(week.avgPace.toFixed(2)) : 0,
    hr: week.avgHR || 0,
    runs: week.workoutCount
  }))
  
  // Calculate totals and averages (from last 12 weeks for display)
  const last12WeeksDistance = weeks.reduce((sum, w) => sum + w.distanceKm, 0)
  const last12WeeksRuns = weeks.reduce((sum, w) => sum + w.workoutCount, 0)
  const bestWeek = Math.max(...weeks.map(w => w.distanceKm))
  
  // Marathon training progress
  // Goal = current total + 40km per week until marathon (28 Feb 2026)
  const marathonDate = new Date(2026, 1, 28) // Feb 28, 2026
  const now = new Date()
  const weeksUntilMarathon = Math.max(0, Math.ceil((marathonDate - now) / (7 * 24 * 60 * 60 * 1000)))
  const weeklyTarget = 40
  const marathonGoalKm = allTimeStats.distance + (weeklyTarget * weeksUntilMarathon)
  const marathonProgress = Math.min((allTimeStats.distance / marathonGoalKm) * 100, 100)
  
  // Current week vs last week comparison
  const currentWeek = weeks[0]
  const lastWeek = weeks[1]
  const weekOverWeekChange = lastWeek 
    ? ((currentWeek.distanceKm - lastWeek.distanceKm) / lastWeek.distanceKm * 100)
    : 0

  return (
    <div className="space-y-4">
      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        {/* Marathon Progress Ring */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`col-span-2 bg-gradient-to-br ${theme.gradientClass} backdrop-blur-sm rounded-2xl p-4 border border-white/10`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/40 text-xs uppercase tracking-wider mb-1">Marathon Training</p>
              <p className="text-white font-bold text-2xl">{allTimeStats.distance} km</p>
              <p className="text-white/50 text-xs">of {marathonGoalKm} km goal</p>
            </div>
            <ProgressRing progress={marathonProgress} size={70} color={theme.primary} />
          </div>
        </motion.div>
        
        {/* This Week */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10"
        >
          <p className="text-white/40 text-xs mb-2">This Week</p>
          <p className="text-white font-bold text-xl">{currentWeek.distanceKm} km</p>
          <div className={`flex items-center gap-1 mt-1 text-xs ${weekOverWeekChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            <span>{weekOverWeekChange >= 0 ? '↑' : '↓'}</span>
            <span>{Math.abs(weekOverWeekChange).toFixed(0)}% vs last week</span>
          </div>
        </motion.div>
        
        {/* Best Week */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10"
        >
          <p className="text-white/40 text-xs mb-2">Best Week</p>
          <p className="text-white font-bold text-xl">{bestWeek} km</p>
          <p className="text-yellow-400 text-xs mt-1">🏆 Personal Record</p>
        </motion.div>
        
        {/* Average Pace */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10"
        >
          <p className="text-white/40 text-xs mb-2">Avg Pace</p>
          <p className="text-white font-bold text-xl">{formatPace(currentWeek.avgPace)}</p>
          <p className="text-white/40 text-xs mt-1">min/km</p>
        </motion.div>
        
        {/* Total Runs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10"
        >
          <p className="text-white/40 text-xs mb-2">Total Runs</p>
          <p className="text-white font-bold text-xl">{allTimeStats.runs}</p>
          <p className="text-white/40 text-xs mt-1">all time</p>
        </motion.div>
      </div>
      
      {/* Weekly Distance Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10"
      >
        <div className="flex items-center justify-between mb-4">
          <p className="text-white/60 text-sm font-medium">Weekly Distance <span className="text-white/30 font-normal">(last 12)</span></p>
          <div className="flex gap-1 bg-white/5 rounded-lg p-0.5">
            <button
              onClick={() => setSelectedView('distance')}
              className={`px-2 py-1 text-xs rounded-md transition-all ${
                selectedView === 'distance' 
                  ? `${theme.buttonActive} text-white` 
                  : 'text-white/40 hover:text-white/60'
              }`}
            >
              Distance
            </button>
            <button
              onClick={() => setSelectedView('runs')}
              className={`px-2 py-1 text-xs rounded-md transition-all ${
                selectedView === 'runs' 
                  ? `${theme.buttonActive} text-white` 
                  : 'text-white/40 hover:text-white/60'
              }`}
            >
              Runs
            </button>
          </div>
        </div>
        
        <div className="h-40">
          <ResponsiveContainer width="100%" height="100%">
            {selectedView === 'distance' ? (
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id={`distanceGradient-${traineeId || 'default'}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={theme.primary} stopOpacity={0.4} />
                    <stop offset="100%" stopColor={theme.primary} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="week" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }}
                  width={30}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="distance"
                  stroke={theme.primary}
                  strokeWidth={2}
                  fill={`url(#distanceGradient-${traineeId || 'default'})`}
                />
              </AreaChart>
            ) : (
              <BarChart data={chartData}>
                <XAxis 
                  dataKey="week" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }}
                  width={30}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(0,0,0,0.8)', 
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '8px'
                  }}
                  labelStyle={{ color: 'rgba(255,255,255,0.6)' }}
                />
                <Bar 
                  dataKey="runs" 
                  fill={theme.primary} 
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </motion.div>
      
      {/* Workouts Section with Tabs */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="space-y-3"
      >
        {/* Tab Buttons */}
        <div className="flex border-b border-white/10">
          <button
            onClick={() => setWorkoutsTab('weeks')}
            className={`flex-1 py-2 text-xs font-medium transition-all border-b-2 -mb-px ${
              workoutsTab === 'weeks'
                ? 'text-white border-white/60'
                : 'text-white/40 border-transparent hover:text-white/60'
            }`}
          >
            Recent Weeks
          </button>
          <button
            onClick={() => setWorkoutsTab('all')}
            className={`flex-1 py-2 text-xs font-medium transition-all border-b-2 -mb-px ${
              workoutsTab === 'all'
                ? 'text-white border-white/60'
                : 'text-white/40 border-transparent hover:text-white/60'
            }`}
          >
            All Workouts
          </button>
        </div>
        
        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {workoutsTab === 'weeks' ? (
            <motion.div
              key="weeks"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
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
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <AllWorkoutsView 
                allWorkouts={allWorkouts}
                colors={{ primary: theme.primary.replace('#', ''), hex: theme.primary }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}

export default StatsSection
