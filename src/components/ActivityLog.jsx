'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const TYPE_CONFIG = {
  Run:            { emoji: '🏃', color: '#3B82F6' },
  Ride:           { emoji: '🚴', color: '#3B82F6' },
  Swim:           { emoji: '🏊', color: '#06B6D4' },
  Walk:           { emoji: '🚶', color: '#A78BFA' },
  WeightTraining: { emoji: '🏋️', color: '#F59E0B' },
  Workout:        { emoji: '💪', color: '#F59E0B' },
  Yoga:           { emoji: '🧘', color: '#EC4899' },
  Hike:           { emoji: '🥾', color: '#84CC16' },
  Crossfit:       { emoji: '🔥', color: '#EF4444' },
}

function getTypeInfo(type) {
  return TYPE_CONFIG[type] || { emoji: '🏅', color: '#6B7280' }
}

function paceSeconds(avgSpeed) {
  if (!avgSpeed || avgSpeed <= 0) return null
  return 1000 / avgSpeed
}

function formatPace(avgSpeed) {
  const secs = paceSeconds(avgSpeed)
  if (!secs) return null
  const m = Math.floor(secs / 60)
  const s = Math.round(secs % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}

function formatDistance(meters) {
  if (!meters || meters <= 0) return null
  const km = meters / 1000
  return km >= 1 ? `${km.toFixed(1)} km` : `${Math.round(meters)} m`
}

function formatDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return `${days[d.getDay()]} · ${months[d.getMonth()]} ${d.getDate()}`
}

function formatYear(dateStr) {
  return dateStr?.slice(0, 4) || ''
}

function paceToOpacity(paceSecs, minPace, maxPace) {
  if (!paceSecs || !minPace || !maxPace) return 0.5
  const range = maxPace - minPace
  if (range === 0) return 0.5
  const ratio = 1 - (paceSecs - minPace) / range
  return 0.25 + ratio * 0.55
}

function StatPill({ icon, value, label }) {
  return (
    <div className="bg-white/[0.04] rounded-xl px-3 py-2 flex flex-col items-center gap-0.5 min-w-0">
      <span className="text-[10px] opacity-40">{icon}</span>
      <span className="text-white font-bold text-[13px] tabular-nums leading-tight">{value}</span>
      <span className="text-white/20 text-[9px] font-medium uppercase tracking-wider">{label}</span>
    </div>
  )
}

