'use client'

import { useState, useCallback, useMemo, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Tabs, TabsContent } from '@/src/components/ui/tabs'
import { EditModeProvider } from './contexts/EditModeContext'
import SocialIcons from './components/SocialIcons'
import EditModeToggle from './components/EditModeToggle'
import BottomNav from './components/BottomNav'
import DayRow from './components/dashboard/DayRow'
import WorkoutDetailModal from './components/dashboard/WorkoutDetailModal'
import NavArrow from './components/dashboard/NavArrow'
import PersonalRecords from './components/PersonalRecords'
import NextWorkoutTab from './components/NextWorkoutTab'
import ActivityLog from './components/ActivityLog'
import GymTab from './components/GymTab'
import NutritionTab from './components/NutritionTab'
import TelAviv2026Content from './components/TelAviv2026Content'
import DashboardTab from './components/DashboardTab'
import { hydrateWorkouts, mergeStravaActivities, assignGymTemplates } from './utils/workouts'
import { getWeekSunday, buildWeekData } from './utils/dashboard'
import RUNNA_PLAN from './utils/runna-plan'

function App({ initialWorkouts = [], stravaPRs = [], stravaActivities = [], archiveWorkouts = [], gymTemplates = [], gymSessions = [], gymWeights = [], customExercises = [], mealPlans = [], mealCompletions = [] }) {
  const allWorkouts = useMemo(
    () => assignGymTemplates(mergeStravaActivities(hydrateWorkouts(initialWorkouts), stravaActivities), gymTemplates, gymSessions),
    [initialWorkouts, stravaActivities, gymTemplates, gymSessions]
  )

  const planData = useMemo(() => {
    const plan = { ...RUNNA_PLAN }
    const today = new Date().toISOString().slice(0, 10)
    const planStart = plan.weekRanges[1]?.start
    const planEnd = plan.weekRanges[plan.totalWeeks]?.end

    let currentWeek = null
    for (const [w, range] of Object.entries(plan.weekRanges)) {
      if (today >= range.start && today <= range.end) {
        currentWeek = parseInt(w)
        break
      }
    }
    if (!currentWeek && planStart && today < planStart) currentWeek = 0
    if (!currentWeek && planEnd && today > planEnd) currentWeek = plan.totalWeeks
    plan.currentWeek = currentWeek

    if (plan.raceDate) {
      const race = new Date(plan.raceDate + 'T00:00:00')
      plan.daysToRace = Math.ceil((race - new Date()) / (1000 * 60 * 60 * 24))
    }

    let completedKm = 0
    if (planStart && planEnd) {
      for (const w of allWorkouts) {
        const d = (w.WorkoutDay || '').slice(0, 10)
        if (!d || d < planStart || d > planEnd) continue
        if (w.WorkoutType !== 'Run') continue
        const actual = parseFloat(w.DistanceInMeters) || 0
        if (actual > 0) completedKm += actual / 1000
      }
    }
    plan.completedKm = Math.round(completedKm * 10) / 10

    return plan
  }, [allWorkouts])

  const { firstDate, lastDate } = useMemo(() => {
    const sorted = [...allWorkouts].sort((a, b) => a.date - b.date)
    return {
      firstDate: sorted.length > 0 ? sorted[0].date : new Date(),
      lastDate: sorted.length > 0 ? sorted[sorted.length - 1].date : new Date(),
    }
  }, [allWorkouts])

  const [activeTab, setActiveTab] = useState('home')
  const [currentSunday, setCurrentSunday] = useState(() => getWeekSunday(new Date()))
  const [selectedWorkout, setSelectedWorkout] = useState(null)
  const [swipeDir, setSwipeDir] = useState(0)
  const touchRef = useRef(null)

  const navigateWeek = useCallback((offset) => {
    setSwipeDir(offset)
    setCurrentSunday(prev => {
      const next = new Date(prev)
      next.setDate(prev.getDate() + offset * 7)
      return next
    })
  }, [])

  const isCurrentWeek = currentSunday && getWeekSunday(new Date()).getTime() === currentSunday.getTime()
  const canGoBack = currentSunday && firstDate && currentSunday > getWeekSunday(firstDate)
  const maxForwardSunday = getWeekSunday(new Date())
  maxForwardSunday.setDate(maxForwardSunday.getDate() + 3 * 7)
  const canGoForward = currentSunday && currentSunday < maxForwardSunday && lastDate && currentSunday < getWeekSunday(lastDate)

  const weekData = currentSunday && firstDate
    ? buildWeekData(allWorkouts, currentSunday, firstDate)
    : null

  const handleTouchStart = useCallback((e) => {
    touchRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
  }, [])

  const handleTouchEnd = useCallback((e) => {
    if (!touchRef.current) return
    const dx = e.changedTouches[0].clientX - touchRef.current.x
    const dy = e.changedTouches[0].clientY - touchRef.current.y
    touchRef.current = null
    if (Math.abs(dx) < 60 || Math.abs(dy) > Math.abs(dx)) return
    if (dx > 0 && canGoBack) navigateWeek(-1)
    else if (dx < 0 && canGoForward) navigateWeek(1)
  }, [canGoBack, canGoForward, navigateWeek])

  const handleShare = useCallback(async () => {
    const text = `Week ${weekData?.weekNum} | ${weekData?.dateRange} | Done: ${weekData?.totalActualKm} km`
    const url = typeof window !== 'undefined' ? window.location.href : 'https://aviel.club'
    if (navigator.share) {
      try { await navigator.share({ title: 'Aviel Bitton', text, url }) } catch {}
    } else {
      await navigator.clipboard.writeText(`${text}\n${url}`)
    }
  }, [weekData])

  return (
    <EditModeProvider>
    <Tabs value={activeTab} onValueChange={setActiveTab} className="min-h-screen bg-[#0D1117]">
      <div className="max-w-lg mx-auto px-5 py-8 sm:py-12 pb-24">

        {/* Header */}
        <motion.div
          className="mb-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.05, duration: 0.6 }}
        >
          <div className="flex items-center justify-between mb-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Aviel Bitton
            </h1>
            <div className="flex items-center gap-1">
              <EditModeToggle />
              <SocialIcons onShare={handleShare} />
            </div>
          </div>
          <p className="text-white/30 text-xs font-medium">
            Live boldly as a <span className="text-amber-400/80 font-semibold">FREE SPIRIT</span>
          </p>
        </motion.div>

        {/* Dashboard Tab (Home) */}
        <TabsContent value="home" className="mt-0">
          <DashboardTab
            workouts={allWorkouts}
            stravaActivities={stravaActivities}
            stravaPRs={stravaPRs}
            gymSessions={gymSessions}
            gymTemplates={gymTemplates}
            gymWeights={gymWeights}
            mealPlans={mealPlans}
            mealCompletions={mealCompletions}
            runnaPlan={planData}
            onTabChange={setActiveTab}
          />
        </TabsContent>

        {/* Schedule Tab (old Home) */}
        <TabsContent value="schedule" className="mt-0">
          {/* Week Header with Navigation */}
          <motion.div
            className="mb-3"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.5 }}
          >
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2.5">
                <h2 className="text-white font-bold text-base tracking-tight">{weekData?.dateRange}</h2>
                {(() => {
                  if (!planData?.weekRanges || !weekData) return (
                    <span className="bg-white/[0.08] text-white/60 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                      Week {weekData?.weekNum}
                    </span>
                  )
                  const weekSun = currentSunday.toISOString().slice(0, 10)
                  const weekSat = new Date(currentSunday.getTime() + 6 * 86400000).toISOString().slice(0, 10)
                  for (const [w, range] of Object.entries(planData.weekRanges)) {
                    if (weekSat >= range.start && weekSun <= range.end) {
                      return (
                        <span className="bg-pink-500/15 text-pink-400 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                          Plan {w}/{planData.totalWeeks}
                        </span>
                      )
                    }
                  }
                  return (
                    <span className="bg-white/[0.08] text-white/60 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                      Week {weekData?.weekNum}
                    </span>
                  )
                })()}
              </div>
              <div className="flex items-center gap-0.5">
                <NavArrow direction="left" onClick={() => navigateWeek(-1)} disabled={!canGoBack} />
                <button
                  onClick={() => setCurrentSunday(getWeekSunday(new Date()))}
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                    isCurrentWeek
                      ? 'text-run cursor-default'
                      : 'text-white/30 hover:text-run hover:bg-white/[0.06] active:bg-white/[0.1]'
                  }`}
                >
                  <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    {isCurrentWeek && <circle cx="12" cy="15" r="2" fill="currentColor" stroke="none" />}
                  </svg>
                </button>
                <NavArrow direction="right" onClick={() => navigateWeek(1)} disabled={!canGoForward} />
              </div>
            </div>
            <div className="flex items-center gap-4 text-xs font-medium">
              {weekData?.totalPlannedKm === 0 && weekData?.totalActualKm === 0 ? (
                <p className="text-white/25">Recovery Week</p>
              ) : (
                <>
                  {weekData?.totalPlannedKm > 0 && (
                    <p className="text-white/30">
                      Plan:{' '}
                      <span className="text-white/50 font-bold">
                        {weekData?.plannedIsEstimate ? '~' : ''}{weekData?.totalPlannedKm} km
                      </span>
                    </p>
                  )}
                  <p className="text-run/80">
                    Done:{' '}
                    <span className="text-white font-bold">
                      {weekData?.totalActualKm} km
                    </span>
                  </p>
                </>
              )}
            </div>
          </motion.div>

          {/* Divider */}
          <div className="h-px bg-gradient-to-r from-white/[0.06] via-white/[0.03] to-transparent mb-1" />

          {/* Day Rows */}
          <div onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
            <AnimatePresence mode="wait">
              <motion.div
                key={currentSunday?.getTime()}
                initial={{ opacity: 0, x: swipeDir * 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: swipeDir * -40 }}
                transition={{ duration: 0.2 }}
              >
                {weekData?.days.map((day, i) => (
                  <DayRow
                    key={i}
                    dayName={day.dayName}
                    dateNum={day.dateNum}
                    dateStr={day.dateStr}
                    workouts={day.workouts}
                    onSelectWorkout={setSelectedWorkout}
                  />
                ))}
              </motion.div>
            </AnimatePresence>
          </div>
        </TabsContent>

        {/* Next Workout Tab */}
        <TabsContent value="next" className="mt-0">
          <NextWorkoutTab workouts={allWorkouts} />
        </TabsContent>

        {/* Log Tab */}
        <TabsContent value="log" className="mt-0">
          <ActivityLog activities={stravaActivities} />
        </TabsContent>

        {/* Nutrition Tab */}
        <TabsContent value="nutrition" className="mt-0">
          <NutritionTab plans={mealPlans} completions={mealCompletions} />
        </TabsContent>

        {/* Gym Tab */}
        <TabsContent value="gym" className="mt-0">
          <GymTab templates={gymTemplates} sessions={gymSessions} customExercises={customExercises} />
        </TabsContent>

        {/* PRs Tab */}
        <TabsContent value="prs" className="mt-0">
          <PersonalRecords records={stravaPRs} fullView />
        </TabsContent>

        {/* Archive Tab */}
        <TabsContent value="archive" className="mt-0">
          <TelAviv2026Content initialWorkouts={archiveWorkouts} />
        </TabsContent>

      </div>

      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />

      <AnimatePresence>
        {selectedWorkout && (
          <WorkoutDetailModal
            key="workout-modal"
            workout={selectedWorkout}
            stravaActivities={stravaActivities}
            onClose={() => setSelectedWorkout(null)}
          />
        )}
      </AnimatePresence>
    </Tabs>
    </EditModeProvider>
  )
}

export default App
