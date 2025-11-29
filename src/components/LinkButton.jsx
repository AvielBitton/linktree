import { useState, useRef, useEffect } from 'react'

function LinkButton({ title, url, icon, isMenuOpen, onMenuToggle }) {
  const menuRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        if (isMenuOpen) onMenuToggle()
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isMenuOpen, onMenuToggle])

  return (
    <div className="relative" ref={menuRef}>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="link-button group flex items-center w-full bg-[rgba(38,38,38,0.8)] backdrop-blur-sm rounded-2xl px-4 py-4 hover:bg-[rgba(50,50,50,0.9)]"
      >
        {/* Left Icon */}
        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-white/10 text-white">
          {icon}
        </div>

        {/* Title */}
        <span className="flex-1 text-white font-semibold text-center text-[15px]">
          {title}
        </span>

        {/* Right Menu Button */}
        <button
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            onMenuToggle()
          }}
          className="flex items-center justify-center w-10 h-10 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="12" cy="6" r="2" />
            <circle cx="12" cy="12" r="2" />
            <circle cx="12" cy="18" r="2" />
          </svg>
        </button>
      </a>

      {/* Dropdown Menu */}
      {isMenuOpen && (
        <div className="absolute right-0 top-full mt-2 w-48 bg-[rgba(30,30,30,0.95)] backdrop-blur-md rounded-xl shadow-2xl border border-white/10 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          <button
            onClick={() => {
              navigator.clipboard.writeText(url)
              onMenuToggle()
            }}
            className="flex items-center gap-3 w-full px-4 py-3 text-white/80 hover:bg-white/10 hover:text-white transition-colors text-sm"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
            Copy link
          </button>
          <button
            onClick={onMenuToggle}
            className="flex items-center gap-3 w-full px-4 py-3 text-white/80 hover:bg-white/10 hover:text-white transition-colors text-sm"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path>
              <polyline points="16 6 12 2 8 6"></polyline>
              <line x1="12" y1="2" x2="12" y2="15"></line>
            </svg>
            Share
          </button>
        </div>
      )}
    </div>
  )
}

export default LinkButton

