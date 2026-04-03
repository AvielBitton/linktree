'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const HIGHLIGHT_DISTANCES = ['5K', '10K', 'Half-Marathon', 'Marathon']

function PersonalRecords({ records = [] }) {
  const [expanded, setExpanded] = useState(false)

  const highlighted = records.filter(r => HIGHLIGHT_DISTANCES.includes(r.name))
  const rest = records.filter(r => !HIGHLIGHT_DISTANCES.includes(r.name))

  if (highlighted.length === 0) return null

  return (
    <div>
      {/* Inline PR row */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-white/25 text-[11px] uppercase tracking-wider font-medium">Personal Records</p>
        {rest.length > 0 && (
          <button
            onClick={() => setExpanded(v => !v)}
            className="text-white/20 text-[11px] font-medium hover:text-white/40 transition-colors"
          >
            {expanded ? 'Less' : `+${rest.length} more`}
          </button>
        )}
      </div>

      <div className="grid grid-cols-4 gap-1.5">
        {highlighted.map(r => (
          <div key={r.name} className="text-center py-2">
            <p className="text-white/30 text-[10px] font-medium mb-1">{r.name}</p>
            <p className="text-white font-semibold text-sm tabular-nums tracking-tight">{r.formatted_time}</p>
          </div>
        ))}
      </div>

      {/* Expanded details */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="h-px bg-white/[0.06] my-3" />
            <div className="space-y-2">
              {[...highlighted, ...rest].map(r => (
                <div key={r.name} className="flex items-center justify-between py-1">
                  <div className="flex items-center gap-3">
                    <span className="text-white/50 text-xs font-medium w-24">{r.name}</span>
                    <span className="text-white font-semibold text-sm tabular-nums">{r.formatted_time}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-white/20">
                    <span>{r.pace}/km</span>
                    <span>·</span>
                    <span className="truncate max-w-[100px]">{r.activity_name}</span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default PersonalRecords
