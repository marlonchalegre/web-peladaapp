import { useEffect, useMemo, useState, useCallback, type ReactNode } from 'react'
import { api, type User } from '../../shared/api/client'
import { AuthContext, type AuthContextValue } from './AuthContext'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('authToken')
  })
  
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem('authUser')
    return stored ? JSON.parse(stored) : null
  })

  const signOut = useCallback(() => {
    setToken(null)
    setUser(null)
    localStorage.removeItem('authToken')
    localStorage.removeItem('authUser')
  }, [])

  useEffect(() => {
    if (token) localStorage.setItem('authToken', token)
    else localStorage.removeItem('authToken')
    api.setToken(token)
  }, [token])

  useEffect(() => {
    if (user) localStorage.setItem('authUser', JSON.stringify(user))
    else localStorage.removeItem('authUser')
  }, [user])

  // Setup global auth error handler
  useEffect(() => {
    const handleAuthError = () => {
      // Clear invalid token and redirect to login
      signOut()
    }
    
    api.setAuthErrorHandler(handleAuthError)
  }, [signOut])

  const value = useMemo<AuthContextValue>(() => ({
    token,
    user,
    isAuthenticated: Boolean(token && user),
    signIn: (t, u) => {
      setToken(t)
      setUser(u)
    },
    signOut,
  }), [token, user, signOut])

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  )
}
