import SocialIcons from './components/SocialIcons'
import Tabs from './components/Tabs'
import RacesSection from './components/RacesSection'
import StatsSection from './components/StatsSection'
import GearSection from './components/GearSection'
import Footer from './components/Footer'
import bgImage from './assets/bg.jpg'

function App() {
  const tabs = [
    {
      id: 'races',
      label: 'Races',
      content: <RacesSection />
    },
    {
      id: 'stats',
      label: 'Stats',
      content: <StatsSection />
    },
    {
      id: 'gear',
      label: 'Gear',
      content: <GearSection />
    }
  ]

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

      {/* Content Container - No vertical centering to prevent shifts */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Main Content - Aligned to top with padding */}
        <main className="flex-1 flex flex-col items-center px-6 pt-16 pb-8">
          {/* Profile Section - Static, never moves */}
          <div className="text-center mb-6">
            <h1 className="text-white text-2xl font-bold tracking-tight mb-2">
              Aviel Bitton
            </h1>
            <p className="text-white/70 text-sm font-semibold leading-relaxed max-w-[280px]">
              Live boldly as a FREE SPIRIT |<br />
              Join my journey | MARATHON
            </p>
          </div>

          {/* Social Icons - Static, never moves */}
          <div className="mb-6">
            <SocialIcons />
          </div>

          {/* Tab-based Content - Only this section changes */}
          <Tabs tabs={tabs} defaultTab="races" />
        </main>

        {/* Footer */}
        <Footer />
      </div>
    </div>
  )
}

export default App
