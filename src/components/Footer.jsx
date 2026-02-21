function Footer({ onToggleStealth }) {
  return (
    <footer className="relative z-10 pb-8 pt-4">
      <div className="flex items-center justify-center gap-3 text-white/20 text-xs">
        <a 
          href="#" 
          className="hover:text-white/40 transition-colors"
          onClick={(e) => {
            e.preventDefault()
          }}
        >
          Report
        </a>
        <span 
          className="cursor-pointer select-none hover:text-white/40 transition-colors"
          onClick={onToggleStealth}
        >
          ·
        </span>
        <a 
          href="#" 
          className="hover:text-white/40 transition-colors"
          onClick={(e) => {
            e.preventDefault()
          }}
        >
          Privacy
        </a>
      </div>
    </footer>
  )
}

export default Footer
