import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import type { ProviderType, Role } from '../types'

export function RequireAuth() {
  const { session } = useAuth()
  return session ? <Outlet /> : <Navigate to="/login" replace />
}
export function RequireRole({ roles }: { roles: Role[] }) {
  const { session } = useAuth()
  return session && roles.includes(session.vaiTro) ? <Outlet /> : <Navigate to={session ? '/' : '/login'} replace />
}
export function RequireProviderType({ types }: { types: ProviderType[] }) {
  const { session } = useAuth()
  return session?.vaiTro === 'PROVIDER' && session.loaiNhaCungCap && types.includes(session.loaiNhaCungCap) ? <Outlet /> : <Navigate to="/provider" replace />
}
