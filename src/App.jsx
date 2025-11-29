import { useState } from 'react'
import LinkButton from './components/LinkButton'
import SocialIcons from './components/SocialIcons'
import AsteriskButton from './components/AsteriskButton'
import Footer from './components/Footer'

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
  ]

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden">
      {/* Background Image */}
      <div 
        className="fixed inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url('/linktree/bg.jpg')`,
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
        {/* Top-left Asterisk Button */}
        <AsteriskButton />

        {/* Main Content */}
        <main className="flex-1 flex flex-col items-center justify-center px-6 py-16">
          {/* Profile Section */}
          <div className="text-center mb-6">
            <h1 className="text-white text-2xl font-bold tracking-tight mb-2">
              avielbitton
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

          {/* Bottom CTA */}
          <a
            href="https://linktr.ee"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-10 cta-pulse"
          >
            <div className="bg-white text-black text-sm font-semibold px-5 py-2.5 rounded-full flex items-center gap-2 hover:bg-white/90 transition-colors shadow-lg">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M7.953 15.066l-.038.086c-.578 1.228-.073 2.686 1.128 3.316 1.2.631 2.687.188 3.382-.939l.055-.089c.072-.127.078-.27.016-.386-.06-.117-.18-.2-.31-.2h-1.05c-.274 0-.5-.226-.5-.5v-2.5c0-.274.226-.5.5-.5h4.818c.274 0 .5.226.5.5v2.5c0 .274-.226.5-.5.5h-1.05c-.13 0-.25.083-.31.2-.062.115-.056.26.016.387l.055.088c.695 1.127 2.182 1.57 3.382.94 1.2-.631 1.706-2.089 1.128-3.317l-.038-.086c-.059-.133-.043-.285.042-.402.084-.115.22-.18.363-.162l.09.01c1.306.154 2.53-.742 2.762-2.035.232-1.293-.593-2.53-1.882-2.828l-.091-.018c-.137-.028-.253-.124-.303-.254-.05-.13-.03-.277.054-.386l.057-.074c.858-1.032.734-2.564-.283-3.454-1.017-.89-2.555-.822-3.485.158l-.065.072c-.096.113-.246.16-.389.12-.144-.04-.253-.156-.278-.302l-.015-.092c-.203-1.296-1.404-2.218-2.715-2.082-1.311.135-2.286 1.287-2.205 2.6l.006.092c.01.146-.056.286-.175.365-.118.08-.271.085-.396.016l-.08-.046c-1.156-.623-2.61-.161-3.28.986-.67 1.147-.29 2.617.847 3.32l.079.047c.124.072.2.204.2.347 0 .143-.076.275-.2.347l-.08.047c-1.137.702-1.517 2.173-.847 3.32.67 1.147 2.124 1.609 3.281.986l.08-.046c.124-.07.277-.064.395.016.12.079.185.22.175.365l-.006.092c-.057.91.373 1.787 1.104 2.289z"/>
              </svg>
              Join avielbitton on Linktree
            </div>
          </a>
        </main>

        {/* Footer */}
        <Footer />
      </div>
    </div>
  )
}

export default App

