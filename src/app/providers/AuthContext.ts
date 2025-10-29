import { createContext, useContext } from 'react'
import type { User } from '../../shared/api/client'

export type AuthContextValue = {
  token: string | null
  user: User | null
  isAuthenticated: boolean
  signIn: (token: string, user: User) => void
  signOut: () => void
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
