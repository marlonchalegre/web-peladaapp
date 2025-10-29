import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { api } from '../../shared/api/client'
import { AuthContext, type AuthContextValue } from './AuthContext'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('authToken')
  })

  useEffect(() => {
    if (token) localStorage.setItem('authToken', token)
    else localStorage.removeItem('authToken')
    api.setToken(token)
  }, [token])

  const value = useMemo<AuthContextValue>(() => ({
    token,
    isAuthenticated: Boolean(token),
    signIn: (t) => setToken(t),
    signOut: () => setToken(null),
  }), [token])

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  )
}
