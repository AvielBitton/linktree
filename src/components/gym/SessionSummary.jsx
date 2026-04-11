'use client'

import { motion } from 'framer-motion'

const icons = {
  duration: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  volume: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6.5 6.5a2 2 0 0 1 2-2h0a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2h0a2 2 0 0 1-2-2z" />
      <path d="M13.5 6.5a2 2 0 0 1 2-2h0a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2h0a2 2 0 0 1-2-2z" />
      <path d="M4 12h2.5" /><path d="M17.5 12H20" /><path d="M2 10v4" /><path d="M22 10v4" />
    </svg>
  ),
  sets: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  exercises: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
  ),
}

function SessionSummary({ session, templateColor = '#10B981', onClose }) {
  if (!session) return null

  const duration = session.durationSeconds || 0
  const mins = Math.floor(duration / 60)
  const totalVolume = (session.exerciseLogs || []).reduce(
    (sum, l) => sum + (l.weightKg || 0) * (l.reps || 0), 0
  )
  const completedSets = (session.exerciseLogs || []).length
  const exerciseCount = new Set((session.exerciseLogs || []).map(l => l.exerciseKey)).size

  const stats = [
    { label: 'Duration', value: `${mins} min`, icon: icons.duration },
    { label: 'Volume', value: `${totalVolume.toLocaleString()} kg`, icon: icons.volume },
    { label: 'Sets', value: completedSets, icon: icons.sets },
    { label: 'Exercises', value: exerciseCount, icon: icons.exercises },
  ]

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[70] bg-[#0D1117]/95 backdrop-blur-xl flex items-center justify-center p-6"
    >
      <motion.div
        initial={{ scale: 0.85, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.85, opacity: 0, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="w-full max-w-sm"
      >
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', damping: 15 }}
            className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5"
            style={{ backgroundColor: templateColor + '15', border: `1px solid ${templateColor}30` }}
          >
            <svg className="w-10 h-10" style={{ color: templateColor }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </motion.div>
          <h2 className="text-xl font-bold text-white mb-1 tracking-tight">Workout Complete</h2>
          <p className="text-white/30 text-xs">{session.templateName}</p>
        </div>

        <div className="grid grid-cols-2 gap-2.5 mb-8">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.08 }}
              className="bg-white/[0.04] rounded-xl p-3.5 border border-white/[0.04]"
            >
              <div className="text-white/20 mb-2">{stat.icon}</div>
              <p className="text-base font-bold text-white tabular-nums">{stat.value}</p>
              <p className="text-[10px] text-white/25 font-medium mt-0.5">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          onClick={onClose}
          className="w-full py-3 rounded-xl text-sm font-bold active:scale-[0.98] transition-all"
          style={{ backgroundColor: templateColor + '20', color: templateColor }}
        >
          Done
        </motion.button>
      </motion.div>
    </motion.div>
  )
}

export default SessionSummary
