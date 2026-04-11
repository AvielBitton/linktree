'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useEditMode } from '../contexts/EditModeContext'

function EditModeToggle() {
  const { editMode, unlock, lock, mounted } = useEditMode()
  const [showPrompt, setShowPrompt] = useState(false)
  const [keyInput, setKeyInput] = useState('')
  const [error, setError] = useState('')

  if (!mounted) return null

  async function handleUnlock(e) {
    e.preventDefault()
    const success = await unlock(keyInput)
    if (success) {
      setShowPrompt(false)
      setKeyInput('')
      setError('')
    } else {
      setError('Invalid key')
    }
  }

  function handleToggle() {
    if (editMode) {
      lock()
    } else {
      setShowPrompt(true)
    }
  }

  return (
    <>
      <button
        onClick={handleToggle}
        className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
          editMode
            ? 'bg-emerald-500/15 text-emerald-400'
            : 'text-white/20 hover:text-white/40 hover:bg-white/[0.06]'
        }`}
        title={editMode ? 'Lock (read-only)' : 'Unlock (edit mode)'}
      >
        {editMode ? (
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        ) : (
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" />
            <path d="M7 11V7a5 5 0 0 1 9.9-1" />
          </svg>
        )}
      </button>

      <AnimatePresence>
        {showPrompt && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[90] bg-[#0D1117]/90 backdrop-blur-xl flex items-center justify-center p-6"
            onClick={() => { setShowPrompt(false); setError(''); setKeyInput('') }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-xs"
            >
              <div className="text-center mb-5">
                <div className="w-12 h-12 rounded-full bg-white/[0.06] flex items-center justify-center mx-auto mb-3">
                  <svg className="w-5 h-5 text-white/40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" />
                    <path d="M7 11V7a5 5 0 0 1 9.9-1" />
                  </svg>
                </div>
                <h2 className="text-white font-bold text-sm">Enter Edit Mode</h2>
                <p className="text-white/25 text-xs mt-1">Unlock to log weight, start workouts, and edit templates</p>
              </div>
              <form onSubmit={handleUnlock} className="space-y-3">
                <input
                  type="password"
                  value={keyInput}
                  onChange={e => setKeyInput(e.target.value)}
                  placeholder="Secret key"
                  autoFocus
                  className="w-full bg-white/[0.06] rounded-xl px-4 py-3 text-sm text-white text-center placeholder:text-white/20 focus:outline-none focus:ring-1 focus:ring-emerald-500/30"
                />
                {error && <p className="text-red-400 text-xs text-center">{error}</p>}
                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-emerald-500/15 text-emerald-400 font-semibold text-sm hover:bg-emerald-500/25 active:scale-[0.98] transition-all"
                >
                  Unlock
                </button>
                <button
                  type="button"
                  onClick={() => { setShowPrompt(false); setError(''); setKeyInput('') }}
                  className="w-full py-2 text-white/30 text-sm hover:text-white/50 transition-colors"
                >
                  Cancel
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

export default EditModeToggle
