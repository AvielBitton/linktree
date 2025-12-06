import SocialIcons from './components/SocialIcons'
import Tabs from './components/Tabs'
import RacesSection from './components/RacesSection'
import StatsSection from './components/StatsSection'
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

          {/* Tab-based Content */}
          <div className="mt-6">
            <Tabs tabs={tabs} defaultTab="races" />
          </div>
        </main>

        {/* Footer */}
        <Footer />
      </div>
    </div>
  )
}

export default App
