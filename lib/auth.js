import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import supabase from './supabase.js'

const TOKEN_TTL_MS = 12 * 60 * 60 * 1000

export async function login(key) {
  const hash = process.env.GYM_EDIT_KEY_HASH
  if (!hash || !key) return null
  const valid = await bcrypt.compare(key, hash)
  if (!valid) return null
  const token = crypto.randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MS).toISOString()
  await supabase.from('sessions').insert({ token, expires_at: expiresAt })
  cleanExpired()
  return token
}

export async function validateToken(tokenString) {
  if (!tokenString) return false
  const { data } = await supabase
    .from('sessions')
    .select('expires_at')
    .eq('token', tokenString)
    .single()
  if (!data) return false
  if (new Date(data.expires_at) < new Date()) {
    await supabase.from('sessions').delete().eq('token', tokenString)
    return false
  }
  return true
}

export async function logout(tokenString) {
  if (tokenString) {
    await supabase.from('sessions').delete().eq('token', tokenString)
  }
}

async function cleanExpired() {
  await supabase.from('sessions').delete().lt('expires_at', new Date().toISOString())
}
