import { useMemo } from 'react'
import SocialIcons from './components/SocialIcons'
import RaceCard from './components/RaceCard'
import Footer from './components/Footer'
import { parseDate } from './components/Countdown'
import bgImage from './assets/bg.jpg'

function App() {
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
    <div className="relative min-h-screen w-full overflow-x-hidden">
      {/* Background Image */}
      <div 
        className="fixed inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url(${bgImage})`,
          backgroundColor: '#1a1a2e',
        }}
      />
      
      {/* Gradient Overlay - adds contrast for text readability */}
      <div 
        className="fixed inset-0"
        style={{
          background: 'linear-gradient(to top, rgba(0, 0, 0, 0.9) 0%, rgba(0, 0, 0, 0.65) 30%, rgba(0, 0, 0, 0.45) 60%, rgba(0, 0, 0, 0.3) 100%)',
        }}
      />

      {/* Content Container */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Main Content */}
        <main className="flex-1 flex flex-col items-center justify-center px-6 py-16">
          {/* Profile Section */}
          <div className="text-center mb-6">
            <h1 className="text-white text-2xl font-bold tracking-tight mb-2">
              Aviel Bitton
            </h1>
            <p className="text-white/70 text-sm font-semibold leading-relaxed max-w-[280px]">
              Live boldly as a FREE SPIRIT |<br />
              Join my journey | MARATHON
            </p>
          </div>

          {/* Social Icons */}
          <SocialIcons />

          {/* Upcoming & Past Races Section */}
          <div className="w-full max-w-[340px] mt-6">
            <h2 className="text-white text-center text-lg font-medium mb-4">
              Upcoming & Past Races
            </h2>
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
          </div>
        </main>

        {/* Footer */}
        <Footer />
      </div>
    </div>
  )
}

export default App
