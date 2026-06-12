import { Navigate } from 'react-router-dom'
import { useAuth } from '@/lib/auth'
import { STAFF_ROLES } from '@/types'
import type { Role } from '@/types'

interface RouteGuardProps {
  // 'staff' is a meta-sentinel meaning "any staff role"
  requiredRole: Role | 'staff'
  children: React.ReactNode
}

export function RouteGuard({ requiredRole, children }: RouteGuardProps) {
  const { user, profile, loading } = useAuth()

  if (loading) {
    return <div className="flex h-screen items-center justify-center"><p className="text-muted-foreground">Loading…</p></div>
  }

  if (!user) return <Navigate to="/auth/login" replace />

  const role = profile?.role

  const allowed =
    requiredRole === 'staff'
      ? !!role && STAFF_ROLES.has(role)
      : role === requiredRole

  if (!allowed) {
    if (role === 'client') return <Navigate to="/app/client" replace />
    if (role && STAFF_ROLES.has(role)) return <Navigate to="/app/staff" replace />
    if (role === 'circle') return <Navigate to="/app/circle" replace />
    return <Navigate to="/auth/login" replace />
  }

  return <>{children}</>
}
