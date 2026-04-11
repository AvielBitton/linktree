'use client'

import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import * as authClient from '@/lib/auth-client'

const EditModeContext = createContext({
  editMode: false,
  unlock: async () => false,
  lock: () => {},
  mounted: false,
})

export function EditModeProvider({ children }) {
  const [editMode, setEditMode] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setEditMode(authClient.isLoggedIn())
    setMounted(true)
  }, [])

  const unlock = useCallback(async (key) => {
    const success = await authClient.login(key)
    if (success) {
      setEditMode(true)
      return true
    }
    return false
  }, [])

  const lock = useCallback(() => {
    authClient.logout()
    setEditMode(false)
  }, [])

  return (
    <EditModeContext.Provider value={{ editMode, unlock, lock, mounted }}>
      {children}
    </EditModeContext.Provider>
  )
}

export function useEditMode() {
  return useContext(EditModeContext)
}
