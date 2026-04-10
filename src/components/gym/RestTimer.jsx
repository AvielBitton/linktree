'use client'

import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'

function RestTimer({ seconds, templateColor = '#3B82F6', onDismiss, onFinish }) {
  const [remaining, setRemaining] = useState(seconds)
  const [paused, setPaused] = useState(false)
  const onFinishRef = useRef(onFinish)
  const onDismissRef = useRef(onDismiss)

  useEffect(() => { onFinishRef.current = onFinish }, [onFinish])
  useEffect(() => { onDismissRef.current = onDismiss }, [onDismiss])

  useEffect(() => {
    if (paused) return
    const id = setInterval(() => {
      setRemaining(prev => {
        if (prev <= 1) { clearInterval(id); return 0 }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(id)
  }, [paused])

  useEffect(() => {
    if (remaining === 0) {
      try { navigator.vibrate?.([100, 50, 100]) } catch {}
      onFinishRef.current?.()
    }
  }, [remaining])

  const totalSeconds = useRef(seconds).current
  const progress = 1 - remaining / totalSeconds
  const mins = Math.floor(remaining / 60)
  const secs = remaining % 60
  const circumference = 2 * Math.PI * 44
  const isEnding = remaining <= 5 && remaining > 0

  const ringColor = isEnding ? '#F97316' : templateColor

  return (
    <motion.div
      initial={{ opacity: 0, y: 60, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 60, scale: 0.9 }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[60]"
    >
      <div className="bg-[#161B22]/95 backdrop-blur-xl border border-white/[0.08] rounded-2xl shadow-2xl shadow-black/50 p-4 flex items-center gap-4">
        <div className={`relative w-[72px] h-[72px] flex-shrink-0 ${isEnding ? 'animate-pulse' : ''}`}>
          <svg className="w-[72px] h-[72px] -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="44" fill="none" stroke="white" strokeOpacity="0.06" strokeWidth="4" />
            <circle
              cx="50" cy="50" r="44" fill="none"
              stroke={ringColor}
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={circumference * (1 - progress)}
              className="transition-all duration-1000 ease-linear"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={`text-xl font-bold tabular-nums ${isEnding ? 'text-orange-400' : 'text-white'}`}>
              {mins}:{secs.toString().padStart(2, '0')}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-[10px] text-white/30 font-medium uppercase tracking-wider">Rest</span>
          <div className="flex gap-1.5">
            <button
              onClick={() => setPaused(p => !p)}
              className="w-9 h-9 rounded-lg bg-white/[0.06] flex items-center justify-center text-white/40 hover:bg-white/[0.1] active:scale-95 transition-all"
            >
              {paused ? (
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21" /></svg>
              ) : (
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" /></svg>
              )}
            </button>
            <button
              onClick={() => setRemaining(prev => prev + 15)}
              className="h-9 px-3 rounded-lg bg-white/[0.06] text-[10px] text-white/30 font-medium hover:bg-white/[0.1] active:scale-95 transition-all"
            >
              +15s
            </button>
            <button
              onClick={() => onDismissRef.current?.()}
              className="h-9 px-3 rounded-lg bg-white/[0.06] text-[10px] text-white/30 font-medium hover:bg-white/[0.1] active:scale-95 transition-all"
            >
              Skip
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export default RestTimer
