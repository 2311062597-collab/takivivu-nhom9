import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import { authApi } from '../api/services'
import { readSession, writeSession } from '../api/client'
import type { LoginRequest, LoginResponse } from '../types'

interface AuthValue {
  session: LoginResponse | null
  login: (body: LoginRequest) => Promise<LoginResponse>
  logout: () => Promise<void>
}
const AuthContext = createContext<AuthValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<LoginResponse | null>(() => readSession())
  const login = async (body: LoginRequest) => {
    const data = await authApi.login(body)
    writeSession(data)
    setSession(data)
    return data
  }
  const logout = async () => {
    try { if (session?.refreshToken) await authApi.logout(session.refreshToken) } finally { writeSession(null); setSession(null) }
  }
  const value = useMemo(() => ({ session, login, logout }), [session])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
