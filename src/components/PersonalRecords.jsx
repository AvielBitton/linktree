'use client'

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, Tooltip } from 'recharts'

const HIGHLIGHT_DISTANCES = ['5K', '10K', 'Half-Marathon', 'Marathon']

function parsePace(paceStr) {
  if (!paceStr || paceStr === '—') return 0
  const [m, s] = paceStr.split(':').map(Number)
  return m + (s || 0) / 60
}

function PaceTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="bg-[#1c1c1e] border border-white/10 rounded-xl px-3 py-2">
      <p className="text-white font-semibold text-sm">{d.name}</p>
      <p className="text-white/60 text-xs">{d.formatted_time} ({d.pace}/km)</p>
    </div>
  )
}

function PersonalRecords({ records = [], fullView = false }) {
  if (records.length === 0) {
    return (
      <div className="text-center text-white/30 text-sm py-12">
        No personal records yet.
      </div>
    )
  }

  const chartData = useMemo(() =>
    records.map(r => ({
      ...r,
      paceNum: parsePace(r.pace),
      label: r.name.replace('Half-Marathon', 'Half').replace('Marathon', 'Full'),
    })),
    [records]
  )

  const maxPace = useMemo(() => Math.max(...chartData.map(d => d.paceNum)), [chartData])

  if (fullView) {
    const highlighted = records.filter(r => HIGHLIGHT_DISTANCES.includes(r.name))

    return (
      <div>
        <motion.div
          className="text-center mb-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <p className="text-white/20 text-[11px] uppercase tracking-[0.2em] font-medium">Personal Records</p>
        </motion.div>

        {/* Hero cards for key distances */}
        <div className="grid grid-cols-2 gap-2.5 mb-6">
          {highlighted.map((r, i) => (
            <motion.div
              key={r.name}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08, duration: 0.4 }}
              className="bg-white/[0.03] rounded-2xl p-4 border border-white/[0.06]"
            >
              <p className="text-white/30 text-[11px] font-medium mb-2">{r.name}</p>
              <p className="text-white font-bold text-2xl tabular-nums tracking-tight">{r.formatted_time}</p>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="text-white/20 text-[10px] font-medium">{r.pace}/km</span>
              </div>
              <div className="mt-3 pt-2.5 border-t border-white/[0.04]">
                <p className="text-white/25 text-[10px] truncate">{r.activity_name}</p>
                <p className="text-white/15 text-[10px]">{r.date}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Pace chart */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35 }}
          className="bg-white/[0.03] rounded-2xl p-4 border border-white/[0.06] mb-6 overflow-hidden"
        >
          <p className="text-white/30 text-[11px] font-medium mb-4">Pace by Distance</p>
          <div className="h-48 -ml-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
                <XAxis
                  dataKey="label"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'rgba(255,255,255,0.25)', fontSize: 9 }}
                  interval={0}
                  angle={-40}
                  textAnchor="end"
                  height={45}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'rgba(255,255,255,0.2)', fontSize: 9 }}
                  domain={[0, (d) => Math.ceil(d) + 0.5]}
                  tickFormatter={v => `${Math.floor(v)}:${String(Math.round((v % 1) * 60)).padStart(2, '0')}`}
                  width={36}
                />
                <Tooltip content={<PaceTooltip />} cursor={false} />
                <Bar dataKey="paceNum" radius={[4, 4, 0, 0]} maxBarSize={24}>
                  {chartData.map((entry, i) => (
                    <Cell
                      key={i}
                      fill={HIGHLIGHT_DISTANCES.includes(entry.name) ? '#F59E0B' : 'rgba(255,255,255,0.12)'}
                      opacity={HIGHLIGHT_DISTANCES.includes(entry.name) ? 0.8 : 0.5}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* All distances */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <p className="text-white/20 text-[11px] uppercase tracking-wider font-medium mb-3">All Distances</p>
          {records.map((r, i) => (
            <div
              key={r.name}
              className="flex items-center justify-between py-2.5 border-b border-white/[0.04] last:border-b-0"
            >
              <div className="flex items-center gap-3">
                <span className="text-white/40 text-xs font-medium w-20">{r.name}</span>
                <span className="text-white font-semibold text-sm tabular-nums">{r.formatted_time}</span>
              </div>
              <div className="flex items-center gap-2 text-[10px] text-white/20">
                <span>{r.pace}/km</span>
                <span className="text-white/10">·</span>
                <span className="truncate max-w-[90px]">{r.activity_name}</span>
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    )
  }

  // Compact inline view
  const highlighted = records.filter(r => HIGHLIGHT_DISTANCES.includes(r.name))
  if (highlighted.length === 0) return null

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-white/25 text-[11px] uppercase tracking-wider font-medium">Personal Records</p>
      </div>
      <div className="grid grid-cols-4 gap-1.5">
        {highlighted.map(r => (
          <div key={r.name} className="text-center py-2">
            <p className="text-white/30 text-[10px] font-medium mb-1">{r.name}</p>
            <p className="text-white font-semibold text-sm tabular-nums tracking-tight">{r.formatted_time}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default PersonalRecords
