const TOKEN_KEY = 'gym_session_token'

export async function login(key) {
  const res = await fetch('/api/gym/auth', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key }),
  })
  const data = await res.json()
  if (data.token) {
    localStorage.setItem(TOKEN_KEY, data.token)
    return true
  }
  return false
}

export function logout() {
  const token = getSessionToken()
  if (token) {
    fetch('/api/gym/auth', {
      method: 'DELETE',
      headers: { 'x-session-token': token },
    })
  }
  localStorage.removeItem(TOKEN_KEY)
}

export function getSessionToken() {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(TOKEN_KEY)
}

export function isLoggedIn() {
  return !!getSessionToken()
}