function SplitsViz({ splits, typeColor }) {
  if (!splits?.length) return null

  const avgPaceSecs = splits.reduce((sum, s) => {
    const p = paceSeconds(s.average_speed)
    return p ? sum + p : sum
  }, 0) / splits.filter(s => paceSeconds(s.average_speed)).length

  const paceSecs = splits.map(s => paceSeconds(s.average_speed) || avgPaceSecs)
  const minPace = Math.min(...paceSecs)
  const maxPace = Math.max(...paceSecs)
  const range = maxPace - minPace || 1

  return (
    <div className="mt-3">
      <div className="flex items-center justify-between mb-2">
        <p className="text-white/25 text-[10px] uppercase tracking-wider font-medium">Splits</p>
        <p className="text-white/15 text-[9px] tabular-nums">
          avg {Math.floor(avgPaceSecs / 60)}:{String(Math.round(avgPaceSecs % 60)).padStart(2, '0')}/km
        </p>
      </div>

      <div className="space-y-[3px]">
        {splits.map((s, i) => {
          const pace = s.pace || formatPace(s.average_speed)
          const secs = paceSeconds(s.average_speed) || avgPaceSecs
          const barWidth = Math.max(25, ((secs - minPace + range * 0.3) / (range * 1.3)) * 100)
          const opacity = paceToOpacity(secs, minPace, maxPace)

          return (
            <div key={i} className="flex items-center gap-1.5">
              <span className="text-white/15 text-[10px] tabular-nums w-4 text-right font-medium shrink-0">
                {s.split || i + 1}
              </span>
              <div className="flex-1 relative h-7 rounded-lg overflow-hidden bg-white/[0.02]">
                <motion.div
                  className="absolute inset-y-0 left-0 rounded-lg"
                  style={{ backgroundColor: typeColor, opacity: opacity * 0.2 }}
                  initial={{ width: 0 }}
                  animate={{ width: `${barWidth}%` }}
                  transition={{ duration: 0.5, delay: i * 0.03, ease: 'easeOut' }}
                />
                <div className="absolute inset-y-0 left-0 right-0 flex items-center px-2.5 gap-3">
                  <span
                    className="font-bold text-[12px] tabular-nums tracking-tight"
                    style={{ color: typeColor, opacity }}
                  >
                    {pace}
                  </span>
                  {s.average_heartrate && (
                    <span className="text-white/20 text-[10px] tabular-nums">
                      ♥ {Math.round(s.average_heartrate)}
                    </span>
                  )}
                  {s.elevation_difference != null && s.elevation_difference !== 0 && (
                    <span className="text-white/15 text-[10px] tabular-nums ml-auto">
                      {s.elevation_difference > 0 ? '↑' : '↓'}{Math.abs(Math.round(s.elevation_difference))}m
                    </span>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Pace range */}
      <div className="flex items-center justify-between mt-2 px-6 text-[10px] tabular-nums text-white/20">
        <span>
          Best {Math.floor(minPace / 60)}:{String(Math.round(minPace % 60)).padStart(2, '0')}
        </span>
        <span className="text-white/10">·</span>
        <span>
          Slowest {Math.floor(maxPace / 60)}:{String(Math.round(maxPace % 60)).padStart(2, '0')}
        </span>
      </div>
    </div>
  )
}

function ExpandedDetail({ activity }) {
  const typeInfo = getTypeInfo(activity.type)
  const pace = formatPace(activity.average_speed)
  const isDistanceActivity = activity.distance > 0

  const stats = []
  if (activity.moving_time_formatted) stats.push({ icon: '⏱', value: activity.moving_time_formatted, label: 'Time' })
  if (isDistanceActivity && pace) stats.push({ icon: '⚡', value: `${pace}/km`, label: 'Pace' })
  if (activity.average_heartrate) stats.push({ icon: '♥', value: `${Math.round(activity.average_heartrate)}`, label: 'Avg HR' })
  if (activity.max_heartrate) stats.push({ icon: '🔺', value: `${Math.round(activity.max_heartrate)}`, label: 'Max HR' })
  if (activity.average_cadence) stats.push({ icon: '🦶', value: `${Math.round(activity.average_cadence * 2)}`, label: 'Cadence' })
  if (activity.total_elevation_gain > 0) stats.push({ icon: '⛰', value: `${Math.round(activity.total_elevation_gain)}m`, label: 'Elevation' })
  if (activity.calories > 0) stats.push({ icon: '🔥', value: `${activity.calories}`, label: 'Calories' })
  if (activity.suffer_score) stats.push({ icon: '💀', value: `${activity.suffer_score}`, label: 'Suffer' })

  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="overflow-hidden"
    >
      <div className="px-3 pb-4 pt-1">
        {/* Gradient divider */}
        <div
          className="h-px mb-3 rounded-full"
          style={{
            background: `linear-gradient(90deg, transparent, ${typeInfo.color}40, transparent)`
          }}
        />

        {/* Stats grid */}
        <div className={`grid gap-1.5 mb-1 ${stats.length <= 4 ? 'grid-cols-4' : stats.length <= 6 ? 'grid-cols-3' : 'grid-cols-4'}`}>
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <StatPill {...s} />
            </motion.div>
          ))}
        </div>

        {/* Splits visualization */}
        <SplitsViz splits={activity.splits_metric} typeColor={typeInfo.color} />
      </div>
    </motion.div>
  )
}

function ActivityItem({ activity }) {
  const [isExpanded, setIsExpanded] = useState(false)
  const typeInfo = getTypeInfo(activity.type)
  const distance = formatDistance(activity.distance)
  const pace = activity.type === 'Run' ? formatPace(activity.average_speed) : null
  const isDistanceActivity = activity.distance > 0

  return (
    <div
      className="rounded-xl border overflow-hidden transition-colors"
      style={{
        backgroundColor: isExpanded ? `${typeInfo.color}08` : 'rgba(255,255,255,0.03)',
        borderColor: isExpanded ? `${typeInfo.color}20` : 'rgba(255,255,255,0.06)',
      }}
    >
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-3 text-left hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center text-base shrink-0"
            style={{ backgroundColor: typeInfo.color + '18' }}
          >
            {typeInfo.emoji}
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-white/25 text-[10px] font-medium mb-0.5">
              {formatDate(activity.date)}
              {activity.start_time && (
                <span className="text-white/15"> · {activity.start_time.slice(0, 5)}</span>
              )}
            </p>
            <p className="text-white/80 font-medium text-sm truncate">{activity.name}</p>
          </div>

          <div className="text-right shrink-0">
            {isDistanceActivity ? (
              <>
                <p className="text-white font-semibold text-sm">{distance}</p>
                {pace && <p className="text-white/25 text-[10px]">{pace}/km</p>}
              </>
            ) : (
              <p className="text-white/50 text-sm font-medium">{activity.moving_time_formatted}</p>
            )}
          </div>

          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.15 }}
            className="text-white/15 shrink-0"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M19 9l-7 7-7-7" />
            </svg>
          </motion.div>
        </div>
      </button>

      <AnimatePresence>
        {isExpanded && <ExpandedDetail activity={activity} />}
      </AnimatePresence>
    </div>
  )
}

