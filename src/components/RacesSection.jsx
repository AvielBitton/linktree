import { useMemo } from 'react'
import RaceCard from './RaceCard'
import { parseDate } from './Countdown'

function RacesSection() {
  const races = [
    {
      id: 'hever-race',
      name: 'Hever race',
      distance: '5 km',
      date: '5 December 2025',
      url: 'https://www.runh.co.il/MenuDefault.aspx?Id=9172',
    },
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

  return (
    <div className="space-y-3">
      {sortedRaces.map((race) => (
        <RaceCard
          key={race.id}
          name={race.name}
          distance={race.distance}
          date={race.date}
          url={race.url}
        />
      ))}
    </div>
  )
}

export default RacesSection
