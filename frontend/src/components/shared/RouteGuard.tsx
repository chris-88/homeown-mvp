import { Navigate } from 'react-router-dom'
import { useAuth } from '@/lib/auth'
import type { Role } from '@/types'

interface RouteGuardProps {
  requiredRole: Role
  children: React.ReactNode
}

export function RouteGuard({ requiredRole, children }: RouteGuardProps) {
  const { user, profile, loading } = useAuth()

  if (loading) {
    return <div className="flex h-screen items-center justify-center"><p className="text-muted-foreground">Loading…</p></div>
  }

  if (!user) return <Navigate to="/auth/login" replace />

  if (profile?.role !== requiredRole && !(requiredRole === 'staff' && profile?.role === 'admin')) {
    if (profile?.role === 'client') return <Navigate to="/app/client" replace />
    if (profile?.role === 'staff' || profile?.role === 'admin') return <Navigate to="/app/staff" replace />
    if (profile?.role === 'circle') return <Navigate to="/app/circle" replace />
    return <Navigate to="/auth/login" replace />
  }

  return <>{children}</>
}
