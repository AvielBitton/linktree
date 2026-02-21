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

const allRaces = [
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

function RacesSection({ excludeRaces = [], themeColor = 'violet' }) {
  const races = allRaces.filter(r => !excludeRaces.includes(r.id))

  const sortedRaces = useMemo(() => {
    const now = new Date()
    const upcoming = races.filter(r => parseDate(r.date) >= now)
    const past = races.filter(r => parseDate(r.date) < now)
    upcoming.sort((a, b) => parseDate(a.date) - parseDate(b.date))
    past.sort((a, b) => parseDate(b.date) - parseDate(a.date))
    return [...upcoming, ...past]
  }, [races])

  const upcomingCount = useMemo(() => {
    const now = new Date()
    return races.filter(r => parseDate(r.date) >= now).length
  }, [races])

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-white/25 text-[11px] uppercase tracking-wider font-medium">Race Calendar</h2>
        <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-white/[0.04] text-white/30">
          {upcomingCount} upcoming
        </span>
      </div>
      
      <div className="space-y-2.5">
        {sortedRaces.map((race, index) => (
          <RaceCard
            key={race.id}
            name={race.name}
            distance={race.distance}
            date={race.date}
            url={race.url}
            index={index}
            themeColor={themeColor}
          />
        ))}
      </div>
    </div>
  )
}

export default RacesSection
