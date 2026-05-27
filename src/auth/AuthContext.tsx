import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react'
import {
  clearAuth,
  getMe,
  login as apiLogin,
  logoutApi,
  refreshToken as apiRefresh,
  setAccessToken,
  setOnAuthFailure,
  type User,
} from '../api/client'

interface AuthContextValue {
  user: User | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children, onAuthFailure }: { children: ReactNode; onAuthFailure: () => void }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const handleAuthFailure = useCallback(() => {
    setUser(null)
    onAuthFailure()
  }, [onAuthFailure])

  useEffect(() => {
    setOnAuthFailure(handleAuthFailure)
  }, [handleAuthFailure])

  // Restore session from stored refresh token on mount
  useEffect(() => {
    const stored = localStorage.getItem('refresh_token')
    if (!stored) {
      setIsLoading(false)
      return
    }
    apiRefresh(stored)
      .then(() => getMe())
      .then(setUser)
      .catch(() => {
        clearAuth()
      })
      .finally(() => setIsLoading(false))
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const tokens = await apiLogin(email, password)
    setAccessToken(tokens.access_token)
    localStorage.setItem('refresh_token', tokens.refresh_token)
    const me = await getMe()
    setUser(me)
  }, [])

  const logout = useCallback(async () => {
    const stored = localStorage.getItem('refresh_token')
    if (stored) {
      try { await logoutApi(stored) } catch { /* best-effort */ }
    }
    clearAuth()
    setUser(null)
    onAuthFailure()
  }, [onAuthFailure])

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
