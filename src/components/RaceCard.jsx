import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

// Parse date string to Date object
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
        
        // Calculate progress (from 90 days before race to race day)
        const totalDays = 90
        const daysUntilRace = Math.floor(diff / (1000 * 60 * 60 * 24))
        const progressPercent = Math.max(0, Math.min(100, ((totalDays - daysUntilRace) / totalDays) * 100))
        setProgress(progressPercent)
      }
    }
    
    updateTime()
    const timer = setInterval(updateTime, 60000) // Update every minute
    return () => clearInterval(timer)
  }, [raceDate, isPast])

  return (
    <motion.a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.4 }}
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      className="block relative group"
    >
      {/* Glow Effect */}
      <div className={`absolute inset-0 rounded-2xl blur-xl transition-opacity duration-500 opacity-0 group-hover:opacity-100 ${
        isPast 
          ? 'bg-green-500/20' 
          : themeColor === 'emerald' 
            ? 'bg-gradient-to-r from-emerald-500/30 to-teal-500/30'
            : 'bg-gradient-to-r from-violet-500/30 to-fuchsia-500/30'
      }`} />
      
      {/* Card */}
      <div className={`relative overflow-hidden rounded-2xl border transition-all duration-300 ${
        isPast 
          ? 'bg-white/5 border-green-500/20' 
          : themeColor === 'emerald'
            ? 'bg-gradient-to-br from-white/10 to-white/5 border-white/10 group-hover:border-emerald-500/30'
            : 'bg-gradient-to-br from-white/10 to-white/5 border-white/10 group-hover:border-violet-500/30'
      }`}>
        
        {/* Progress Bar Background */}
        {!isPast && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/5">
            <motion.div
              className={`h-full bg-gradient-to-r ${themeColor === 'emerald' ? 'from-emerald-500 to-teal-500' : 'from-violet-500 to-fuchsia-500'}`}
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </div>
        )}
        
        <div className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              {/* Race Name */}
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-white font-bold text-base">
                  {name}
                </h3>
                {isPast && (
                  <span className="bg-green-500/20 text-green-400 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    ✓ DONE
                  </span>
                )}
              </div>
              
              {/* Distance */}
              <p className="text-white/60 text-sm mb-2">
                {distance}
              </p>
              
              {/* Date & Countdown */}
              <div className="flex items-center justify-between">
                <p className="text-white/40 text-xs">
                  📅 {date}
                </p>
                
                {!isPast ? (
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 bg-white/5 rounded-lg px-2 py-1">
                      <span className={`font-bold text-xs ${themeColor === 'emerald' ? 'text-emerald-400' : 'text-violet-400'}`}>{timeLeft.days}</span>
                      <span className="text-white/30 text-[10px]">d</span>
                    </div>
                    <div className="flex items-center gap-1 bg-white/5 rounded-lg px-2 py-1">
                      <span className={`font-bold text-xs ${themeColor === 'emerald' ? 'text-emerald-400' : 'text-violet-400'}`}>{timeLeft.hours}</span>
                      <span className="text-white/30 text-[10px]">h</span>
                    </div>
                    <div className="flex items-center gap-1 bg-white/5 rounded-lg px-2 py-1">
                      <span className={`font-bold text-xs ${themeColor === 'emerald' ? 'text-emerald-400' : 'text-violet-400'}`}>{timeLeft.minutes}</span>
                      <span className="text-white/30 text-[10px]">m</span>
                    </div>
                  </div>
                ) : (
                  <span className="text-green-400/60 text-xs">Completed</span>
                )}
              </div>
            </div>
            
            {/* External Link Icon */}
            <div className={`text-white/20 transition-colors ml-3 ${themeColor === 'emerald' ? 'group-hover:text-emerald-400' : 'group-hover:text-violet-400'}`}>
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
