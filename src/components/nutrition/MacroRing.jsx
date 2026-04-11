'use client'

import { useEffect, useState } from 'react'

const RING_CONFIG = [
  { key: 'kcal', color: '#3B82F6', label: 'Kcal' },
  { key: 'protein', color: '#22C55E', label: 'Protein' },
  { key: 'carbs', color: '#F97316', label: 'Carbs' },
  { key: 'fat', color: '#EC4899', label: 'Fat' },
]

function MacroRing({ targets, actuals, size = 140 }) {
  const [animated, setAnimated] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 100)
    return () => clearTimeout(t)
  }, [])

  const center = size / 2
  const strokeWidth = 8
  const gap = 3
  const rings = RING_CONFIG.map((cfg, i) => {
    const radius = center - strokeWidth / 2 - i * (strokeWidth + gap)
    const circumference = 2 * Math.PI * radius
    const target = targets[cfg.key] || 0
    const actual = actuals?.[cfg.key] || target
    const progress = target > 0 ? Math.min(actual / target, 1) : 0
    const dashOffset = circumference * (1 - (animated ? progress : 0))

    return { ...cfg, radius, circumference, dashOffset, target, actual, progress }
  })

  return (
    <div className="flex items-center gap-5">
      <svg width={size} height={size} className="flex-shrink-0 -rotate-90">
        {rings.map((ring) => (
          <g key={ring.key}>
            <circle
              cx={center}
              cy={center}
              r={ring.radius}
              fill="none"
              stroke="white"
              strokeOpacity={0.06}
              strokeWidth={strokeWidth}
            />
            <circle
              cx={center}
              cy={center}
              r={ring.radius}
              fill="none"
              stroke={ring.color}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray={ring.circumference}
              strokeDashoffset={ring.dashOffset}
              style={{ transition: 'stroke-dashoffset 1s cubic-bezier(0.4, 0, 0.2, 1)' }}
            />
          </g>
        ))}
      </svg>

      <div className="flex flex-col gap-1.5 min-w-0">
        {rings.map((ring) => (
          <div key={ring.key} className="flex items-center gap-2">
            <div
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ backgroundColor: ring.color }}
            />
            <span className="text-white/50 text-xs">{ring.label}</span>
            <span className="text-white text-xs font-semibold ml-auto">
              {ring.actual}{ring.key === 'kcal' ? '' : 'g'}
              <span className="text-white/30 font-normal">
                /{ring.target}{ring.key === 'kcal' ? 'kcal' : 'g'}
              </span>
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default MacroRing
