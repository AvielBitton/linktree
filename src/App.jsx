import { motion } from 'framer-motion'
import SocialIcons from './components/SocialIcons'
import Footer from './components/Footer'

function App() {
  return (
    <div className="relative min-h-screen w-full overflow-x-hidden bg-black">
      <div className="fixed inset-0 bg-black" />

      <div className="relative z-10 min-h-screen flex flex-col">
        <main className="flex-1 flex flex-col items-center justify-center px-5 sm:px-6 pt-12 sm:pt-16 pb-8">

          {/* Archive Chip */}
          <motion.a
            href="/telaviv2026"
            className="mb-10"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="bg-white/[0.04] rounded-full px-4 py-2 border border-white/[0.06] flex items-center gap-2 hover:bg-white/[0.06] transition-colors">
              <span className="text-white/50 text-xs font-medium">Tel Aviv 2026</span>
              <svg className="w-3 h-3 text-white/30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M9 18l6-6-6-6"/>
              </svg>
            </div>
          </motion.a>

          {/* Hero */}
          <motion.div
            className="text-center mb-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.8 }}
          >
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white tracking-tight mb-2">
              Aviel Bitton
            </h1>
            <p className="text-white/40 text-sm sm:text-base font-medium">
              Live boldly as a <span className="text-accent font-semibold">FREE SPIRIT</span>
            </p>
          </motion.div>

          {/* Social Icons */}
          <motion.div
            className="mb-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <SocialIcons />
          </motion.div>

          {/* Building Next Prep */}
          <motion.div
            className="text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            <p className="text-white/15 text-[11px] uppercase tracking-[0.25em] font-medium mb-3">
              Next chapter
            </p>
            <p className="text-white/30 text-lg sm:text-xl font-medium tracking-tight">
              Building next prep...
            </p>
          </motion.div>
        </main>

        <Footer />
      </div>
    </div>
  )
}

export default App
