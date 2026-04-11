import bcrypt from 'bcryptjs'
import crypto from 'crypto'

if (!globalThis.__gymSessions) {
  globalThis.__gymSessions = new Map()
}
const sessions = globalThis.__gymSessions
const TOKEN_TTL_MS = 12 * 60 * 60 * 1000

export async function login(key) {
  const hash = process.env.GYM_EDIT_KEY_HASH
  if (!hash || !key) return null
  const valid = await bcrypt.compare(key, hash)
  if (!valid) return null
  const token = crypto.randomBytes(32).toString('hex')
  sessions.set(token, { expiresAt: Date.now() + TOKEN_TTL_MS })
  cleanExpired()
  return token
}

export function validateToken(tokenString) {
  if (!tokenString) return false
  const session = sessions.get(tokenString)
  if (!session) return false
  if (Date.now() > session.expiresAt) {
    sessions.delete(tokenString)
    return false
  }
  return true
}

export function logout(tokenString) {
  if (tokenString) sessions.delete(tokenString)
}

function cleanExpired() {
  const now = Date.now()
  for (const [token, s] of sessions) {
    if (now > s.expiresAt) sessions.delete(token)
  }
}
