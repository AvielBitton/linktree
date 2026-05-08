const KEYS = {
  activeSession: 'gym_active_session',
  customExercisesLocal: 'gym_custom_exercises_local',
  activeProgram: 'gym_active_program',
}

function read(key) {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function write(key, value) {
  if (typeof window === 'undefined') return
  localStorage.setItem(key, JSON.stringify(value))
}

export function getActiveSession() {
  return read(KEYS.activeSession)
}

export function saveActiveSession(session) {
  write(KEYS.activeSession, session)
}

export function clearActiveSession() {
  if (typeof window === 'undefined') return
  localStorage.removeItem(KEYS.activeSession)
}

export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

export function getActiveProgram() {
  return read(KEYS.activeProgram) || 'abc_recomp'
}

export function saveActiveProgram(programId) {
  write(KEYS.activeProgram, programId)
}
