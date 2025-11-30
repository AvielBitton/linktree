import { useState, useMemo } from 'react'
import LinkButton from './components/LinkButton'
import SocialIcons from './components/SocialIcons'
import RaceCard from './components/RaceCard'
import Footer from './components/Footer'
import { parseDate } from './components/Countdown'
import bgImage from './assets/bg.jpg'

function App() {
  const [menuOpen, setMenuOpen] = useState(null)

  const links = [
    {
      id: 'instagram',
      title: 'Instagram',
      url: 'https://instagram.com/avielbitton',
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
        </svg>
      ),
    },
    {
      id: 'tiktok',
      title: 'TikTok',
      url: 'https://tiktok.com/@aviel_bitton',
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
        </svg>
      ),
    },
    {
      id: 'strava',
      title: 'Strava',
      url: 'https://strava.app.link/vggrqLo9GYb',
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169"/>
        </svg>
      ),
    },
  ]

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
      
      {/* Gradient Overlay - bottom to top, black to transparent */}
      <div 
        className="fixed inset-0"
        style={{
          background: 'linear-gradient(to top, rgba(0, 0, 0, 0.85) 0%, rgba(0, 0, 0, 0.6) 30%, rgba(0, 0, 0, 0.3) 60%, transparent 100%)',
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
            <p className="text-white/80 text-sm leading-relaxed max-w-[280px]">
              Live boldly as a FREE SPIRIT |<br />
              Join my journey | MARATHON
            </p>
          </div>

          {/* Social Icons */}
          <SocialIcons />

          {/* Link Buttons */}
          <div className="w-full max-w-[340px] space-y-3 mt-6">
            {links.map((link) => (
              <LinkButton
                key={link.id}
                title={link.title}
                url={link.url}
                icon={link.icon}
                isMenuOpen={menuOpen === link.id}
                onMenuToggle={() => setMenuOpen(menuOpen === link.id ? null : link.id)}
              />
            ))}
          </div>

          {/* Upcoming & Past Races Section - BELOW LINKS */}
          <div className="w-full max-w-[340px] mt-10">
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
