import { useMemo } from 'react'
import { motion } from 'framer-motion'
import RaceCard from './RaceCard'

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

function RacesSection() {
  const races = [
    {
      id: 'dead-sea-marathon',
      name: 'Dead Sea Marathon',
      distance: '21 km (Half-Marathon)',
      date: '7 February 2026',
      url: 'https://deadsea.run/en/',
    },
    {
      id: 'tel-aviv-marathon',
      name: 'Tel Aviv Marathon',
      distance: 'Marathon (42.2 km)',
      date: '28 February 2026',
      url: 'https://www.tlvmarathon.co.il/',
    },
    {
      id: 'hever-race',
      name: 'Hever race',
      distance: '5 km',
      date: '5 December 2025',
      url: 'https://www.runh.co.il/MenuDefault.aspx?Id=9172',
    },
  ]

  // Sort races: upcoming first (by nearest date), then past (by most recent)
  const sortedRaces = useMemo(() => {
    const now = new Date()
    
    const upcoming = races.filter(r => parseDate(r.date) >= now)
    const past = races.filter(r => parseDate(r.date) < now)
    
    // Sort upcoming by soonest first
    upcoming.sort((a, b) => parseDate(a.date) - parseDate(b.date))
    
    // Sort past by most recent first
    past.sort((a, b) => parseDate(b.date) - parseDate(a.date))
    
    return [...upcoming, ...past]
  }, [])

  const upcomingCount = useMemo(() => {
    const now = new Date()
    return races.filter(r => parseDate(r.date) >= now).length
  }, [])

  return (
    <div className="space-y-4">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center justify-between px-1"
      >
        <div>
          <h2 className="text-white/60 text-xs uppercase tracking-wider">Race Calendar</h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="bg-violet-500/20 text-violet-400 text-xs font-medium px-2 py-1 rounded-full">
            {upcomingCount} upcoming
          </span>
        </div>
      </motion.div>
      
      {/* Race Cards */}
      <div className="space-y-3">
        {sortedRaces.map((race, index) => (
          <RaceCard
            key={race.id}
            name={race.name}
            distance={race.distance}
            date={race.date}
            url={race.url}
            index={index}
          />
        ))}
      </div>
    </div>
  )
}

export default RacesSection
