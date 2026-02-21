import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

function parseDate(dateStr) {
  const months = {
    'January': 0, 'February': 1, 'March': 2, 'April': 3,
    'May': 4, 'June': 5, 'July': 6, 'August': 7,
    'September': 8, 'October': 9, 'November': 10, 'December': 11
  }
  const parts = dateStr.split(' ')
  const day = parseInt(parts[0])
  const month = months[parts[1]]
  const year = parseInt(parts[2])
  return new Date(year, month, day)
}

function RaceCard({ name, distance, date, url, index = 0, themeColor = 'violet' }) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0 })
  const [progress, setProgress] = useState(0)
  
  const raceDate = parseDate(date)
  const isPast = raceDate < new Date()
  
  useEffect(() => {
    if (isPast) return
    
    const updateTime = () => {
      const now = new Date()
      const diff = raceDate - now
      
      if (diff > 0) {
        setTimeLeft({
          days: Math.floor(diff / (1000 * 60 * 60 * 24)),
          hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
        })
        
        const totalDays = 90
        const daysUntilRace = Math.floor(diff / (1000 * 60 * 60 * 24))
        const progressPercent = Math.max(0, Math.min(100, ((totalDays - daysUntilRace) / totalDays) * 100))
        setProgress(progressPercent)
      }
    }
    
    updateTime()
    const timer = setInterval(updateTime, 60000)
    return () => clearInterval(timer)
  }, [raceDate, isPast])

  return (
    <motion.a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: index * 0.08, duration: 0.3 }}
      className="block group"
    >
      <div className={`relative overflow-hidden rounded-2xl border transition-all ${
        isPast 
          ? 'bg-white/[0.02] border-white/[0.04]' 
          : 'bg-white/[0.03] border-white/[0.06] hover:bg-white/[0.05]'
      }`}>
        {!isPast && (
          <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-white/[0.04]">
            <motion.div
              className="h-full bg-accent"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              style={{ opacity: 0.6 }}
            />
          </div>
        )}
        
        <div className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-white font-semibold text-[15px]">{name}</h3>
                {isPast && (
                  <span className="bg-[#30D158]/15 text-[#30D158] text-[9px] font-semibold px-2 py-0.5 rounded-full">
                    DONE
                  </span>
                )}
              </div>
              
              <p className="text-white/35 text-sm mb-2">{distance}</p>
              
              <div className="flex items-center justify-between">
                <p className="text-white/20 text-xs font-medium">📅 {date}</p>
                
                {!isPast ? (
                  <div className="flex items-center gap-1.5">
                    <div className="flex items-center gap-0.5 bg-white/[0.04] rounded-lg px-2 py-1">
                      <span className="font-semibold text-xs text-white/60">{timeLeft.days}</span>
                      <span className="text-white/20 text-[9px] font-medium">d</span>
                    </div>
                    <div className="flex items-center gap-0.5 bg-white/[0.04] rounded-lg px-2 py-1">
                      <span className="font-semibold text-xs text-white/60">{timeLeft.hours}</span>
                      <span className="text-white/20 text-[9px] font-medium">h</span>
                    </div>
                    <div className="flex items-center gap-0.5 bg-white/[0.04] rounded-lg px-2 py-1">
                      <span className="font-semibold text-xs text-white/60">{timeLeft.minutes}</span>
                      <span className="text-white/20 text-[9px] font-medium">m</span>
                    </div>
                  </div>
                ) : (
                  <span className="text-[#30D158]/40 text-xs font-medium">Completed</span>
                )}
              </div>
            </div>
            
            <div className="text-white/10 group-hover:text-white/25 transition-colors ml-3">
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </motion.a>
  )
}

export default RaceCard
