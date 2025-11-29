function Footer() {
  return (
    <footer className="relative z-10 pb-6 pt-4">
      <div className="flex items-center justify-center gap-2 text-white/50 text-xs">
        <a 
          href="#" 
          className="hover:text-white/80 transition-colors"
          onClick={(e) => {
            e.preventDefault()
            // Report functionality
          }}
        >
          Report
        </a>
        <span>·</span>
        <a 
          href="#" 
          className="hover:text-white/80 transition-colors"
          onClick={(e) => {
            e.preventDefault()
            // Privacy functionality
          }}
        >
          Privacy
        </a>
      </div>
    </footer>
  )
}

export default Footer