function ActivityLog({ activities = [] }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedType, setSelectedType] = useState('all')
  const [selectedYear, setSelectedYear] = useState('all')
  const [sortBy, setSortBy] = useState('date')
  const [visibleCount, setVisibleCount] = useState(15)

  const typeAlias = (type) => {
    if (type === 'WeightTraining' || type === 'Workout') return 'Gym'
    return type
  }

  const availableTypes = useMemo(() => {
    const types = new Set(activities.map(a => typeAlias(a.type)))
    const preferred = ['Run', 'Gym', 'Walk', 'Ride', 'Swim', 'Yoga', 'Hike', 'Crossfit']
    const sorted = preferred.filter(t => types.has(t))
    for (const t of types) {
      if (!sorted.includes(t)) sorted.push(t)
    }
    return ['all', ...sorted]
  }, [activities])

  const availableYears = useMemo(() => {
    const counts = {}
    for (const a of activities) {
      const y = formatYear(a.date)
      if (y) counts[y] = (counts[y] || 0) + 1
    }
    const years = Object.keys(counts).filter(y => counts[y] >= 5)
    return ['all', ...years.sort().reverse()]
  }, [activities])

  const filteredActivities = useMemo(() => {
    let results = activities

    if (selectedType !== 'all') {
      results = results.filter(a => typeAlias(a.type) === selectedType)
    }

    if (selectedYear !== 'all') {
      results = results.filter(a => a.date?.startsWith(selectedYear))
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      results = results.filter(a => {
        const name = (a.name || '').toLowerCase()
        const date = formatDate(a.date).toLowerCase()
        const dist = formatDistance(a.distance) || ''
        return name.includes(q) || date.includes(q) || dist.includes(q)
      })
    }

    if (sortBy === 'distance') {
      results = [...results].sort((a, b) => (b.distance || 0) - (a.distance || 0))
    }

    return results
  }, [activities, selectedType, selectedYear, searchQuery, sortBy])

  const visibleActivities = filteredActivities.slice(0, visibleCount)
  const hasMore = visibleCount < filteredActivities.length

  const totalStats = useMemo(() => {
    let dist = 0, time = 0
    for (const a of filteredActivities) {
      dist += a.distance || 0
      time += a.moving_time || 0
    }
    return {
      count: filteredActivities.length,
      distance: Math.round(dist / 1000),
      hours: Math.round(time / 3600),
    }
  }, [filteredActivities])

  if (activities.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-white/30 text-sm mb-1">No activities yet</p>
        <p className="text-white/15 text-xs">Run the Strava sync to import your data</p>
      </div>
    )
  }

  return (
    <div>
      <motion.div
        className="text-center mb-5"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <p className="text-white/20 text-[11px] uppercase tracking-[0.2em] font-medium">Activity Log</p>
      </motion.div>

      {/* Summary stats */}
      <motion.div
        className="grid grid-cols-3 gap-2 mb-4"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
      >
        <div className="bg-white/[0.03] rounded-xl p-3 border border-white/[0.06] text-center">
          <p className="text-white font-bold text-lg tabular-nums">{totalStats.count}</p>
          <p className="text-white/25 text-[10px] font-medium">Activities</p>
        </div>
        <div className="bg-white/[0.03] rounded-xl p-3 border border-white/[0.06] text-center">
          <p className="text-white font-bold text-lg tabular-nums">{totalStats.distance}<span className="text-white/30 text-xs ml-0.5">km</span></p>
          <p className="text-white/25 text-[10px] font-medium">Distance</p>
        </div>
        <div className="bg-white/[0.03] rounded-xl p-3 border border-white/[0.06] text-center">
          <p className="text-white font-bold text-lg tabular-nums">{totalStats.hours}<span className="text-white/30 text-xs ml-0.5">h</span></p>
          <p className="text-white/25 text-[10px] font-medium">Moving</p>
        </div>
      </motion.div>

      {/* Search */}
      <motion.div
        className="space-y-2.5 mb-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <div className="relative">
          <input
            type="text"
            placeholder="Search activities..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setVisibleCount(15) }}
            className="w-full bg-white/[0.04] border border-white/[0.06] rounded-xl px-4 py-2.5 pl-10 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-white/[0.12] transition-colors"
          />
          <svg
            className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/20"
            viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/40"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Type filters */}
        <div className="flex gap-1.5">
          {availableTypes.map(type => {
            const infoKey = type === 'Gym' ? 'WeightTraining' : type
            const info = type === 'all' ? null : getTypeInfo(infoKey)
            const isActive = selectedType === type
            const label = type === 'all' ? 'All' : type
            return (
              <button
                key={type}
                onClick={() => { setSelectedType(isActive && type !== 'all' ? 'all' : type); setVisibleCount(15) }}
                className="px-2.5 py-1.5 rounded-lg text-[11px] font-medium whitespace-nowrap transition-all flex items-center gap-1"
                style={isActive && info ? {
                  backgroundColor: info.color + '20',
                  color: info.color,
                } : isActive ? {
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  color: 'white',
                } : {
                  backgroundColor: 'rgba(255,255,255,0.03)',
                  color: 'rgba(255,255,255,0.3)',
                }}
              >
                {info && <span className="text-[10px]">{info.emoji}</span>}
                {label}
              </button>
            )
          })}
        </div>

        {/* Year + Sort */}
        <div className="flex items-center justify-between">
          <div className="flex gap-1">
            {availableYears.map(year => (
              <button
                key={year}
                onClick={() => { setSelectedYear(year); setVisibleCount(15) }}
                className={`px-2 py-1 rounded-md text-[11px] font-medium transition-colors ${
                  selectedYear === year
                    ? 'bg-white/[0.08] text-white/60'
                    : 'text-white/25 hover:text-white/40'
                }`}
              >
                {year === 'all' ? 'All Years' : year}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-0.5 text-[11px]">
            <button
              onClick={() => setSortBy('date')}
              className={`px-2 py-1 rounded-md font-medium transition-colors ${
                sortBy === 'date' ? 'bg-white/[0.08] text-white/60' : 'text-white/25 hover:text-white/40'
              }`}
            >
              Date
            </button>
            <button
              onClick={() => setSortBy('distance')}
              className={`px-2 py-1 rounded-md font-medium transition-colors ${
                sortBy === 'distance' ? 'bg-white/[0.08] text-white/60' : 'text-white/25 hover:text-white/40'
              }`}
            >
              KM
            </button>
          </div>
        </div>
      </motion.div>

      {/* Activity list */}
      <motion.div
        className="space-y-1.5"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15 }}
      >
        {visibleActivities.map((activity) => (
          <ActivityItem key={activity.id} activity={activity} />
        ))}
      </motion.div>

      {hasMore && (
        <button
          onClick={() => setVisibleCount(prev => Math.min(prev + 15, filteredActivities.length))}
          className="w-full mt-3 py-2.5 bg-white/[0.03] hover:bg-white/[0.05] rounded-xl text-white/30 text-xs font-medium transition-colors border border-white/[0.06]"
        >
          Load more ({filteredActivities.length - visibleCount} remaining)
        </button>
      )}

      {filteredActivities.length === 0 && (
        <div className="text-center py-8">
          <p className="text-white/20 text-sm">No activities found</p>
          <p className="text-white/10 text-xs mt-1">Try a different search or filter</p>
        </div>
      )}
    </div>
  )
}

export default ActivityLog
