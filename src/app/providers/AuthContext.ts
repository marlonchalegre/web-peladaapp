import { createContext, useContext } from 'react'

export type AuthContextValue = {
  token: string | null
  isAuthenticated: boolean
  signIn: (token: string) => void
  signOut: () => void
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
