import { login, logout } from '@/lib/auth'
import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const { key } = await request.json()
    if (!key || typeof key !== 'string' || key.length > 200) {
      return NextResponse.json({ error: 'Invalid key' }, { status: 400 })
    }
    const token = await login(key)
    if (!token) {
      return NextResponse.json({ error: 'Invalid key' }, { status: 401 })
    }
    return NextResponse.json({ token })
  } catch {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 })
  }
}

export async function DELETE(request) {
  const token = request.headers.get('x-session-token')
  logout(token)
  return NextResponse.json({ ok: true })
}
